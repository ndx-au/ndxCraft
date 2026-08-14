import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { convertToHtml } from '@/services/markdownService'

interface Props {
  content: string
  isFocused: boolean
  onToggleFocus: () => void
  cursorLine?: number
}

export default function LocalPreview({ content, isFocused, onToggleFocus, cursorLine }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)

  const srcDoc = useMemo(() => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { height: 100%; margin: 0; }
  body {
    padding: 2.25rem 2.5rem;
    font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
    color: #1A1F27;
    background: #F7F6F3;
    line-height: 1.65;
    font-size: 16px;
  }
  h1, h2, h3, h4 { font-weight: 600; letter-spacing: -0.02em; margin-top: 1.75em; }
  h1 { font-size: 2em; margin-top: 0; }
  code { background: #EFECE6; padding: 0.15em 0.4em; border-radius: 4px; font-family: "IBM Plex Mono", monospace; font-size: 0.9em; }
  pre { background: #1A1F27; color: #E8EEF5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; color: inherit; }
  blockquote { border-left: 3px solid #0E8AA8; padding-left: 1rem; color: #5C6773; }
  img { max-width: 100%; }
  a { color: #0E8AA8; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #E7E2D8; padding: 0.4rem 0.6rem; text-align: left; }
</style>
</head>
<body>
<div id="content"></div>
<script>
  const contentDiv = document.getElementById('content');
  function scrollToLine(line) {
    if (!line) return;
    let target = document.querySelector('.data-line-' + line);
    if (!target) {
      for (let i = line; i > 0; i--) {
        target = document.querySelector('.data-line-' + i);
        if (target) break;
      }
    }
    target?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  window.addEventListener('keydown', (e) => {
    if (['F9','F10','F11','Escape'].includes(e.key)) {
      e.preventDefault();
      window.parent.postMessage({ type: 'preview-keydown', key: e.key }, '*');
    }
  });
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type === 'update-content') contentDiv.innerHTML = data.html;
    if (data.type === 'scroll-to-line') scrollToLine(data.line);
  });
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
      e.preventDefault();
      window.parent.postMessage({ type: 'open-browser', url: href }, '*');
    }
  });
  window.parent.postMessage({ type: 'preview-ready' }, '*');
</script>
</body>
</html>`, [])

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (event.data.type === 'preview-ready') setLoaded(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!loaded || !iframeRef.current) return
    iframeRef.current.contentWindow?.postMessage({ type: 'update-content', html: convertToHtml(content) }, '*')
  }, [content, loaded])

  useEffect(() => {
    if (!loaded || cursorLine === undefined) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'scroll-to-line', line: cursorLine }, '*')
  }, [cursorLine, loaded])

  return (
    <div id="ndx-preview-container" className="relative h-full w-full bg-[#F7F6F3] flex flex-col">
      <button
        type="button"
        aria-label={isFocused ? 'Exit preview fullscreen' : 'Preview fullscreen'}
        onClick={onToggleFocus}
        className="absolute top-2 right-3 z-10 h-8 w-8 rounded-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 bg-white/80 cursor-pointer"
      >
        {isFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
      <iframe
        id="ndx-preview-iframe"
        ref={iframeRef}
        title="Local preview"
        srcDoc={srcDoc}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
