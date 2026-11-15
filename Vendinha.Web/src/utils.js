const moedaFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHoraFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatarMoeda(valor) {
  return moedaFormat.format(Number(valor) || 0)
}

/** "1990-05-20" -> "20/05/1990" (sem criar Date, para não sofrer com fuso horário) */
export function formatarData(valor) {
  if (!valor) return '—'
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—'
}

/** Data e hora de um instante UTC vindo da API, no fuso do usuário. */
export function formatarDataHora(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : dataHoraFormat.format(data)
}

/** Aplica a máscara 000.000.000-00 enquanto o usuário digita. */
export function mascararCpf(valor) {
  const d = String(valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
