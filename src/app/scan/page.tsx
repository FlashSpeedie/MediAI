'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ScanPage from '@/components/medicines/ScanPage';

export default function ScanRoute() {
  const router = useRouter();
  
  useEffect(() => {
    // Check auth client-side
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data?.user) {
          router.push('/login');
        }
      });
  }, [router]);

  return <ScanPage />;
}