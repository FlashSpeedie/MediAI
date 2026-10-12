import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AccountPage from '@/components/account/AccountPage';

export const metadata = { title: 'Account - MediAI' };

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyGroup: {
        include: {
          members: {
            select: { id: true, name: true, image: true, age: true, gender: true, onboardingComplete: true },
          },
        },
      },
      healthSummaries: { orderBy: { updatedAt: 'desc' }, take: 1 },
      _count: { select: { symptomSessions: true } },
    },
  });

  return <AccountPage user={user} />;
}

