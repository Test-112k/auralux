
import React, { useEffect, useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import SeasonEpisodeSelector from './SeasonEpisodeSelector';
import PlayerWithControls from './PlayerWithControls';
import RelatedTitles from './RelatedTitles';
import AnnouncementSection from './AnnouncementSection';

interface ContentViewerProps {
  selectedContent: any;
  selectedServer: string;
  setSelectedServer: (server: string) => void;
  selectedSeason: number;
  setSelectedSeason: (season: number) => void;
  selectedEpisode: number;
  setSelectedEpisode: (episode: number) => void;
  episodes: any[];
  loading: boolean;
  getStreamingUrl: (content: any) => string;
  handleContentSelection: (content: any) => void;
}

const ContentViewer = ({
  selectedContent,
  selectedServer,
  setSelectedServer,
  selectedSeason,
  setSelectedSeason,
  selectedEpisode,
  setSelectedEpisode,
  episodes,
  loading,
  getStreamingUrl,
  handleContentSelection
}: ContentViewerProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Ensure scrolling to top when content changes
  useEffect(() => {
    if (contentRef.current) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'instant' // Use 'instant' instead of 'smooth' to avoid scrolling issues
        });
      }, 100);
    }
  }, [selectedContent?.id]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSeasonChange = useCallback((seasonNumber: number) => {
    console.log(`Season changed to ${seasonNumber}`);
    setSelectedSeason(seasonNumber);
  }, [setSelectedSeason]);

  // Handle episode change
  const handleEpisodeChange = useCallback((episodeNumber: number) => {
    console.log(`Episode changed to ${episodeNumber}`);
    setSelectedEpisode(episodeNumber);
  }, [setSelectedEpisode]);

  return (
    <div className="mt-4" ref={contentRef} id="content-top">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{selectedContent.title}</h1>
          {selectedContent.original_title !== selectedContent.title && (
            <h2 className="text-lg text-gray-400">{selectedContent.original_title}</h2>
          )}
        </div>
        <a 
          href="https://t.me/auralux1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-500 hover:text-purple-400 transition-colors transform hover:scale-105 duration-300"
          title="Join our Telegram channel"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </a>
      </div>

      {/* Announcement section in watch page */}
      <div className="mb-6">
        <AnnouncementSection />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="bg-[#161616] p-4 rounded-lg">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Select
                value={selectedServer}
                onValueChange={(value) => setSelectedServer(value)}
                disabled={loading}
              >
                <SelectTrigger className="w-[180px] bg-purple-950 hover:bg-purple-800 text-white border-purple-700 transition-all duration-300">
                  <SelectValue placeholder="Select Server" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-purple-700 z-50">
                  <SelectItem value="vidsrc">Server 1</SelectItem>
                </SelectContent>
              </Select>

              {selectedContent.media_type === "tv" && (
                <SeasonEpisodeSelector
                  contentId={selectedContent.id}
                  selectedSeason={selectedSeason}
                  selectedEpisode={selectedEpisode}
                  onSeasonChange={handleSeasonChange}
                  onEpisodeChange={handleEpisodeChange}
                />
              )}
            </div>

            <PlayerWithControls 
              src={getStreamingUrl(selectedContent)} 
              title={selectedContent.title} 
              loading={loading} 
            />
          </div>

          {selectedContent.media_type === "tv" && episodes.length > 0 && (
            <>
              <div className="bg-[#161616] p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Episodes</h3>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episodes.map((episode) => (
                      <div
                        key={`episode-${episode.episode_number}`}
                        className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-102 duration-200 ${
                          selectedEpisode === episode.episode_number
                            ? "bg-purple-700 shadow-lg shadow-purple-900/50"
                            : "bg-[#232323] hover:bg-[#2a2a2a]"
                        }`}
                        onClick={() =>
                          setSelectedEpisode(episode.episode_number)
                        }
                      >
                        <div className="flex gap-4">
                          {episode.still_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                              alt={`Episode ${episode.episode_number}`}
                              className="w-40 h-24 object-cover rounded"
                              loading="lazy"
                            />
                          )}
                          <div>
                            <div className="font-semibold mb-1">
                              Episode {episode.episode_number}
                            </div>
                            <div className="text-sm text-gray-400">
                              {episode.name || `Episode ${episode.episode_number}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[#161616] p-4 rounded-lg">
            <img
              src={selectedContent.poster_path}
              alt={selectedContent.title}
              className="w-full rounded-lg shadow-lg mb-4"
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Score:</span>
                <span className="bg-purple-700 px-2 py-1 rounded">
                  {selectedContent.score?.toFixed(1) || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Status:</span>
                <span>{selectedContent.status || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Type:</span>
                <span>{selectedContent.media_type === "movie" ? "Movie" : "TV Series"}</span>
              </div>
              {selectedContent.year && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Year:</span>
                  <span>{selectedContent.year}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-[#161616] p-4 rounded-lg">
            <h3 className="font-bold mb-2">Synopsis</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {selectedContent.overview || "No synopsis available."}
            </p>
          </div>
        </div>
      </div>
      
      {/* Related Titles */}
      <div className="mt-8">
        <RelatedTitles 
          contentId={selectedContent.id}
          mediaType={selectedContent.media_type}
          onSelectContent={handleContentSelection}
        />
      </div>
    </div>
  );
};

export default ContentViewer;
