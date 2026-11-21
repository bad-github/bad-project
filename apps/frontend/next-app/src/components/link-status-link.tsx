'use client';

import {Loading} from '@badnpm/ui';
import Link, {useLinkStatus} from 'next/link';

function PendingHint() {
  const {pending} = useLinkStatus();
  return <>{pending && <Loading size="xs" showText={false} />}</>;
}

export default function LinkStatusLink({
  href,
  children,
}: Readonly<{
  href: string;
  children: React.ReactNode;
}>) {
  return (
    <Link className="inline-flex items-center gap-2" href={href}>
      <span className="underline underline-offset-4">{children}</span>
      <PendingHint />
    </Link>
  );
}
