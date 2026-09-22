import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** Sticky footer area (action buttons). */
  footer?: ReactNode
  /** Extra control rendered in the header next to the close button. */
  headerAction?: ReactNode
  full?: boolean
}

export default function Modal({ title, onClose, children, footer, headerAction, full }: ModalProps) {
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    const previous = document.activeElement as HTMLElement | null
    node?.showModal()
    return () => { node?.close(); previous?.focus() }
  }, [])
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <dialog ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose() }} className={`modal ${full ? 'modal-full' : ''}`}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <div className="modal-header-actions">
            {headerAction}
            <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </dialog>
    </div>
  )
}
