import { useState } from 'react'
import styles from '../App.module.css'
import { excluirCliente } from '../api'
import Modal from './Modal'

function ExcluirClienteModal({ cliente, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleExcluir() {
    setError('')
    setDeleting(true)
    try {
      await excluirCliente(cliente.id)
      onDeleted()
    } catch (err) {
      setError(err.message || 'Falha ao excluir o cliente.')
      setDeleting(false)
    }
  }

  return (
    <Modal
      eyebrow="EXCLUIR CADASTRO"
      titulo="Excluir cliente"
      descricao={`Tem certeza que deseja excluir ${cliente.nome}? As dívidas deste cliente também serão apagadas e essa ação não pode ser desfeita.`}
      onClose={onClose}
      bloqueado={deleting}
    >
      {error && <p className={styles.formError} role="alert">{error}</p>}

      <div className={styles.formActions}>
        <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={deleting}>
          Cancelar
        </button>
        <button className={styles.dangerButton} type="button" onClick={handleExcluir} disabled={deleting}>
          {deleting ? 'Excluindo...' : 'Excluir cliente'}
        </button>
      </div>
    </Modal>
  )
}

export default ExcluirClienteModal
