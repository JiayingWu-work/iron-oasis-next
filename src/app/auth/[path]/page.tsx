import Image from 'next/image';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import styles from './page.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { path: 'sign-in' },
    { path: 'sign-up' },
    { path: 'sign-out' },
    { path: 'forgot-password' },
    { path: 'reset-password' },
  ];
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main className={styles.authPage}>
      <div className={styles.logoContainer}>
        <Image
          src="/logo.png"
          alt="Iron Oasis"
          width={180}
          height={180}
          priority
        />
      </div>
      <AuthView path={path} />
    </main>
  );
}
