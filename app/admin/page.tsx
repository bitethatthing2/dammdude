"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRedirect() {
  const router = useRouter();
  
  // Use useEffect to handle the redirect after component mounts
  useEffect(() => {
    // Redirect to dashboard
    router.replace('/admin/dashboard');
  }, [router]);
  
  return <div className="p-8 text-center">Redirecting to admin dashboard...</div>;
}