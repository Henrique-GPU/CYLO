// WhatsApp de atendimento do CYLO (dúvidas, suporte e vendas). Troque só aqui.
export const SUPORTE_WA = '5511958716450'

export const waLink = (mensagem: string) =>
  `https://wa.me/${SUPORTE_WA}?text=${encodeURIComponent(mensagem)}`
