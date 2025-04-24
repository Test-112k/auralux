
import React, { useState, useEffect } from 'react';
import { TMDB_API_KEY, TMDB_API_BASE } from '../lib/constants';

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

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = parseInt(e.target.value);
    onSeasonChange(newSeason);
    await fetchSeasonEpisodes(contentId, newSeason);
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
        <select
          className="bg-[#232323] px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={selectedSeason}
          onChange={handleSeasonChange}
        >
          {seasons.map((season) => (
            <option key={season.season_number} value={season.season_number}>
              Season {season.season_number}
            </option>
          ))}
        </select>
      )}

      {episodes.length > 0 && (
        <select
          className="bg-[#232323] px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={selectedEpisode}
          onChange={(e) => onEpisodeChange(parseInt(e.target.value))}
        >
          {episodes.map((episode) => (
            <option key={episode.episode_number} value={episode.episode_number}>
              Episode {episode.episode_number}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SeasonEpisodeSelector;
