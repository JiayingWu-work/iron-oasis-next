interface DeleteButtonProps {
  onClick: () => void
  deleting: boolean
}

export default function DeleteButton({ onClick, deleting }: DeleteButtonProps) {
  return (
    <button
      type="button"
      className="secondary-btn"
      disabled={deleting}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {deleting && <span className="spinner" />}
      {deleting ? 'Deleting' : 'Delete'}
    </button>
  )
}
