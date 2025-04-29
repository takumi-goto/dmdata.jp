'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Howl } from 'howler';
import { Settings } from '../lib/db/settings';

const packageInfo = {
  version: '0.1.0',
  author: 'takumi-goto'
};

export default function MonitorComponent() {
  const [viewEventId, setViewEventId] = useState<string | undefined>();
  const [soundPlay, setSoundPlay] = useState(false);
  const [eventIdList, setEventIdList] = useState<string[]>([]);
  const { status, start, close, telegrams } = useWebSocket();
  
  useEffect(() => {
    const sound = new Howl({ src: ['/assets/sound/sound.mp3'] });
    const loadSoundSettings = async () => {
      if (sound.state() === 'loaded') {
        const spAa = await Settings.get('soundPlayAutoActivation');
        setSoundPlay(spAa ?? false);
      }
    };

    sound.on('load', loadSoundSettings);
    
    return () => {
      sound.off('load');
    };
  }, []);

  const webSocketIsStartingOK = () => {
    return [null, 'closed', 'error'].includes(status);
  };

  const handleSoundPlaySetting = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const is = event.target.checked;
    setSoundPlay(is);
    await Settings.set('soundPlayAutoActivation', is);
  };

  const getStatusColor = () => {
    if (status === 'open') return 'bg-green-500';
    if (status === 'connecting') return 'bg-yellow-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatTelegramData = (telegram: any) => {
    if (!telegram) return 'データなし';
    
    try {
      const type = telegram.type || telegram.classification || 'Unknown';
      const time = telegram.time || telegram.reportTime || telegram.createdAt || 'Unknown';
      const id = telegram.id || telegram._id || 'Unknown';
      
      return `${type} | ${time} | ${id}`;
    } catch (e) {
      return JSON.stringify(telegram).substring(0, 100) + '...';
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-white">地震情報モニター</h1>
            <div className={`ml-4 w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="ml-2 text-sm text-gray-400">
              {status === 'open' ? '接続中' : 
               status === 'connecting' ? '接続試行中' : 
               status === 'error' ? 'エラー' : '未接続'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {webSocketIsStartingOK() ? (
              <button 
                className="px-4 py-2 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors duration-200 shadow-lg flex items-center" 
                onClick={start}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                WebSocket接続を開始
              </button>
            ) : (
              <button 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg flex items-center" 
                onClick={close}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                WebSocket接続を終了
              </button>
            )}
            
            <div className="flex items-center bg-gray-800 p-2 rounded-lg">
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  id="soundPlay" 
                  checked={soundPlay} 
                  onChange={handleSoundPlaySetting}
                  className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{
                    top: '0',
                    right: soundPlay ? '0' : 'auto',
                    left: soundPlay ? 'auto' : '0',
                    transition: 'all 0.3s'
                  }}
                />
                <label 
                  htmlFor="soundPlay" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"
                  style={{ transition: 'background-color 0.3s' }}
                ></label>
              </div>
              <label htmlFor="soundPlay" className="text-sm font-medium">サウンド再生</label>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Received Data Panel */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-700 p-3 border-b border-gray-600">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                受信データ
                <span className="ml-2 text-sm bg-blue-600 px-2 py-0.5 rounded-full">{telegrams.length}</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="h-64 overflow-y-auto custom-scrollbar">
                {telegrams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>データがありません</p>
                    <p className="text-sm mt-2">WebSocket接続を開始すると、ここにデータが表示されます</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {telegrams.map((telegram, index) => (
                      <li key={index} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                        <div className="text-sm font-mono">{formatTelegramData(telegram)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Event History Panel */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-700 p-3 border-b border-gray-600">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                イベント履歴
                <span className="ml-2 text-sm bg-blue-600 px-2 py-0.5 rounded-full">{eventIdList.length}</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="h-64 overflow-y-auto custom-scrollbar">
                {eventIdList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p>イベントがありません</p>
                    <p className="text-sm mt-2">地震情報を受信すると、ここにイベントが表示されます</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {eventIdList.map((eventId) => (
                      <li 
                        key={eventId} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          viewEventId === eventId ? 'bg-blue-700 border-l-4 border-blue-400' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setViewEventId(eventId)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="font-mono">{eventId}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>ETCM - v.{packageInfo.version}</p>
          <p>&copy; {packageInfo.author} | Powered by DMDATA.JP</p>
        </div>
      </div>
    </div>
  );
}
