'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../lib/api/api';
import { oauth2Service } from '../lib/api/oauth2';
import MainComponent from '../components/MainComponent';

const packageInfo = {
  version: '0.1.0',
  author: 'takumi-goto'
};

export default function Home() {
  const [status, setStatus] = useState<'ok' | 'loading' | 'no-contract' | 'no-auth' | undefined>('loading');
  const [initMode, setInitMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setStatus('loading');
      const isAuthenticated = await oauth2Service.refreshTokenCheck();
      
      if (isAuthenticated) {
        await contractCheck();
      } else {
        setInitMode(true);
        setStatus('no-auth'); // Set explicit status instead of undefined
      }
    };
    
    checkAuth();
  }, []);

  const contractCheck = async () => {
    setInitMode(false);
    try {
      const contractData = await apiService.contractList();
      setStatus(contractData.items.filter((r: any) => r.classification === 'telegram.earthquake').length > 0 ? 'ok' : 'no-contract');
    } catch (error) {
      console.error(error);
      setStatus('no-auth');
    }
  };

  return <MainComponent status={status} initMode={initMode} packageInfo={packageInfo} onInit={async () => {
    setInitMode(false);
    setStatus('loading');
    await oauth2Service.refreshTokenDelete();
    await oauth2Service.oAuth2ClassReInit();
    await contractCheck();
  }} />;
}
