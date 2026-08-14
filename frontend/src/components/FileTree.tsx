import React, { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { FileNode } from '../types'

interface FileTreeProps {
  nodes: FileNode[]
  onFileClick: (path: string) => void
  level?: number
}

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileClick, level = 0 }) => {
  if (!nodes || nodes.length === 0) {
    if (level === 0) return <div className="text-xs text-muted-foreground italic p-4">No files found</div>
    return null
  }

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.isDir === b.isDir) return a.name.localeCompare(b.name)
    return a.isDir ? -1 : 1
  })

  return (
    <div className="flex flex-col gap-0.5">
      {sortedNodes.map((node) => (
        <FileTreeNode key={node.path} node={node} onFileClick={onFileClick} level={level} />
      ))}
    </div>
  )
}

const FileTreeNode: React.FC<{ node: FileNode; onFileClick: (path: string) => void; level: number }> = ({
  node, onFileClick, level,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-1.5 py-1 pr-2 hover:bg-accent rounded cursor-pointer text-sm text-left"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => (node.isDir ? setIsOpen(!isOpen) : onFileClick(node.path))}
      >
        {node.isDir ? (
          isOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
        ) : (
          <span className="w-[14px]" />
        )}
        {node.isDir ? <Folder size={14} className="text-fcms" /> : <File size={14} className="text-muted-foreground" />}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDir && isOpen && node.children && (
        <FileTree nodes={node.children} onFileClick={onFileClick} level={level + 1} />
      )}
    </div>
  )
}

export default FileTree
