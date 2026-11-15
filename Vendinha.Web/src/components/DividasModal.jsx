import { useEffect, useState } from 'react'
import styles from '../App.module.css'
import { criarDivida, listarDividas, pagarDivida } from '../api'
import { formatarDataHora, formatarMoeda } from '../utils'
import Modal from './Modal'

/**
 * Dívidas de um cliente: lista, cadastro de nova dívida e marcação de pagamento.
 * `onChanged` avisa a tela principal para atualizar o "total devido" da listagem.
 */
function DividasModal({ cliente, onClose, onChanged }) {
  const [dividas, setDividas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      setLoadError('')
      try {
        setDividas(await listarDividas(cliente.id, controller.signal))
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(error.message || 'Falha ao carregar as dívidas.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    carregar()
    return () => controller.abort()
  }, [cliente.id, refreshToken])

  // Regra do negócio: só pode haver uma dívida em aberto por cliente
  const emAberto = dividas.find((divida) => !divida.paga)
  const totalEmAberto = dividas
    .filter((divida) => !divida.paga)
    .reduce((soma, divida) => soma + divida.valor, 0)

  function aposAlteracao() {
    setRefreshToken((token) => token + 1)
    onChanged()
  }

  async function handleCadastrar(event) {
    event.preventDefault()
    setFormError('')

    const numero = Number(valor)
    if (!(numero > 0)) {
      setFormError('Informe um valor maior que zero.')
      return
    }

    setSaving(true)
    try {
      await criarDivida(cliente.id, numero)
      setValor('')
      aposAlteracao()
    } catch (error) {
      setFormError(error.message || 'Falha ao cadastrar a dívida.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePagar(divida) {
    setFormError('')
    setPayingId(divida.id)
    try {
      await pagarDivida(cliente.id, divida.id)
      aposAlteracao()
    } catch (error) {
      setFormError(error.message || 'Falha ao registrar o pagamento.')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <Modal
      largo
      eyebrow="DÍVIDAS DO CLIENTE"
      titulo={cliente.nome}
      descricao="Cada cliente pode ter apenas uma dívida em aberto. Quite a atual para cadastrar outra."
      onClose={onClose}
      bloqueado={saving || payingId !== null}
    >
      <div className={styles.debtSummary}>
        <span>Total em aberto</span>
        <strong className={totalEmAberto > 0 ? styles.moneyOwed : ''}>{formatarMoeda(totalEmAberto)}</strong>
      </div>

      <form className={styles.inlineForm} onSubmit={handleCadastrar}>
        <label>
          Valor da nova dívida (R$)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            placeholder="0,00"
            disabled={saving || Boolean(emAberto)}
          />
        </label>
        <button className={styles.primaryButton} type="submit" disabled={saving || Boolean(emAberto)}>
          {saving ? 'Salvando...' : 'Cadastrar dívida'}
        </button>
      </form>
      {emAberto && (
        <p className={styles.fieldHint}>Este cliente já tem uma dívida em aberto. Marque-a como paga para cadastrar outra.</p>
      )}

      {formError && <p className={`${styles.formError} ${styles.spaced}`} role="alert">{formError}</p>}
      {loadError && <p className={`${styles.formError} ${styles.spaced}`} role="alert">{loadError}</p>}

      <div className={`${styles.tableScroll} ${styles.innerTable}`}>
        <table className={styles.clientTable}>
          <thead>
            <tr>
              <th>VALOR</th>
              <th>SITUAÇÃO</th>
              <th>CRIADA EM</th>
              <th>PAGA EM</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={styles.tableMessage} colSpan="5">Carregando dívidas...</td></tr>
            ) : dividas.length === 0 ? (
              <tr><td className={styles.tableMessage} colSpan="5">Este cliente ainda não tem dívidas.</td></tr>
            ) : dividas.map((divida) => (
              <tr key={divida.id}>
                <td>{formatarMoeda(divida.valor)}</td>
                <td>
                  <span className={`${styles.badge} ${divida.paga ? styles.badgePaid : styles.badgeOpen}`}>
                    {divida.paga ? 'Paga' : 'Em aberto'}
                  </span>
                </td>
                <td>{formatarDataHora(divida.dataCriacao)}</td>
                <td>{formatarDataHora(divida.dataPagamento)}</td>
                <td>
                  {!divida.paga && (
                    <button
                      className={styles.rowButton}
                      type="button"
                      onClick={() => handlePagar(divida)}
                      disabled={payingId !== null}
                    >
                      {payingId === divida.id ? 'Salvando...' : 'Marcar como paga'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.formActions}>
        <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={saving || payingId !== null}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}

export default DividasModal
