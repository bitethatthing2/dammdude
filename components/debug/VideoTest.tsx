'use client';

import { useState } from 'react';

const testVideos = [
  '/food-menu-images/watch-it-made.mp4',
  '/food-menu-images/watch-it-being-made-taco-salad.mp4', 
  '/food-menu-images/watch-it-be-made-burrito.mp4'
];

export default function VideoTest() {
  const [videoStates, setVideoStates] = useState<{[key: string]: string}>({});
  
  const updateVideoState = (url: string, state: string) => {
    setVideoStates(prev => ({ ...prev, [url]: state }));
  };

  return (
    <div className="p-4 bg-zinc-800 text-white">
      <h2 className="text-xl mb-4">Video URL Test</h2>
      {testVideos.map((url) => (
        <div key={url} className="mb-6 border border-zinc-600 p-4 rounded">
          <h3 className="text-lg mb-2">{url}</h3>
          <div className="mb-2">
            Status: <span className={`font-bold ${
              videoStates[url] === 'loaded' ? 'text-green-400' : 
              videoStates[url] === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {videoStates[url] || 'loading...'}
            </span>
          </div>
          <video
            src={url}
            controls
            width="300"
            height="200"
            className="border border-zinc-600"
            onLoadStart={() => updateVideoState(url, 'loading')}
            onCanPlay={() => updateVideoState(url, 'loaded')}
            onError={(e) => {
              console.error('Video error for', url, e);
              updateVideoState(url, 'error');
            }}
          />
        </div>
      ))}
    </div>
  );
}