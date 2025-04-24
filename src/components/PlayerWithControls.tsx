
import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface PlayerWithControlsProps {
  src: string;
  title: string;
  loading: boolean;
}

const PlayerWithControls = ({ src, title, loading }: PlayerWithControlsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const refreshPlayer = () => {
    setIsLoading(true);
    setError(false);
    // Force iframe refresh by changing key
    const iframe = document.getElementById('player-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
      {(loading || isLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
          <Loader2 className="animate-spin h-12 w-12 text-purple-500" />
          <p className="mt-4 text-gray-300">Loading player...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load video player</p>
            <button 
              onClick={refreshPlayer}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      )}
      
      <iframe
        id="player-iframe"
        key={src}
        src={src}
        className="w-full h-full"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="origin"
        title={title}
        loading="eager"
        onLoad={handleIframeLoad}
        onError={handleError}
      ></iframe>
    </div>
  );
};

export default PlayerWithControls;
