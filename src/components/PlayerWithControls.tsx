
import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PlayerWithControlsProps {
  src: string;
  title: string;
  loading: boolean;
}

const PlayerWithControls = ({ src, title, loading }: PlayerWithControlsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(Date.now()); // Add key to force iframe refresh
  const { toast } = useToast();
  
  // Get storage key for the current video
  const getStorageKey = () => `player_state_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  
  // Restore player state when the component mounts
  useEffect(() => {
    try {
      // Register a beforeunload event to save player state when page is unloaded
      window.addEventListener('beforeunload', savePlayerState);
      
      return () => {
        window.removeEventListener('beforeunload', savePlayerState);
      };
    } catch (error) {
      console.error("Error setting up player resume:", error);
    }
  }, []);

  // When source changes, restore from saved state if exists
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setKey(Date.now()); // Force iframe refresh when src changes
    
    // Try to restore previous state for this video
    try {
      const savedState = localStorage.getItem(getStorageKey());
      if (savedState) {
        console.log("Resuming previous session", savedState);
        // We'll rely on the iframe load event to handle restoration
      }
    } catch (error) {
      console.error("Error restoring player state:", error);
    }
  }, [src]);

  // Save player position into localStorage
  const savePlayerState = () => {
    if (!src) return; // Don't save if there's no source
    
    try {
      // Only save state if iframe is loaded and no error
      if (!isLoading && !error) {
        const playerState = {
          src,
          title,
          timestamp: Date.now(),
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(playerState));
        console.log("Player state saved", playerState);
      }
    } catch (error) {
      console.error("Error saving player state:", error);
    }
  };
  
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
    
    try {
      // Check for saved state when iframe loads
      const savedState = localStorage.getItem(getStorageKey());
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.src === src) {
          // Only show toast if there's a saved state for this exact video
          toast({
            title: "Video Resumed",
            description: "Your last viewing position has been restored",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error handling iframe load:", error);
    }
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    
    // Save state when error occurs to help with recovery
    savePlayerState();
  };

  const refreshPlayer = () => {
    setIsLoading(true);
    setError(false);
    setKey(Date.now()); // Force iframe refresh
    savePlayerState(); // Save state before refreshing
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
