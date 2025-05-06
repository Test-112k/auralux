
import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, PlayCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PlayerWithControlsProps {
  src: string;
  title: string;
  loading: boolean;
}

interface SavedPlayerState {
  src: string;
  title: string;
  timestamp: number;
  season?: number;
  episode?: number;
}

const PlayerWithControls = ({ src, title, loading }: PlayerWithControlsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(Date.now()); // Add key to force iframe refresh
  const { toast } = useToast();
  const [hasSavedState, setHasSavedState] = useState(false);
  
  // Get storage key for the current video
  const getStorageKey = () => `player_state_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  
  // Check for saved state on mount
  useEffect(() => {
    try {
      const savedStateString = localStorage.getItem(getStorageKey());
      if (savedStateString) {
        const savedState: SavedPlayerState = JSON.parse(savedStateString);
        const timeSinceLastWatch = Date.now() - savedState.timestamp;
        const isRecent = timeSinceLastWatch < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (isRecent) {
          setHasSavedState(true);
        }
      }
      
      // Register beforeunload event to save state when navigating away
      window.addEventListener('beforeunload', savePlayerState);
      return () => {
        window.removeEventListener('beforeunload', savePlayerState);
      };
    } catch (error) {
      console.error("Error checking saved player state:", error);
    }
  }, []);

  // When source changes, update loading state
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setKey(Date.now()); // Force iframe refresh when src changes
    
    // Check for saved state for this content
    try {
      const savedStateString = localStorage.getItem(getStorageKey());
      if (savedStateString) {
        const savedState: SavedPlayerState = JSON.parse(savedStateString);
        const isSameContent = savedState.src === src;
        const timeSinceLastWatch = Date.now() - savedState.timestamp;
        const isRecent = timeSinceLastWatch < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        setHasSavedState(isSameContent && isRecent);
      } else {
        setHasSavedState(false);
      }
    } catch (error) {
      console.error("Error restoring player state:", error);
    }
  }, [src]);

  // Save player state to localStorage
  const savePlayerState = () => {
    if (!src) return;
    
    try {
      const playerState: SavedPlayerState = {
        src,
        title,
        timestamp: Date.now(),
      };
      
      // Extract season and episode from src if it's a TV show
      const tvMatch = src.match(/\/tv\/(\d+)\/(\d+)-(\d+)$/);
      if (tvMatch) {
        playerState.season = parseInt(tvMatch[2]);
        playerState.episode = parseInt(tvMatch[3]);
      }
      
      localStorage.setItem(getStorageKey(), JSON.stringify(playerState));
      console.log("Player state saved", playerState);
    } catch (error) {
      console.error("Error saving player state:", error);
    }
  };
  
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
    
    // When iframe loads successfully, show toast if there's a saved state
    if (hasSavedState) {
      toast({
        title: "Continue Watching",
        description: "Resuming from where you left off",
        duration: 3000,
      });
    }
    
    // Set up interval to periodically save player state
    const saveInterval = setInterval(savePlayerState, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const refreshPlayer = () => {
    setIsLoading(true);
    setError(false);
    setKey(Date.now()); // Force iframe refresh
    savePlayerState();
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
      
      {hasSavedState && !isLoading && !error && (
        <div className="absolute top-2 left-2 z-20 bg-purple-600 bg-opacity-90 rounded-md px-3 py-1 text-sm flex items-center">
          <PlayCircle size={16} className="mr-1" />
          Continuing where you left off
        </div>
      )}
      
      <iframe
        id="player-iframe"
        key={key}
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
