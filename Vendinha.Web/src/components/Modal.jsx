import { useEffect } from 'react'
import styles from '../App.module.css'

/**
 * Casca reutilizável dos modais: fundo escurecido, cabeçalho, botão de fechar e tecla Esc.
 * `bloqueado` impede o fechamento enquanto uma requisição está em andamento.
 */
function Modal({ eyebrow, titulo, descricao, onClose, bloqueado = false, largo = false, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !bloqueado) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bloqueado, onClose])

  return (
    <div className={styles.modalBackdrop}>
      <section
        className={`${styles.modal} ${largo ? styles.modalWide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 id="modal-title">{titulo}</h2>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            onClick={onClose}
            disabled={bloqueado}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {descricao && <p className={styles.modalDescription}>{descricao}</p>}
        {children}
      </section>
    </div>
  )
}

export default Modal
