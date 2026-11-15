// Camada de acesso à API (fetch). Os componentes não montam URLs nem tratam HTTP:
// só chamam as funções daqui.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5059/api').replace(/\/$/, '')

/**
 * Erro vindo da API. A mensagem já vem pronta para exibir ao usuário.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('json')) return response.json()
  return response.text()
}

// A API devolve 422 com uma lista: [{ memberNames: [...], errorMessage: '...' }]
function buildErrorMessage(payload, fallback) {
  if (Array.isArray(payload)) {
    const messages = payload.map((item) => item.errorMessage).filter(Boolean)
    if (messages.length > 0) return messages.join(' ')
  }
  if (typeof payload === 'string' && payload.trim()) return payload
  return fallback
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar com a API. Ela está em execução?', 0)
  }

  if (response.status === 204) return null

  const payload = await readBody(response)
  if (!response.ok) {
    throw new ApiError(
      buildErrorMessage(payload, 'Não foi possível concluir a operação.'),
      response.status,
    )
  }
  return payload
}

// ---- Clientes ----

export function listarClientes({ pesquisa, page, signal }) {
  const params = new URLSearchParams({ page: String(page) })
  if (pesquisa && pesquisa.trim()) params.set('pesquisa', pesquisa.trim())
  return request(`/cliente?${params.toString()}`, { signal })
}

export function criarCliente(cliente) {
  return request('/cliente', { method: 'POST', body: cliente })
}

export function atualizarCliente(id, cliente) {
  return request(`/cliente/${id}`, { method: 'PUT', body: cliente })
}

export function excluirCliente(id) {
  return request(`/cliente/${id}`, { method: 'DELETE' })
}

// ---- Dívidas ----

export function listarDividas(clienteId, signal) {
  return request(`/cliente/${clienteId}/divida`, { signal })
}

export function criarDivida(clienteId, valor) {
  return request(`/cliente/${clienteId}/divida`, { method: 'POST', body: { valor } })
}

export function pagarDivida(clienteId, dividaId) {
  return request(`/cliente/${clienteId}/divida/${dividaId}/pagamento`, { method: 'PUT' })
}
