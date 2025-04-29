'use client';

import React, { useState } from 'react';
import MonitorComponent from './MonitorComponent';

interface MainComponentProps {
  status?: 'ok' | 'loading' | 'no-contract' | 'no-auth';
  initMode: boolean;
  packageInfo: {
    version: string;
    author: string;
  };
  onInit: () => Promise<void>;
}

export default function MainComponent({ status, initMode, packageInfo, onInit }: MainComponentProps) {
  if (!initMode && status === 'ok') {
    return <MonitorComponent />;
  }

  return (
    <div className="relative flex flex-col w-screen h-screen bg-gradient-to-b from-primary to-accent text-white">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-6 text-center">
        {!initMode && (
          <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-xl">
            {status === 'no-contract' && (
              <div className="space-y-4">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h2 className="text-2xl font-bold text-red-400">契約情報がありません</h2>
                <p className="text-lg">現在、地震津波関連の契約がないため情報が表示できません。</p>
              </div>
            )}
            
            {status === 'no-auth' && (
              <div className="space-y-4">
                <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <h2 className="text-2xl font-bold text-yellow-400">認証エラー</h2>
                <p className="text-lg">認可情報が取り消されました。アプリケーション再連携を行ってください。</p>
                
                <button 
                  className="mt-4 px-6 py-2 bg-secondary hover:bg-accent text-white font-medium rounded-lg transition-colors duration-200 shadow-lg flex items-center mx-auto"
                  onClick={() => onInit()}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  アプリケーション再連携
                </button>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-xl font-medium">読み込み中...</p>
              </div>
            )}
            
            {!status && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="animate-pulse rounded-full h-16 w-16 bg-blue-500 opacity-75"></div>
                </div>
                <p className="text-xl font-medium">処理中...</p>
              </div>
            )}
          </div>
        )}
        
        {initMode && (
          <div className="bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-xl">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <h1 className="text-3xl font-bold mb-2">地震情報ビューア</h1>
              <div className="w-16 h-1 bg-blue-500 mx-auto mb-4"></div>
            </div>
            
            <div className="space-y-3 text-lg">
              <p>これは、地震情報をリアルタイムに更新する情報パネルです。</p>
              <p><a href="https://dmdata.jp" className="text-blue-300 hover:text-blue-200 underline">dmdata.jp</a>の「地震・津波関連」を契約している方のみ使用できます。</p>
              <p>WebSocketまたはPuLLリクエストを行い情報を取得しています。</p>
            </div>
            
            <div className="mt-8">
              <p className="mb-4 font-medium">このアプリケーションを使用するには、以下のアプリケーション連携をしてください。</p>
              <button 
                className="px-6 py-3 bg-secondary hover:bg-accent text-white font-medium rounded-lg transition-colors duration-200 shadow-lg flex items-center mx-auto"
                onClick={() => {
                  const url = new URL('https://manager.dmdata.jp/account/oauth2/v1/auth');
                  url.searchParams.set('client_id', 'CId.xyw6-lPflvaxR9CrGR-zHBfGJ_8dUmVtai_61qRSplwM');
                  url.searchParams.set('response_type', 'code');
                  url.searchParams.set('response_mode', 'query'); // Use query instead of fragment
                  url.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:4200/etcm/oauth');
                  url.searchParams.set('scope', 'contract.list parameter.earthquake socket.start telegram.list telegram.data telegram.get.earthquake gd.earthquake');
                  
                  const state = Math.random().toString(36).substring(2, 15);
                  url.searchParams.set('state', state);
                  
                  window.location.href = url.toString();
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                アプリケーション連携
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto mx-auto mb-4 text-center text-white">
        <p className="text-sm opacity-80">ETCM - v.{packageInfo.version}</p>
        <p className="text-sm opacity-80">&copy; {packageInfo.author}</p>
        <p className="text-sm opacity-80">Powered by DMDATA.JP</p>
      </div>
    </div>
  );
}
