import styles from './DeleteButton.module.css'

interface DeleteButtonProps {
  onClick: () => void
  deleting: boolean
}

export default function DeleteButton({ onClick, deleting }: DeleteButtonProps) {
  return (
    <button
      type="button"
      className={styles.secondaryBtn}
      disabled={deleting}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {deleting && <span className={styles.spinner} />}
      {deleting ? 'Deleting' : 'Delete'}
    </button>
  )
}
