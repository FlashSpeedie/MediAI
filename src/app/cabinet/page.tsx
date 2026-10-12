import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CabinetPage from '@/components/medicines/CabinetPage';

export const metadata = { title: 'Medicine Cabinet - AI Doctor' };

export default async function CabinetRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return <CabinetPage userId={session.user.id} />;
}
