'use client'
import { useEffect } from 'react'

declare global {
  interface Window { gtag?: (...args: any[]) => void }
}

export default function TrackConversion() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('novo') !== '1') return

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: 'AW-18244888954/qActCITAqsAcEPrS6_tD' })
    }

    window.history.replaceState({}, '', '/dashboard')
  }, [])

  return null
}
