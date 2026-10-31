// hooks/useUserProfile.ts
'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// 目前登入者的顯示名稱與管理員身分
export function useUserProfile(supabase: SupabaseClient) {
  const [userDisplayName, setUserDisplayName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, is_admin')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.display_name) {
            setUserDisplayName(profile.display_name)
          } else if (user.user_metadata?.display_name) {
            setUserDisplayName(user.user_metadata.display_name)
          } else if (user.email) {
            setUserDisplayName(user.email.split('@')[0])
          }

          setIsAdmin(!!profile.is_admin)
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
      }
    }

    fetchUserProfile()
  }, [supabase])

  return { userDisplayName, isAdmin }
}
