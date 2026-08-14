import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  imagePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertCodeBlock,
  ListsToggle,
  CodeToggle,
  Separator,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

export interface VisualEditorHandle {
  getMarkdown: () => string
  setMarkdown: (md: string) => void
  focus: () => void
}

interface Props {
  markdown: string
  onChange: (md: string) => void
}

const VisualEditor = forwardRef<VisualEditorHandle, Props>(({ markdown, onChange }, ref) => {
  const editorRef = useRef<MDXEditorMethods>(null)
  const onChangeRef = useRef(onChange)
  const skip = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editorRef.current?.getMarkdown() ?? '',
    setMarkdown: (md) => {
      skip.current = true
      editorRef.current?.setMarkdown(md)
    },
    focus: () => editorRef.current?.focus(),
  }))

  return (
    <div id="ndx-visual-editor" className="h-full overflow-auto bg-card">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        className="ndx-mdx"
        contentEditableClassName="craft-prose max-w-3xl mx-auto px-8 py-10 min-h-full"
        onChange={(md) => {
          if (skip.current) {
            skip.current = false
            return
          }
          onChangeRef.current(md)
        }}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          imagePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              text: 'Plain',
              ts: 'TypeScript',
              js: 'JavaScript',
              go: 'Go',
              lua: 'Lua',
              yaml: 'YAML',
              bash: 'Bash',
              json: 'JSON',
              markdown: 'Markdown',
            },
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <CreateLink />
                <InsertTable />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  )
})

VisualEditor.displayName = 'VisualEditor'
export default VisualEditor
