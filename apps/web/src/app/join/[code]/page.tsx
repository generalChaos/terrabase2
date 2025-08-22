import { JoinClient } from '@/components/join-client';

export default async function Join({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinClient code={code} />;
}
