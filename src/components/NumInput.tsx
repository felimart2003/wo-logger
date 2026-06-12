import { useEffect, useState } from 'react'

interface NumInputProps {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  integer?: boolean
  className?: string
}

/**
 * Numeric input that keeps its own text state so partial input like "22."
 * survives re-renders, but re-syncs when the value is changed externally
 * (e.g. autofilled from the previous workout).
 */
export default function NumInput({ value, onChange, placeholder, integer, className }: NumInputProps) {
  const [text, setText] = useState(value == null ? '' : String(value))

  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text)
    const same =
      (parsed == null && value == null) ||
      (parsed != null && value != null && !Number.isNaN(parsed) && Math.abs(parsed - value) < 0.001)
    if (!same) setText(value == null ? '' : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      className={`num-input ${className ?? ''}`}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      placeholder={placeholder}
      value={text}
      onFocus={e => e.target.select()}
      onChange={e => {
        const raw = e.target.value.replace(',', '.')
        if (!/^\d*\.?\d*$/.test(raw)) return
        setText(raw)
        const trimmed = raw.trim()
        if (trimmed === '' || trimmed === '.') {
          onChange(null)
          return
        }
        let n = Number(trimmed)
        if (Number.isNaN(n)) return
        if (integer) n = Math.floor(n)
        onChange(n)
      }}
    />
  )
}
