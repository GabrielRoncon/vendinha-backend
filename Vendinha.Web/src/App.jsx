import { useEffect, useState } from 'react'
import styles from './App.module.css'
import { listarClientes } from './api'
import { formatarData, formatarMoeda, mascararCpf } from './utils'
import ClienteFormModal from './components/ClienteFormModal'
import DividasModal from './components/DividasModal'
import ExcluirClienteModal from './components/ExcluirClienteModal'

function App() {
  const [pagina, setPagina] = useState(null) // resposta paginada da API (itens, totalItens, totalPaginas...)
  const [pesquisa, setPesquisa] = useState('')
  const [page, setPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [hasConnected, setHasConnected] = useState(false)
  // Modal aberto: { tipo: 'cliente' | 'dividas' | 'excluir', cliente } ou null
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    // pequeno atraso na busca para não chamar a API a cada tecla digitada
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setLoadError('')

      try {
        const resultado = await listarClientes({ pesquisa, page, signal: controller.signal })
        setPagina(resultado)
        setHasConnected(true)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message || 'Falha ao conectar com a API.')
          setPagina(null)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, pesquisa ? 250 : 0)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [page, pesquisa, refreshToken])

  const clientes = pagina?.itens ?? []
  const totalPaginas = Math.max(1, pagina?.totalPaginas ?? 1)

  function recarregar() {
    setRefreshToken((token) => token + 1)
  }

  function fecharModal() {
    setModal(null)
  }

  function aoSalvarCliente() {
    fecharModal()
    recarregar()
  }

  function aoExcluirCliente() {
    fecharModal()
    // se apagou o único cliente da página, volta uma página
    if (clientes.length === 1 && page > 1) setPage(page - 1)
    else recarregar()
  }

  return (
    <div className={styles.app}>
      <header className={styles.navbar}>
        <a className={styles.brand} href="/" aria-label="Vendinha, início">
          <span className={styles.brandMark}>V</span>
          <span>vendinha<span className={styles.brandDot}>.</span></span>
        </a>
        <nav className={styles.navLinks} aria-label="Navegação principal">
          <a className={styles.navLinkActive} href="#clientes">Clientes</a>
        </nav>
        <div className={styles.connection}>
          <span className={`${styles.connectionDot} ${hasConnected ? styles.connected : ''}`} />
          <span>{hasConnected ? 'API conectada' : 'Conexão com a API'}</span>
        </div>
      </header>

      <main className={styles.main} id="clientes">
        <div className={styles.pageHeading}>
          <div>
            <p className={styles.eyebrow}>CONTROLE DE FIADO <span>/</span> CADASTROS</p>
            <h1>Clientes</h1>
            <p className={styles.subtitle}>Cadastre os clientes e acompanhe as dívidas penduradas.</p>
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => setModal({ tipo: 'cliente', cliente: null })}>
            <span aria-hidden="true">+</span>
            Novo cliente
          </button>
        </div>

        <section className={styles.panel} aria-labelledby="client-list-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="client-list-title">Todos os clientes</h2>
              <p>Ordenados de quem mais deve para quem menos deve.</p>
            </div>
            <label className={styles.searchBox}>
              <span className={styles.searchIcon} aria-hidden="true">⌕</span>
              <span className={styles.visuallyHidden}>Pesquisar clientes pelo nome</span>
              <input
                type="search"
                placeholder="Buscar cliente pelo nome..."
                value={pesquisa}
                onChange={(event) => {
                  setPesquisa(event.target.value)
                  setPage(1)
                }}
              />
            </label>
          </div>

          {loadError && (
            <div className={styles.errorBanner} role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={recarregar}>Tentar novamente</button>
            </div>
          )}

          <div className={styles.tableScroll}>
            <table className={styles.clientTable}>
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>CPF</th>
                  <th>E-MAIL</th>
                  <th>NASCIMENTO</th>
                  <th>IDADE</th>
                  <th>DEVE</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={styles.tableMessage} colSpan="7">Carregando clientes...</td></tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td className={styles.tableMessage} colSpan="7">
                      {loadError
                        ? 'Não foi possível exibir os registros.'
                        : pesquisa
                          ? 'Nenhum cliente encontrado.'
                          : 'Ainda não há clientes cadastrados.'}
                    </td>
                  </tr>
                ) : clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className={styles.clientIdentity}>
                        <span className={styles.avatar}>{cliente.nome?.trim()?.[0]?.toUpperCase() || '?'}</span>
                        <span className={styles.clientName}>{cliente.nome}</span>
                      </div>
                    </td>
                    <td><span className={styles.code}>{mascararCpf(cliente.cpf)}</span></td>
                    <td className={styles.email}>{cliente.email || '—'}</td>
                    <td>{formatarData(cliente.dataNascimento)}</td>
                    <td>{cliente.idade ?? '—'} <span className={styles.years}>anos</span></td>
                    <td className={cliente.totalDividas > 0 ? styles.moneyOwed : ''}>
                      {formatarMoeda(cliente.totalDividas)}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.rowButton} type="button" onClick={() => setModal({ tipo: 'dividas', cliente })}>
                          Dívidas
                        </button>
                        <button className={styles.rowButton} type="button" onClick={() => setModal({ tipo: 'cliente', cliente })}>
                          Editar
                        </button>
                        <button className={`${styles.rowButton} ${styles.rowButtonDanger}`} type="button" onClick={() => setModal({ tipo: 'excluir', cliente })}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className={styles.tableFooter}>
            <span>
              {loading
                ? 'Carregando registros'
                : `${pagina?.totalItens ?? 0} ${pagina?.totalItens === 1 ? 'cliente' : 'clientes'}`}
            </span>
            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => setPage((atual) => Math.max(1, atual - 1))}
                disabled={page === 1 || loading}
                aria-label="Página anterior"
              >
                ←
              </button>
              <span>Página {page} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPage((atual) => atual + 1)}
                disabled={page >= totalPaginas || loading}
                aria-label="Próxima página"
              >
                →
              </button>
            </div>
          </footer>
        </section>

        <p className={styles.pageNote}>Os dados são fornecidos pela API da Vendinha.</p>
      </main>

      {modal?.tipo === 'cliente' && (
        <ClienteFormModal cliente={modal.cliente} onClose={fecharModal} onSaved={aoSalvarCliente} />
      )}
      {modal?.tipo === 'dividas' && (
        <DividasModal cliente={modal.cliente} onClose={fecharModal} onChanged={recarregar} />
      )}
      {modal?.tipo === 'excluir' && (
        <ExcluirClienteModal cliente={modal.cliente} onClose={fecharModal} onDeleted={aoExcluirCliente} />
      )}
    </div>
  )
}

export default App
