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
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${full ? 'modal-full' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <div className="modal-header-actions">
            {headerAction}
            <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
