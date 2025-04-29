'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { oauth2Service } from '../../../lib/api/oauth2';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        router.push('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
      }
    };

    handleOAuthCallback();
  }, [router]);

  return <div className="flex h-screen items-center justify-center bg-primary text-white">認証処理中...</div>;
}
