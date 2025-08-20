import { HostClient } from '@/components/host-client';

export default async function Host({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <HostClient code={code} />;
}
