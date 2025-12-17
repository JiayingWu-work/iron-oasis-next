import { AccountView } from '@neondatabase/neon-js/auth/react/ui';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ path: 'settings' }, { path: 'security' }];
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main className="container mx-auto max-w-2xl p-4">
      <AccountView path={path} />
    </main>
  );
}
