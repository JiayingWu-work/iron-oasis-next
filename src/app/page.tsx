'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Spinner } from '@/components'

export default function Page() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return

    if (!session?.user?.id) {
      router.replace('/auth/sign-in')
    } else {
      router.replace('/dashboard')
    }
  }, [session, isPending, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size="lg" />
    </div>
  )
}
