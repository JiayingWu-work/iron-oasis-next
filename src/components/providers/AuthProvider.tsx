'use client';

import { useRouter } from 'next/navigation';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={(path) => router.push(path)}
      replace={(path) => router.replace(path)}
      redirectTo="/"
      social={{ providers: [] }}
      credentials={{ forgotPassword: true, rememberMe: true }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
