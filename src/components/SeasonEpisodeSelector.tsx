
import React, { useState, useEffect } from 'react';
import { TMDB_API_KEY, TMDB_API_BASE } from '../lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  useEffect(() => {
    const fetchTVDetails = async () => {
      if (!contentId) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `${TMDB_API_BASE}/tv/${contentId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch TV details");
        }
        
        const data = await response.json();
        console.log("TV details:", data);

        const validSeasons = data.seasons.filter(
          (season: any) => season.season_number > 0 && season.episode_count > 0
        );

        setSeasons(validSeasons);

        if (validSeasons.length > 0) {
          const seasonToFetch = selectedSeason || validSeasons[0].season_number;
          await fetchSeasonEpisodes(contentId, seasonToFetch);
        }
      } catch (error) {
        console.error("Error fetching TV details:", error);
        setError("Failed to load TV details");
      } finally {
        setLoading(false);
      }
    };

    fetchTVDetails();
  }, [contentId]);

  useEffect(() => {
    if (contentId && selectedSeason > 0) {
      fetchSeasonEpisodes(contentId, selectedSeason);
    }
  }, [contentId, selectedSeason]);

  const fetchSeasonEpisodes = async (id: number, seasonNumber: number) => {
    try {
      console.log(`Fetching episodes for season ${seasonNumber}`);
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch season episodes");
      }
      
      const data = await response.json();
      console.log("Season episodes:", data);
      
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error("Error fetching season episodes:", error);
      setError("Failed to load episodes");
    }
  };

  const handleSeasonChange = (value: string) => {
    const season = parseInt(value);
    console.log(`Season selected: ${season}`);
    onSeasonChange(season);
  };

  const handleEpisodeChange = (value: string) => {
    const episode = parseInt(value);
    console.log(`Episode selected: ${episode}`);
    onEpisodeChange(episode);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-t-2 border-purple-500 rounded-full"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {seasons.length > 0 && (
        <Select
          value={selectedSeason.toString()}
          onValueChange={handleSeasonChange}
        >
          <SelectTrigger className="w-[180px] bg-[#232323]">
            <SelectValue placeholder="Select Season" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {seasons.map((season) => (
                <SelectItem key={season.season_number} value={season.season_number.toString()}>
                  Season {season.season_number}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      )}

      {episodes.length > 0 && (
        <Select
          value={selectedEpisode.toString()}
          onValueChange={handleEpisodeChange}
        >
          <SelectTrigger className="w-[180px] bg-[#232323]">
            <SelectValue placeholder="Select Episode" />
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
      )}
    </div>
  );
};

export default SeasonEpisodeSelector;
