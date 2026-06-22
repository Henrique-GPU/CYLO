'use client'
import { useEffect } from 'react'

const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const

function getCookie(name: string) {
  return document.cookie.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1]
}

export default function UtmCapture() {
  useEffect(() => {
    if (getCookie('cylo_attrib')) return // primeira origem vence

    const params = new URLSearchParams(window.location.search)
    const attrib: Record<string, string> = {}
    for (const f of FIELDS) {
      const v = params.get(f)
      if (v) attrib[f] = v
    }
    if (Object.keys(attrib).length === 0) return

    const maxAge = 90 * 24 * 60 * 60 // 90 dias em segundos
    document.cookie = `cylo_attrib=${encodeURIComponent(JSON.stringify(attrib))}; max-age=${maxAge}; path=/`
  }, [])

  return null
}
