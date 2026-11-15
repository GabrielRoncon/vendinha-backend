import { useState } from 'react'
import styles from '../App.module.css'
import { atualizarCliente, criarCliente } from '../api'
import { mascararCpf } from '../utils'
import Modal from './Modal'

// "AAAA-MM-DD" de hoje no fuso local (limite do campo de data de nascimento)
function dataDeHoje() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/**
 * Cadastro e edição de cliente. Sem `cliente` cadastra; com `cliente` edita.
 * A validação de verdade (CPF, duplicidade...) é da API, e a mensagem dela é mostrada aqui.
 */
function ClienteFormModal({ cliente, onClose, onSaved }) {
  const editando = Boolean(cliente)
  const [form, setForm] = useState({
    nome: cliente?.nome ?? '',
    cpf: mascararCpf(cliente?.cpf),
    dataNascimento: cliente?.dataNascimento ?? '',
    email: cliente?.email ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function atualizarCampo(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      if (editando) {
        await atualizarCliente(cliente.id, form)
      } else {
        await criarCliente(form)
      }
      onSaved()
    } catch (error) {
      setFormError(error.message || 'Falha ao salvar o cliente.')
      setSaving(false)
    }
  }

  return (
    <Modal
      eyebrow={editando ? 'EDITAR CADASTRO' : 'NOVO CADASTRO'}
      titulo={editando ? 'Editar cliente' : 'Adicionar cliente'}
      descricao="Campos com * são obrigatórios."
      onClose={onClose}
      bloqueado={saving}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Nome completo *
          <input
            autoFocus
            required
            minLength="3"
            maxLength="150"
            value={form.nome}
            onChange={(event) => atualizarCampo('nome', event.target.value)}
            placeholder="Nome do cliente"
          />
        </label>
        <label>
          CPF *
          <input
            required
            inputMode="numeric"
            maxLength="14"
            value={form.cpf}
            onChange={(event) => atualizarCampo('cpf', mascararCpf(event.target.value))}
            placeholder="000.000.000-00"
          />
        </label>
        <label>
          Data de nascimento *
          <input
            required
            type="date"
            max={dataDeHoje()}
            value={form.dataNascimento}
            onChange={(event) => atualizarCampo('dataNascimento', event.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            maxLength="200"
            value={form.email}
            onChange={(event) => atualizarCampo('email', event.target.value)}
            placeholder="cliente@exemplo.com (opcional)"
          />
        </label>

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <div className={styles.formActions}>
          <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.primaryButton} type="submit" disabled={saving}>
            {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ClienteFormModal
