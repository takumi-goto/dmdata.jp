'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { oauth2Service } from '../../../lib/api/oauth2';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (searchParams.has('code')) {
          const code = searchParams.get('code') || '';
          console.log('認証コードを受け取りました:', code);
          
          const isAuthenticated = await oauth2Service.handleAuthorizationCode(code);
          
          if (isAuthenticated) {
            console.log('OAuth認証が成功しました');
            setStatus('success');
            
            await oauth2Service.oAuth2ClassReInit();
          } else {
            console.error('OAuth認証に失敗しました');
            setStatus('error');
            router.push('/?auth_error=true');
            return;
          }
        }
        
        router.push('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        router.push('/?auth_error=true');
      }
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-primary text-white">
      {status === 'processing' && <p>認証処理中...</p>}
      {status === 'success' && <p>認証成功！リダイレクトします...</p>}
      {status === 'error' && <p>認証エラーが発生しました</p>}
    </div>
  );
}
