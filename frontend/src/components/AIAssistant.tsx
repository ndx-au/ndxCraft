import React, { useState } from 'react'
import { Send, Sparkles, Loader2, Check } from 'lucide-react'
import { GenerateContent, FixGrammar, HasGeminiKey } from '../../wailsjs/go/main/App'
import { Button } from './ui/button'

interface Props {
  currentContent: string
  selection: string
  title: string
  agentContext: unknown
  onApply: (text: string) => void
}

export default function AIAssistant({ currentContent, selection, title, agentContext, onApply }: Props) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [hasKey, setHasKey] = useState<boolean | null>(null)

  React.useEffect(() => {
    HasGeminiKey().then(setHasKey).catch(() => setHasKey(false))
  }, [])

  const contextBlob = [
    title ? `Title: ${title}` : '',
    agentContext ? `agent_context: ${typeof agentContext === 'string' ? agentContext : JSON.stringify(agentContext)}` : '',
    selection ? `Selection:\n${selection}` : `Current section / document:\n${currentContent.slice(0, 4000)}`,
  ].filter(Boolean).join('\n\n')

  const run = async (kind: 'generate' | 'grammar' | 'describe') => {
    setIsLoading(true)
    setResult(null)
    try {
      if (kind === 'grammar') {
        setResult(await FixGrammar(selection || currentContent))
      } else if (kind === 'describe') {
        setResult(await GenerateContent('Suggest a concise description and 3-6 tags as YAML snippet (description + tags only).', contextBlob))
      } else {
        setResult(await GenerateContent(prompt || 'Improve this technical writing.', contextBlob))
      }
    } catch (e) {
      setResult('Could not reach Gemini. Check GEMINI_API_KEY.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 text-sm font-medium">
        <Sparkles size={14} className="text-fcms" /> Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {hasKey === false && (
          <p className="text-xs text-dirty">GEMINI_API_KEY is not set. AI actions stay offline.</p>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Rewrite this section for operators…"
          className="w-full h-28 rounded-md border border-input bg-transparent p-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" disabled={isLoading} onClick={() => run('generate')}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Draft
          </Button>
          <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => run('grammar')}>Grammar</Button>
          <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => run('describe')} className="col-span-2">
            Suggest description & tags
          </Button>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider text-ok">Suggestion</span>
              <button
                type="button"
                onClick={() => onApply(result)}
                className="text-xs flex items-center gap-1 text-ok hover:underline cursor-pointer"
              >
                <Check size={12} /> Insert
              </button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-raised border border-border rounded-md p-2 max-h-64 overflow-y-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
