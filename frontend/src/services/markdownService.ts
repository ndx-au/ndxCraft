import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItTaskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import go from 'highlight.js/lib/languages/go';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('go', go);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);

const BLOCK_OPEN_RULES = [
  'paragraph_open',
  'heading_open',
  'blockquote_open',
  'bullet_list_open',
  'ordered_list_open',
  'list_item_open',
  'table_open',
  'thead_open',
  'tbody_open',
  'tr_open',
  'fence',
  'hr',
  'html_block',
] as const;

function lineClass(token: { map: number[] | null }): string {
  if (!token.map) return '';
  return `data-line-${token.map[0] + 1}`;
}

function addLineClassToOpenTag(tag: string, className: string): string {
  if (!className) return tag;
  if (tag.includes('class="')) {
    return tag.replace('class="', `class="${className} `);
  }
  return tag.replace(/^<(\w+)/, `<$1 class="${className}"`);
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch {
        // fall through
      }
    }
    try {
      return hljs.highlightAuto(str).value;
    } catch {
      return md.utils.escapeHtml(str);
    }
  },
})
  .use(markdownItMultimdTable)
  .use(markdownItTaskLists)
  .use(markdownItAnchor, { permalink: false });

for (const rule of BLOCK_OPEN_RULES) {
  const defaultRender = md.renderer.rules[rule] ?? md.renderer.renderToken.bind(md.renderer);
  md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const cls = lineClass(token);
    if (rule === 'fence') {
      const info = token.info ? md.utils.escapeHtml(token.info.trim()) : '';
      const lang = info ? info.split(/\s+/)[0] : '';
      const highlighted = md.options.highlight
        ? md.options.highlight(token.content, lang, info) || md.utils.escapeHtml(token.content)
        : md.utils.escapeHtml(token.content);
      const langClass = lang ? ` language-${lang}` : '';
      const line = cls ? ` ${cls}` : '';
      return `<pre class="hljs${line}"><code class="hljs${langClass}">${highlighted}</code></pre>\n`;
    }
    const rendered = defaultRender(tokens, idx, options, env, self);
    if (!cls) return rendered;
    return addLineClassToOpenTag(rendered, cls);
  };
}

export const convertToHtml = (markdownContent: string): string => {
  try {
    return md.render(markdownContent);
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return `<div class='text-red-500 p-4'>Failed to render content: ${(error as Error).message}</div>`;
  }
};

export interface AstNode {
  id: string;
  title: string;
  level: number;
  children: AstNode[];
  context: string;
  line?: number;
}

export const parseAST = (markdownContent: string): AstNode[] => {
  try {
    const tokens = md.parse(markdownContent, {});
    const flat: { title: string; level: number; line: number; id: string }[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== 'heading_open') continue;

      const level = Number(token.tag.replace('h', ''));
      const inline = tokens[i + 1];
      const title = inline?.type === 'inline' ? inline.content : '';
      const line = token.map ? token.map[0] + 1 : 0;
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      flat.push({ title, level, line, id });
    }

    const root: AstNode[] = [];
    const stack: AstNode[] = [];

    for (const heading of flat) {
      const node: AstNode = {
        id: heading.id,
        title: heading.title,
        level: heading.level,
        children: [],
        context: 'section',
        line: heading.line,
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack.push(node);
    }

    return root;
  } catch (error) {
    console.error('AST parsing error:', error);
    return [];
  }
};
