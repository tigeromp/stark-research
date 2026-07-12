import { useRef, useState, useCallback } from 'react'
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ClipboardPaste,
  X,
  Files,
} from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import {
  parseBibliography,
  parseBibliographyFiles,
  deduplicateEntries,
  type CitationFormData,
} from '../lib/mlaParser'

type Mode = 'upload' | 'paste'

interface ImportPreview {
  entries: CitationFormData[]
  fileResults: { name: string; count: number }[]
  source: string
}

export function BibliographyUpload({ onImported }: { onImported?: () => void }) {
  const { importBibliography } = useResearchStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)

  const showError = (msg: string) => {
    setStatus('error')
    setMessage(msg)
    setPreview(null)
  }

  const showSuccess = (msg: string) => {
    setStatus('success')
    setMessage(msg)
    setPreview(null)
    setPasteText('')
  }

  const processFiles = async (files: FileList | File[]) => {
    setStatus('idle')
    setMessage('')
    const list = Array.from(files)

    const allowed = ['.txt', '.bib', '.csv', '.ris']
    const valid = list.filter((f) => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
      return allowed.includes(ext)
    })

    if (valid.length === 0) {
      showError('No supported files. Use .txt, .bib, .csv, or .ris')
      return
    }

    try {
      setImporting(true)
      const { entries, fileResults } = await parseBibliographyFiles(valid)
      if (entries.length === 0) {
        showError('No citations found in uploaded files')
        return
      }
      setPreview({ entries, fileResults, source: `${valid.length} file${valid.length > 1 ? 's' : ''}` })
    } catch {
      showError('Failed to read bibliography files')
    } finally {
      setImporting(false)
    }
  }

  const processPaste = () => {
    setStatus('idle')
    const entries = deduplicateEntries(parseBibliography(pasteText, 'works-cited.txt'))
    if (entries.length === 0) {
      showError('No citations found. Separate entries with blank lines.')
      return
    }
    setPreview({
      entries,
      fileResults: [{ name: 'Pasted bibliography', count: entries.length }],
      source: 'paste',
    })
  }

  const confirmImport = () => {
    if (!preview) return
    const count = importBibliography(preview.entries)
    showSuccess(`Imported ${count} source${count !== 1 ? 's' : ''} successfully`)
    onImported?.()
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs tracking-[0.2em] text-arc-400">BIBLIOGRAPHY</h3>
        <div className="flex gap-1">
          <button
            onClick={() => { setMode('upload'); setPreview(null) }}
            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
              mode === 'upload' ? 'text-arc-300 bg-arc-500/15' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            FILES
          </button>
          <button
            onClick={() => { setMode('paste'); setPreview(null) }}
            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
              mode === 'paste' ? 'text-arc-300 bg-arc-500/15' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            PASTE
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.bib,.csv,.ris"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) processFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-arc-400 bg-arc-500/15 scale-[1.01]'
                : 'border-arc-500/25 hover:border-arc-500/50 hover:bg-arc-500/5'
            }`}
          >
            <Upload size={22} className={`mx-auto mb-2 ${dragOver ? 'text-arc-300' : 'text-arc-500'}`} />
            <p className="text-xs font-semibold text-slate-300">
              {importing ? 'Processing...' : 'Drop files or click to upload'}
            </p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Multiple files supported
            </p>
            <p className="text-[10px] font-mono text-slate-600 mt-2">
              .txt · .bib · .csv · .ris
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Paste multiple MLA works-cited entries...\n\nSeparate each source with a blank line.\n\nSmith, John. \"Article Title.\" Journal Name, vol. 12, 2024, pp. 45-67.\n\nJohnson, Mary. Book Title. Publisher, 2023."}
            className="w-full h-36 rounded-lg px-3 py-2 text-sm hud-input resize-none"
          />
          <button
            onClick={processPaste}
            disabled={!pasteText.trim()}
            className="w-full py-2 rounded-lg hud-button text-xs flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <ClipboardPaste size={14} />
            Parse {pasteText.trim() ? '' : 'Bibliography'}
          </button>
        </div>
      )}

      {preview && (
        <div className="rounded-xl border border-arc-500/30 bg-arc-500/5 p-3 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Files size={14} className="text-arc-400" />
              <span className="text-xs font-semibold text-arc-300">
                {preview.entries.length} source{preview.entries.length !== 1 ? 's' : ''} ready
              </span>
            </div>
            <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1">
            {preview.entries.slice(0, 8).map((e, i) => (
              <p key={i} className="text-[11px] text-slate-400 truncate">
                <span className="text-arc-500 font-mono mr-1">{i + 1}.</span>
                {e.author} — {e.title}
              </p>
            ))}
            {preview.entries.length > 8 && (
              <p className="text-[10px] font-mono text-slate-600">
                +{preview.entries.length - 8} more...
              </p>
            )}
          </div>

          {preview.fileResults.length > 0 && preview.source !== 'paste' && (
            <div className="text-[10px] font-mono text-slate-500">
              {preview.fileResults.map((f) => (
                <span key={f.name} className="block">{f.name}: {f.count} entries</span>
              ))}
            </div>
          )}

          <button
            onClick={confirmImport}
            className="w-full py-2 rounded-lg hud-button hud-button-primary text-xs"
          >
            Import All Sources
          </button>
        </div>
      )}

      {status !== 'idle' && !preview && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] animate-fade-in-up ${
            status === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
