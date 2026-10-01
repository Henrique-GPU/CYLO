export function soDigitos(v: string): string {
  return (v ?? '').replace(/\D/g, '')
}

function digitoVerificador(base: number[], pesos: number[]): number {
  const soma = base.reduce((acc, n, i) => acc + n * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const n = d.split('').map(Number)
  const d1 = digitoVerificador(n.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digitoVerificador(n.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return d1 === n[9] && d2 === n[10]
}

export function cnpjValido(cnpj: string): boolean {
  const d = soDigitos(cnpj)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const n = d.split('').map(Number)
  const d1 = digitoVerificador(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digitoVerificador(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return d1 === n[12] && d2 === n[13]
}

export function cpfCnpjValido(v: string): boolean {
  const d = soDigitos(v)
  return d.length === 11 ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false
}

// Máscara progressiva: 000.000.000-00 ou 00.000.000/0000-00
export function mascararCpfCnpj(v: string): string {
  const d = soDigitos(v).slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
