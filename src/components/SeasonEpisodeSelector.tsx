
import React, { useState, useEffect } from 'react';
import { TMDB_API_KEY, TMDB_API_BASE } from '../lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  
  // Pagination for episodes
  const [currentPage, setCurrentPage] = useState<number>(1);
  const episodesPerPage = 20;
  const totalPages = Math.ceil(episodes.length / episodesPerPage);
  
  // Calculate which episodes to display based on current page
  const displayedEpisodes = episodes.slice(
    (currentPage - 1) * episodesPerPage,
    currentPage * episodesPerPage
  );

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

        // Filter out seasons with no episodes or special seasons (like season 0)
        const validSeasons = data.seasons.filter(
          (season: any) => season.season_number > 0 && season.episode_count > 0
        );

        setSeasons(validSeasons);

        if (validSeasons.length > 0) {
          const seasonToFetch = selectedSeason || validSeasons[0].season_number;
          await fetchSeasonEpisodes(contentId, seasonToFetch);
          onSeasonChange(seasonToFetch);
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

  useEffect(() => {
    if (contentId && selectedSeason > 0) {
      fetchSeasonEpisodes(contentId, selectedSeason);
      // Reset to page 1 when changing seasons
      setCurrentPage(1);
    }
  }, [contentId, selectedSeason]);

  // Determine which page contains the selected episode
  useEffect(() => {
    if (episodes.length > 0) {
      const pageForSelectedEpisode = Math.ceil(selectedEpisode / episodesPerPage);
      if (pageForSelectedEpisode !== currentPage) {
        setCurrentPage(pageForSelectedEpisode);
      }
    }
  }, [selectedEpisode, episodes.length]);

  const fetchSeasonEpisodes = async (id: number, seasonNumber: number) => {
    try {
      console.log(`Fetching episodes for season ${seasonNumber}`);
      setLoading(true);
      
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
        
        // If the current episode is greater than available episodes, reset to episode 1
        if (selectedEpisode > data.episodes.length) {
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
      setLoading(false);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Current page and neighbors
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there are more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
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
              disabled={loading}
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
            {loading && seasons.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
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

      {/* Show pagination only if there are multiple pages */}
      {episodes.length > episodesPerPage && (
        <div className="w-full flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SeasonEpisodeSelector;
