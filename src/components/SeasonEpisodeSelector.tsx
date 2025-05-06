
import React, { useState, useEffect } from 'react';
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

const SeasonEpisodeSelector = ({ 
  contentId, 
  onSeasonChange, 
  onEpisodeChange,
  selectedSeason,
  selectedEpisode
}: SeasonEpisodeSelectorProps) => {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [fetchingEpisodes, setFetchingEpisodes] = useState<boolean>(false);
  
  // Fetch TV details when contentId changes
  useEffect(() => {
    if (!contentId) return;
    
    const fetchTVDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${TMDB_API_BASE}/tv/${contentId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
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

        // Wait for seasons to be set before fetching episodes
        if (validSeasons.length > 0) {
          // Check if the current selectedSeason is valid
          const seasonExists = validSeasons.some(s => s.season_number === selectedSeason);
          
          // Use existing season if valid, otherwise use first available season
          const seasonToFetch = seasonExists ? selectedSeason : validSeasons[0].season_number;
          
          // Update parent component with season number if different
          if (seasonToFetch !== selectedSeason) {
            console.log(`Selected season ${selectedSeason} not found, using season ${seasonToFetch} instead`);
            onSeasonChange(seasonToFetch);
          } else {
            // If using the same season, still need to fetch episodes
            await fetchSeasonEpisodes(contentId, seasonToFetch);
          }
        } else {
          setEpisodes([]);
        }
      } catch (error) {
        console.error("Error fetching TV details:", error);
        setError("Failed to load TV details");
        toast({
          title: "Error loading TV details",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTVDetails();
  }, [contentId]);

  // Fetch episodes when selectedSeason changes
  useEffect(() => {
    if (contentId && selectedSeason > 0 && seasons.length > 0) {
      // Verify the season exists in our seasons list
      const seasonExists = seasons.some(s => s.season_number === selectedSeason);
      if (seasonExists) {
        fetchSeasonEpisodes(contentId, selectedSeason);
      } else {
        console.log(`Warning: Attempted to fetch invalid season ${selectedSeason}`);
      }
    }
  }, [contentId, selectedSeason, seasons]);

  const fetchSeasonEpisodes = async (id: number, seasonNumber: number) => {
    try {
      console.log(`Fetching episodes for season ${seasonNumber}`);
      setFetchingEpisodes(true);
      setError(null);
      
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch season episodes");
      }
      
      const data = await response.json();
      console.log("Season episodes:", data);
      
      if (data.episodes && data.episodes.length > 0) {
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
    }
  };

  const handleSeasonChange = (value: string) => {
    const season = parseInt(value);
    console.log(`Season selected: ${season}`);
    if (season !== selectedSeason) {
      // Reset episode selection to prevent invalid episodes
      onSeasonChange(season);
    }
  };

  const handleEpisodeChange = (value: string) => {
    const episode = parseInt(value);
    console.log(`Episode selected: ${episode}`);
    onEpisodeChange(episode);
  };

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
              disabled={loading || fetchingEpisodes}
            >
              <SelectTrigger className="w-[180px] bg-[#232323]">
                <SelectValue placeholder="Select Season">
                  {loading || fetchingEpisodes ? (
                    <div className="flex items-center gap-2">
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `Season ${selectedSeason}`
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {seasons.map((season) => (
                    <SelectItem key={season.season_number} value={season.season_number.toString()}>
                      Season {season.season_number} ({season.episode_count} episodes)
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            {(loading || fetchingEpisodes) && (
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
              <SelectTrigger className="w-[180px] bg-[#232323]">
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
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {episodes.map((episode) => (
                    <SelectItem key={episode.episode_number} value={episode.episode_number.toString()}>
                      Episode {episode.episode_number}
                    </SelectItem>
                  ))}
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
