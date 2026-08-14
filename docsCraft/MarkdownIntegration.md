# Markdown Integration in ndxCraft

This document explains how the [markdown-it](https://github.com/markdown-it/markdown-it) processor is integrated into ndxCraft to provide real-time rendering, document structure navigation, and visual editing capabilities.

## Overview

ndxCraft utilizes **markdown-it** with GFM table/task-list plugins and highlight.js for syntax highlighting. This allows the application to run the full Markdown processing pipeline entirely on the client-side (within the React frontend), ensuring fast updates without round-trips to the Go backend.

## Core Components

The integration is primarily handled in two files:

1. `frontend/src/services/markdownService.ts`: The service layer that interfaces directly with the markdown-it API.
2. `frontend/src/components/Preview.tsx`: The UI component that displays the rendered output.

### 1. The Markdown Service (`markdownService.ts`)

This service is responsible for initializing the markdown-it processor and exposing methods for conversion and parsing.

- **Initialization**: A shared `MarkdownIt` instance is created with multimd-table, task-lists, anchor, and highlight.js plugins.
- **Source Mapping**: Custom renderer rules add `data-line-N` classes to block-level tokens using `token.map[0] + 1`. This is crucial for **Source Mapping**, allowing the editor and preview to scroll in sync.
- **HTML Conversion**: The `convertToHtml` function takes the raw Markdown string and converts it to HTML.
- **AST Parsing**: The `parseAST` function walks the markdown-it token stream for `heading_open` tokens. This builds the **Structure View** (Outline) in the left sidebar, extracting titles, levels, and line numbers.

### 2. The Preview Component (`Preview.tsx`)

The Preview component renders the generated HTML in an isolated environment.

- **Iframe Isolation**: The content is rendered inside a sandboxed `<iframe>`. This ensures that the document's styles (which might include user-provided CSS) do not bleed into the application's UI, and vice versa.
- **Communication**: The React component communicates with the iframe via the `postMessage` API. It sends:
  - `update-content`: The new HTML string to display.
  - `update-css`: Custom CSS to inject into the iframe head.
  - `scroll-to-line`: Instructions to scroll the view to a specific line.
- **Event Handling**: The iframe captures user interactions (clicks, scrolling, typing) and sends messages back to the parent component.

## Key Features Powered by markdown-it

### Real-time Preview

As the user types in the Monaco Editor, the content is sent to `markdownService.convertToHtml`. The resulting HTML is instantly pushed to the preview iframe.

### Synchronized Scrolling

Because the custom renderer adds line number metadata to HTML elements, the application can map a cursor position in the source text to a specific DOM element in the preview.

### Document Structure (AST)

The "Structure" tab in the sidebar uses the `parseAST` method. By walking the markdown-it token stream, we get a semantic understanding of the document hierarchy (sections, subsections) rather than just regex-matching headers. This allows for a robust and accurate outline view.

### Visual Editing (Experimental)

When "Visual Edit" mode is enabled:

1. The preview iframe's body is set to `contentEditable="true"`.
2. User keystrokes are captured.
3. Changes are sent back to the application.
4. *Note*: Currently, this is a destructive operation as it relies on `innerText`, which may strip Markdown formatting. It is intended for quick text edits rather than structural changes.

## Future Improvements

- **Custom Plugins**: Additional markdown-it plugins could support footnotes, definition lists, or other extensions.
- **Bi-directional Sync**: Improving the visual editor to map HTML changes back to Markdown syntax (e.g., converting `<b>` back to `**bold**`) would make the visual editing feature fully robust.
