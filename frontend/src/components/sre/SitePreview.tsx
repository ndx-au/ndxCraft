import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  url: string
  matched: boolean
  message: string
}

export default function SitePreview({ url, matched, message }: Props) {
  const [tick, setTick] = useState(0)
  const [waiting, setWaiting] = useState(true)

  useEffect(() => {
    setWaiting(true)
    const t = setTimeout(() => setWaiting(false), 1200)
    return () => clearTimeout(t)
  }, [url, tick])

  if (!matched) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground mb-1">Site preview unavailable</p>
          <p>{message || 'Start the Sentinel harness for this SRE to preview /fcms/render.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-card">
      {waiting && (
        <div className="absolute inset-x-0 top-0 z-10 px-3 py-1.5 text-[11px] bg-raised/90 text-muted-foreground border-b border-border">
          Waiting for harness to pick up the latest save…
        </div>
      )}
      <button
        type="button"
        aria-label="Reload site preview"
        onClick={() => setTick((n) => n + 1)}
        className="absolute top-2 right-3 z-20 h-8 w-8 rounded-md flex items-center justify-center bg-panel/90 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <RefreshCw size={14} />
      </button>
      <iframe
        key={`${url}-${tick}`}
        title="fcms site preview"
        src={url}
        className="w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
