
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import SeasonEpisodeSelector from './SeasonEpisodeSelector';
import PlayerWithControls from './PlayerWithControls';
import RelatedTitles from './RelatedTitles';

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

  // Handle season change
  const handleSeasonChange = (seasonNumber: number) => {
    console.log(`Season changed to ${seasonNumber}`);
    setSelectedSeason(seasonNumber);
  };

  // Handle episode change
  const handleEpisodeChange = (episodeNumber: number) => {
    console.log(`Episode changed to ${episodeNumber}`);
    setSelectedEpisode(episodeNumber);
  };

  return (
    <div className="mt-4" ref={contentRef} id="content-top">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{selectedContent.title}</h1>
        {selectedContent.original_title !== selectedContent.title && (
          <h2 className="text-lg text-gray-400">{selectedContent.original_title}</h2>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="bg-[#161616] p-4 rounded-lg">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Select
                value={selectedServer}
                onValueChange={(value) => setSelectedServer(value)}
              >
                <SelectTrigger className="w-[180px] bg-[#232323]">
                  <SelectValue placeholder="Select Server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vidsrc">VidSrc</SelectItem>
                  <SelectItem value="vidapi">VidAPI</SelectItem>
                  <SelectItem value="streamable">Streamable</SelectItem>
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
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const newEpisode = Math.max(1, selectedEpisode - 1);
                    setSelectedEpisode(newEpisode);
                  }}
                  disabled={selectedEpisode <= 1 || loading}
                  className={`px-4 py-2 rounded text-sm ${
                    selectedEpisode <= 1 || loading
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  Previous Episode
                </button>
                <button
                  onClick={() => {
                    const newEpisode = selectedEpisode + 1;
                    setSelectedEpisode(newEpisode);
                  }}
                  disabled={selectedEpisode >= episodes.length || loading}
                  className={`px-4 py-2 rounded text-sm ${
                    selectedEpisode >= episodes.length || loading
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  Next Episode
                </button>
              </div>

              <div className="bg-[#161616] p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Episodes</h3>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episodes.map((episode) => (
                      <div
                        key={`episode-${episode.episode_number}`}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedEpisode === episode.episode_number
                            ? "bg-purple-500"
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
                <span className="bg-purple-500 px-2 py-1 rounded">
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
