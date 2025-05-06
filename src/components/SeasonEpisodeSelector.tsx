
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TMDB_API_KEY, TMDB_API_BASE } from '../lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SeasonEpisodeSelectorProps {
  contentId: number;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
  selectedSeason: number;
  selectedEpisode: number;
}

interface Season {
  season_number: number;
  episode_count: number;
}

interface Episode {
  episode_number: number;
  name: string;
}

// Global cache to persist between component remounts
const globalEpisodeCache: Record<string, Episode[]> = {};

const SeasonEpisodeSelector = ({ 
  contentId, 
  onSeasonChange, 
  onEpisodeChange,
  selectedSeason,
  selectedEpisode
}: SeasonEpisodeSelectorProps) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingEpisodes, setFetchingEpisodes] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use local state for UI updates, but leverage global cache
  const [episodeCache, setEpisodeCache] = useState<Record<number, Episode[]>>({});

  // Fetch TV details when contentId changes
  useEffect(() => {
    if (!contentId) return;
    
    const controller = new AbortController();
    
    const fetchTVDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching TV details for content ID: ${contentId}`);
        const response = await fetch(
          `${TMDB_API_BASE}/tv/${contentId}?api_key=${TMDB_API_KEY}&language=en-US`,
          { 
            signal: controller.signal,
            cache: 'no-store' 
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch TV details");
        }
        
        const data = await response.json();
        console.log("TV details:", data);

        // Filter out seasons with no episodes or special seasons (like season 0)
        const validSeasons = data.seasons.filter(
          (season: any) => season.season_number > 0 && season.episode_count > 0
        );

        setSeasons(validSeasons);

        // If we have seasons, fetch the first season's episodes or currently selected season
        if (validSeasons.length > 0) {
          // Check if the current selectedSeason is valid
          const seasonExists = validSeasons.some(s => s.season_number === selectedSeason);
          
          // Use existing season if valid, otherwise use first available season
          const seasonToFetch = seasonExists ? selectedSeason : validSeasons[0].season_number;
          
          // Update parent component with season number if different
          if (seasonToFetch !== selectedSeason) {
            console.log(`Selected season ${selectedSeason} not found, using season ${seasonToFetch} instead`);
            onSeasonChange(seasonToFetch);
          } 
          
          // Check if we already have episodes for this season in the cache
          const cacheKey = `${contentId}-${seasonToFetch}`;
          if (globalEpisodeCache[cacheKey]) {
            console.log(`Using cached episodes for season ${seasonToFetch}`);
            setEpisodes(globalEpisodeCache[cacheKey]);
            setLoading(false);
          } else {
            // Fetch episodes for the current season
            await fetchSeasonEpisodes(contentId, seasonToFetch);
          }
        } else {
          setEpisodes([]);
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching TV details:", error);
          setError("Failed to load TV details");
          toast({
            title: "Error loading TV details",
            description: "Please try again later",
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    };

    fetchTVDetails();
    
    return () => {
      controller.abort();
    };
  }, [contentId]);

  // Optimized fetchSeasonEpisodes with improved caching and debounce
  const fetchSeasonEpisodes = useCallback(async (id: number, seasonNumber: number) => {
    const cacheKey = `${id}-${seasonNumber}`;
    
    // Check global cache first
    if (globalEpisodeCache[cacheKey]) {
      console.log(`Using global cached episodes for season ${seasonNumber}`);
      setEpisodes(globalEpisodeCache[cacheKey]);
      setFetchingEpisodes(false);
      setLoading(false);
      
      // Check if current episode exists in this season
      const episodeExists = globalEpisodeCache[cacheKey].some((ep: any) => ep.episode_number === selectedEpisode);
      if (!episodeExists) {
        console.log(`Episode ${selectedEpisode} not found in season ${seasonNumber}, resetting to episode 1`);
        onEpisodeChange(1);
      }
      
      return;
    }
    
    try {
      console.log(`Fetching episodes for season ${seasonNumber}`);
      setFetchingEpisodes(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`,
        { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to fetch season episodes");
      }
      
      const data = await response.json();
      
      if (data.episodes && data.episodes.length > 0) {
        // Update both local and global cache
        globalEpisodeCache[cacheKey] = data.episodes;
        setEpisodeCache(prev => ({
          ...prev,
          [seasonNumber]: data.episodes
        }));
        
        setEpisodes(data.episodes);
        
        // If the current episode doesn't exist in this season, set to episode 1
        const episodeExists = data.episodes.some((ep: any) => ep.episode_number === selectedEpisode);
        if (!episodeExists) {
          console.log(`Episode ${selectedEpisode} not found in season ${seasonNumber}, resetting to episode 1`);
          onEpisodeChange(1);
        }
      } else {
        setEpisodes([]);
        onEpisodeChange(1);
      }
    } catch (error) {
      console.error("Error fetching season episodes:", error);
      setError("Failed to load episodes");
      toast({
        title: "Error loading episodes",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setFetchingEpisodes(false);
      setLoading(false);
    }
  }, [onEpisodeChange, selectedEpisode]);

  // Memoize season items to prevent re-rendering
  const seasonItems = useMemo(() => {
    return seasons.map((season) => (
      <SelectItem key={season.season_number} value={season.season_number.toString()}>
        Season {season.season_number} ({season.episode_count} episodes)
      </SelectItem>
    ));
  }, [seasons]);

  // Memoize episode items to prevent re-rendering
  const episodeItems = useMemo(() => {
    return episodes.map((episode) => (
      <SelectItem key={episode.episode_number} value={episode.episode_number.toString()}>
        Episode {episode.episode_number}: {episode.name}
      </SelectItem>
    ));
  }, [episodes]);

  // Handle season change with immediate response
  const handleSeasonChange = useCallback((value: string) => {
    const season = parseInt(value);
    console.log(`Season selected: ${season}`);
    
    // Update season in parent component immediately
    onSeasonChange(season);
    
    // Explicitly fetch episodes for the new season
    if (contentId && season > 0) {
      fetchSeasonEpisodes(contentId, season);
    }
  }, [contentId, fetchSeasonEpisodes, onSeasonChange]);

  const handleEpisodeChange = useCallback((value: string) => {
    const episode = parseInt(value);
    console.log(`Episode selected: ${episode}`);
    onEpisodeChange(episode);
  }, [onEpisodeChange]);

  if (loading && seasons.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading seasons...</span>
      </div>
    );
  }

  if (error && seasons.length === 0) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        {seasons.length > 0 && (
          <div className="relative">
            <Select
              value={selectedSeason.toString()}
              onValueChange={handleSeasonChange}
              disabled={loading}
            >
              <SelectTrigger 
                className="w-[180px] bg-[#2D1B69] hover:bg-[#3D2B79] text-white border-[#6E59A5] transition-all duration-300 animate-scale-in focus:ring-[#9B87F5] shadow-md shadow-purple-900/30"
              >
                <SelectValue placeholder="Select Season">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `Season ${selectedSeason}`
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent 
                className="bg-[#1A1F2C] border-[#6E59A5] animate-scale-in z-50 max-h-[300px] shadow-lg shadow-purple-900/20"
              >
                <ScrollArea className="h-[200px]">
                  {seasonItems}
                </ScrollArea>
              </SelectContent>
            </Select>
            {loading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        )}

        {episodes.length > 0 && (
          <div className="relative">
            <Select
              value={selectedEpisode.toString()}
              onValueChange={handleEpisodeChange}
              disabled={fetchingEpisodes}
            >
              <SelectTrigger 
                className="w-[220px] md:w-[280px] bg-[#2D1B69] hover:bg-[#3D2B79] text-white border-[#6E59A5] transition-all duration-300 animate-scale-in focus:ring-[#9B87F5] shadow-md shadow-purple-900/30"
              >
                <SelectValue placeholder="Select Episode">
                  {fetchingEpisodes ? (
                    <div className="flex items-center gap-2">
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `Episode ${selectedEpisode}`
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent 
                className="bg-[#1A1F2C] border-[#6E59A5] animate-scale-in z-50 max-h-[300px] shadow-lg shadow-purple-900/20"
              >
                <ScrollArea className="h-[250px]">
                  {episodeItems}
                </ScrollArea>
              </SelectContent>
            </Select>
            {fetchingEpisodes && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonEpisodeSelector;
