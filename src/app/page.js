'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard');
    } else if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}