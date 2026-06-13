'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { applyWhiteLabel } from '@/lib/utils/white-label'
import type { Loja } from '@/types'

export function useLoja(lojaId: string | null | undefined) {
  const [loja, setLoja] = useState<Loja | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lojaId) { setLoading(false); return }

    const supabase = createClient()
    supabase
      .from('lojas')
      .select('*')
      .eq('id', lojaId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLoja(data)
          applyWhiteLabel(data)
        }
        setLoading(false)
      })
  }, [lojaId])

  return { loja, loading }
}
