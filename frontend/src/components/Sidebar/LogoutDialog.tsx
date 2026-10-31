import { useEffect, useRef } from 'react'

type LogoutDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function LogoutDialog({ open, onClose, onConfirm }: LogoutDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onClose}>
      <p className="dialog__title">Вы уверены, что хотите выйти?</p>

      <div className="dialog__actions">
        <button type="button" className="dialog__btn" onClick={onClose}>
          Нет
        </button>
        <button type="button" className="dialog__btn dialog__btn--primary" onClick={onConfirm}>
          Да
        </button>
      </div>
    </dialog>
  )
}
