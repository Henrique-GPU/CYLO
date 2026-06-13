'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Usuario } from '@/types'

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }

      supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setUsuario(data)
          setLoading(false)
        })
    })
  }, [])

  return { usuario, loading }
}
