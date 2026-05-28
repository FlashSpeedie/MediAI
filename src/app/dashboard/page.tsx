// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SymptomHistory from '@/components/history/SymptomHistory';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your past symptom sessions</p>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
        >
          <PlusCircle className="w-4 h-4" />
          New Session
        </Link>
      </div>

      <SymptomHistory />
    </div>
  );
}
