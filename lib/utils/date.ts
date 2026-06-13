const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export function nomeDoMes(date = new Date()): string {
  return MESES[date.getMonth()]
}

export function mesAtual(): string {
  const d = new Date()
  return `${nomeDoMes(d)} ${d.getFullYear()}`
}

export function ddiff(from: string | Date, to: string | Date = new Date()): number {
  const a = new Date(from).getTime()
  const b = new Date(to).getTime()
  return Math.ceil((b - a) / 86_400_000)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}
