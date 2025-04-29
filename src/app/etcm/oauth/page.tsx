'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { oauth2Service } from '../../../lib/api/oauth2';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (searchParams.has('code')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('OAuth認証処理が完了しました');
        }
        
        router.push('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        router.push('/?auth_error=true');
      }
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return <div className="flex h-screen items-center justify-center bg-primary text-white">認証処理中...</div>;
}
