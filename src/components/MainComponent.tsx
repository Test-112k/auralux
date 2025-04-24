import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowLeft, ArrowUp, Menu } from "lucide-react";
import { TMDB_API_KEY, TMDB_API_BASE, STREAMING_SERVERS, CONTENT_TYPES, ITEMS_PER_PAGE } from "../lib/constants";
import RelatedTitles from "./RelatedTitles";

function MainComponent() {
  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedServer, setSelectedServer] = useState("vidsrc");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentType, setContentType] = useState(CONTENT_TYPES.ANIME);
  
  // Content lists
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [hindiContent, setHindiContent] = useState([]);
  const [trendingHindi, setTrendingHindi] = useState([]);
  
  // Pagination variables
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // Initial load
  useEffect(() => {
    fetchTrendingAndPopular();
  }, [contentType]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchContent();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, contentType]);

  // Content details fetching
  useEffect(() => {
    if (selectedContent?.id) {
      if (selectedContent.media_type === "movie") {
        fetchMovieDetails(selectedContent.id);
      } else {
        fetchTVDetails(selectedContent.id);
      }
    }
  }, [selectedContent]);

  // Reset page when content type changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [contentType]);

  // Infinite scroll implementation with proper typing
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreContent();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadMoreContent = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      let endpoint = "";
      let setter;
      
      switch(contentType) {
        case CONTENT_TYPES.ANIME:
          endpoint = `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc&page=${nextPage}`;
          setter = setPopularAnime;
          break;
        case CONTENT_TYPES.MOVIE:
          endpoint = `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=${nextPage}`;
          setter = setPopularMovies;
          break;
        case CONTENT_TYPES.TV:
          endpoint = `${TMDB_API_BASE}/tv/popular?api_key=${TMDB_API_KEY}&without_genres=16&page=${nextPage}`;
          setter = setPopularTV;
          break;
        case CONTENT_TYPES.HINDI_ENG:
          endpoint = `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi|en&region=IN&page=${nextPage}`;
          setter = setHindiContent;
          break;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch more ${contentType}`);
      
      const data = await response.json();
      const formattedData = formatContentData(data.results, contentType === CONTENT_TYPES.MOVIE ? "movie" : "tv");
      
      // Append new data to existing data
      setter(prev => [...prev, ...formattedData]);
      
      setPage(nextPage);
      setHasMore(data.page < data.total_pages);
    } catch (error) {
      console.error("Error loading more content:", error);
      setError(`Failed to load more ${contentType}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Add new scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update Hindi content fetch to filter only Indian content
  const fetchTrendingAndPopular = async () => {
    try {
      setLoading(true);
      
      if (contentType === CONTENT_TYPES.ANIME) {
        const [trendingResponse, popularResponse] = await Promise.all([
          fetch(
            `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc&page=1`
          ),
          fetch(
            `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc&page=2`
          ),
        ]);

        if (!trendingResponse.ok || !popularResponse.ok) {
          throw new Error("Failed to fetch anime");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();

        setTrendingAnime(formatContentData(trendingData.results, "tv"));
        setPopularAnime(formatContentData(popularData.results, "tv"));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.MOVIE) {
        const [trendingResponse, popularResponse] = await Promise.all([
          fetch(
            `${TMDB_API_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}`
          ),
          fetch(
            `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}`
          ),
        ]);

        if (!trendingResponse.ok || !popularResponse.ok) {
          throw new Error("Failed to fetch movies");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();

        setTrendingMovies(formatContentData(trendingData.results, "movie"));
        setPopularMovies(formatContentData(popularData.results, "movie"));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.TV) {
        const [trendingResponse, popularResponse] = await Promise.all([
          fetch(
            `${TMDB_API_BASE}/trending/tv/week?api_key=${TMDB_API_KEY}&without_genres=16`
          ),
          fetch(
            `${TMDB_API_BASE}/tv/popular?api_key=${TMDB_API_KEY}&without_genres=16`
          ),
        ]);

        if (!trendingResponse.ok || !popularResponse.ok) {
          throw new Error("Failed to fetch TV series");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();

        setTrendingTV(formatContentData(trendingData.results, "tv"));
        setPopularTV(formatContentData(popularData.results, "tv"));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.HINDI_ENG) {
        const [trendingResponse, popularResponse] = await Promise.all([
          fetch(
            `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=1`
          ),
          fetch(
            `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&region=IN&sort_by=popularity.desc&page=1`
          ),
        ]);

        if (!trendingResponse.ok || !popularResponse.ok) {
          throw new Error("Failed to fetch Hindi-Eng content");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();

        setTrendingHindi(formatContentData(trendingData.results, "movie"));
        setHindiContent(formatContentData(popularData.results, "movie"));
        
        setHasMore(popularData.page < popularData.total_pages);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Failed to load ${contentType} data`);
    } finally {
      setLoading(false);
    }
  };

  const formatContentData = (items, mediaType) => {
    return items.map((item) => ({
      id: item.id,
      title: mediaType === "movie" ? item.title : item.name,
      overview: item.overview,
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      score: item.vote_average,
      year: mediaType === "movie"
        ? (item.release_date?.split("-")[0] || "N/A")
        : (item.first_air_date?.split("-")[0] || "N/A"),
      status: item.status,
      media_type: mediaType,
      imdb_id: item.imdb_id || null
    }));
  };

  const searchContent = async () => {
    try {
      setLoading(true);
      let endpoint;
      
      if (contentType === CONTENT_TYPES.MOVIE) {
        endpoint = `${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}`;
      } else if (contentType === CONTENT_TYPES.TV) {
        endpoint = `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}`;
      } else if (contentType === CONTENT_TYPES.ANIME) {
        endpoint = `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&with_genres=16`;
      } else if (contentType === CONTENT_TYPES.HINDI_ENG) {
        endpoint = `${TMDB_API_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${searchQuery}&region=IN`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      const mediaType = contentType === CONTENT_TYPES.MOVIE ? "movie" : "tv";
      const formattedResults = formatContentData(data.results, mediaType);
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchTVDetails = async (id) => {
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
      );
      if (!response.ok) throw new Error("Failed to fetch TV details");
      const data = await response.json();

      // Update selected content with IMDB ID if available
      if (data.external_ids?.imdb_id) {
        setSelectedContent(prev => ({...prev, imdb_id: data.external_ids.imdb_id}));
      }

      const validSeasons = data.seasons.filter(
        (season) => season.season_number > 0 && season.episode_count > 0
      );

      setSeasons(validSeasons);

      if (validSeasons.length > 0) {
        setSelectedSeason(validSeasons[0].season_number);
        await fetchSeasonEpisodes(id, validSeasons[0].season_number);
        setSelectedEpisode(1);
      }
    } catch (error) {
      console.error("Error fetching TV details:", error);
      setError("Failed to load TV details");
    }
  };
  
  const fetchMovieDetails = async (id) => {
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
      );
      if (!response.ok) throw new Error("Failed to fetch movie details");
      const data = await response.json();
      
      // Update selected content with IMDB ID if available
      if (data.imdb_id) {
        setSelectedContent(prev => ({...prev, imdb_id: data.imdb_id}));
      }
      
      setSeasons([]);
      setEpisodes([]);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setError("Failed to load movie details");
    }
  };

  const fetchSeasonEpisodes = async (id, seasonNumber) => {
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      if (!response.ok) throw new Error("Failed to fetch season episodes");
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error("Error fetching season episodes:", error);
      setError("Failed to load episodes");
    }
  };

  const handleSeasonChange = async (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    if (selectedContent?.id) {
      await fetchSeasonEpisodes(selectedContent.id, seasonNumber);
    }
  };

  const getStreamingUrl = (content) => {
    if (!content?.id) return "";

    // Use IMDB ID if available for VidAPI
    if (selectedServer === "vidapi" && content.imdb_id) {
      if (content.media_type === "movie") {
        return STREAMING_SERVERS.vidapi.movieUrl(content.imdb_id);
      } else {
        return STREAMING_SERVERS.vidapi.tvUrl(content.imdb_id, selectedSeason, selectedEpisode);
      }
    }

    // Fall back to TMDB ID
    if (content.media_type === "movie") {
      return selectedServer === "vidsrc" 
        ? STREAMING_SERVERS.vidsrc.movieUrl(content.id)
        : STREAMING_SERVERS.vidapi.movieUrl(content.id);
    } else {
      return selectedServer === "vidsrc" 
        ? STREAMING_SERVERS.vidsrc.tvUrl(content.id, selectedSeason, selectedEpisode)
        : STREAMING_SERVERS.vidapi.tvUrl(content.id, selectedSeason, selectedEpisode);
    }
  };

  const handleContentSelection = async (content) => {
    setSelectedContent(content);
    setSearchQuery("");
    setSearchResults([]);

    try {
      if (content.media_type === "movie") {
        await fetchMovieDetails(content.id);
      } else {
        await fetchTVDetails(content.id);
      }
    } catch (error) {
      console.error("Error fetching content details:", error);
      setError("Failed to load content details");
    }
  };

  const handleReturnHome = () => {
    setSelectedContent(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedContent(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (loading && !selectedContent) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !selectedContent) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTrendingAndPopular();
            }}
            className="mt-4 bg-purple-500 px-4 py-2 rounded hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getCurrentContent = () => {
    switch (contentType) {
      case CONTENT_TYPES.ANIME:
        return {
          trending: trendingAnime,
          popular: popularAnime
        };
      case CONTENT_TYPES.MOVIE:
        return {
          trending: trendingMovies,
          popular: popularMovies
        };
      case CONTENT_TYPES.TV:
        return {
          trending: trendingTV,
          popular: popularTV
        };
      case CONTENT_TYPES.HINDI_ENG:
        return {
          trending: trendingHindi,
          popular: hindiContent
        };
      default:
        return {
          trending: [],
          popular: []
        };
    }
  };

  const currentContent = getCurrentContent();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="bg-[#161616] p-4 fixed w-full top-0 z-50 border-b border-gray-800">
        {selectedContent && (
          <button
            onClick={handleReturnHome}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1
              onClick={handleReturnHome}
              className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
              Auralux
            </h1>
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => handleContentTypeChange(CONTENT_TYPES.ANIME)}
                className={`${contentType === CONTENT_TYPES.ANIME ? "text-purple-500" : "text-gray-300"} hover:text-purple-500 transition-colors`}
              >
                Anime
              </button>
              <button 
                onClick={() => handleContentTypeChange(CONTENT_TYPES.MOVIE)}
                className={`${contentType === CONTENT_TYPES.MOVIE ? "text-purple-500" : "text-gray-300"} hover:text-purple-500 transition-colors`}
              >
                Movies
              </button>
              <button 
                onClick={() => handleContentTypeChange(CONTENT_TYPES.TV)}
                className={`${contentType === CONTENT_TYPES.TV ? "text-purple-500" : "text-gray-300"} hover:text-purple-500 transition-colors`}
              >
                TV Series
              </button>
              <button 
                onClick={() => handleContentTypeChange(CONTENT_TYPES.HINDI_ENG)}
                className={`${contentType === CONTENT_TYPES.HINDI_ENG ? "text-purple-500" : "text-gray-300"} hover:text-purple-500 transition-colors`}
              >
                Hindi-Eng
              </button>
            </div>
          </div>
          <div className="relative w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-[#232323] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-[#232323] rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 border border-gray-700">
                {searchResults.map((item) => (
                  <div
                    key={`search-${item.id}`}
                    className="p-3 hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-3 border-b border-gray-700 last:border-none"
                    onClick={() => handleContentSelection(item)}
                  >
                    {item.poster_path && (
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.media_type === "movie" ? "Movie" : "TV"} • {item.year || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-[#161616] z-40 border-b border-gray-800 animate-fade-in">
          <div className="p-4 space-y-2">
            <button 
              onClick={() => {
                handleContentTypeChange(CONTENT_TYPES.ANIME);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded text-left ${
                contentType === CONTENT_TYPES.ANIME ? "bg-purple-500" : "bg-[#232323]"
              }`}
            >
              Anime
            </button>
            <button 
              onClick={() => {
                handleContentTypeChange(CONTENT_TYPES.MOVIE);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded text-left ${
                contentType === CONTENT_TYPES.MOVIE ? "bg-purple-500" : "bg-[#232323]"
              }`}
            >
              Movies
            </button>
            <button 
              onClick={() => {
                handleContentTypeChange(CONTENT_TYPES.TV);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded text-left ${
                contentType === CONTENT_TYPES.TV ? "bg-purple-500" : "bg-[#232323]"
              }`}
            >
              TV Series
            </button>
            <button 
              onClick={() => {
                handleContentTypeChange(CONTENT_TYPES.HINDI_ENG);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded text-left ${
                contentType === CONTENT_TYPES.HINDI_ENG ? "bg-purple-500" : "bg-[#232323]"
              }`}
            >
              Hindi
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto pt-24 px-4 pb-12">
        {selectedContent ? (
          <div className="mt-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{selectedContent.title}</h1>
              {selectedContent.title_japanese && (
                <h2 className="text-lg text-gray-400">
                  {selectedContent.title_japanese}
                </h2>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-4">
                <div className="bg-[#161616] p-4 rounded-lg">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <select
                      className="bg-[#232323] px-4 py-2 rounded text-sm"
                      value={selectedServer}
                      onChange={(e) => setSelectedServer(e.target.value)}
                    >
                      <option value="vidsrc">VidSrc</option>
                      <option value="vidapi">VidAPI</option>
                    </select>

                    {selectedContent.media_type === "tv" && (
                      <>
                        <select
                          className="bg-[#232323] px-4 py-2 rounded text-sm"
                          value={selectedSeason}
                          onChange={(e) =>
                            handleSeasonChange(Number(e.target.value))
                          }
                          disabled={loading}
                        >
                          {seasons.map((season) => (
                            <option
                              key={season.season_number}
                              value={season.season_number}
                            >
                              Season {season.season_number}
                            </option>
                          ))}
                        </select>

                        <select
                          className="bg-[#232323] px-4 py-2 rounded text-sm"
                          value={selectedEpisode}
                          onChange={(e) =>
                            setSelectedEpisode(Number(e.target.value))
                          }
                          disabled={loading}
                        >
                          {episodes.map((episode) => (
                            <option
                              key={episode.episode_number}
                              value={episode.episode_number}
                            >
                              Episode {episode.episode_number}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : (
                      <iframe
                        key={`${selectedContent.id}-${selectedSeason}-${selectedEpisode}-${selectedServer}`}
                        src={getStreamingUrl(selectedContent)}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="origin"
                        title={selectedContent.title}
                      ></iframe>
                    )}
                  </div>
                </div>

                {selectedContent.media_type === "tv" && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() =>
                          setSelectedEpisode((prev) => Math.max(1, prev - 1))
                        }
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
                        onClick={() => setSelectedEpisode((prev) => prev + 1)}
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
                                  {episode.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                        {selectedContent.score || "N/A"}
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
            
            {/* Related Titles moved to bottom */}
            <div className="mt-8">
              <RelatedTitles 
                contentId={selectedContent.id}
                mediaType={selectedContent.media_type}
                onSelectContent={handleContentSelection}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[#161616] p-4 rounded-lg mb-8 md:hidden">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleContentTypeChange(CONTENT_TYPES.ANIME)}
                  className={`py-2 rounded text-xs ${
                    contentType === CONTENT_TYPES.ANIME ? "bg-purple-500" : "bg-[#232323]"
                  }`}
                >
                  Anime
                </button>
                <button
                  onClick={() => handleContentTypeChange(CONTENT_TYPES.MOVIE)}
                  className={`py-2 rounded text-xs ${
                    contentType === CONTENT_TYPES.MOVIE ? "bg-purple-500" : "bg-[#232323]"
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => handleContentTypeChange(CONTENT_TYPES.TV)}
                  className={`py-2 rounded text-xs ${
                    contentType === CONTENT_TYPES.TV ? "bg-purple-500" : "bg-[#232323]"
                  }`}
                >
                  TV
                </button>
                <button
                  onClick={() => handleContentTypeChange(CONTENT_TYPES.HINDI_ENG)}
                  className={`py-2 rounded text-xs ${
                    contentType === CONTENT_TYPES.HINDI_ENG ? "bg-purple-500" : "bg-[#232323]"
                  }`}
                >
                  Hindi
                </button>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-white">
                Trending {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {currentContent.trending.map((item) => (
                  <div
                    key={`trending-${item.id}`}
                    className="bg-[#161616] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => handleContentSelection(item)}
                  >
                    {item.poster_path ? (
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{item.year || "N/A"}</span>
                        <span className="text-xs bg-purple-500 px-1.5 py-0.5 rounded">
                          {item.score?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6 text-white">
                Popular {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {currentContent.popular.map((item, index) => (
                  <div
                    key={`popular-${item.id}`}
                    className="bg-[#161616] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => handleContentSelection(item)}
                    ref={
                      index === currentContent.popular.length - 1
                        ? lastElementRef
                        : null
                    }
                  >
                    {item.poster_path ? (
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{item.year || "N/A"}</span>
                        <span className="text-xs bg-purple-500 px-1.5 py-0.5 rounded">
                          {item.score?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {loadingMore && (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed right-6 bottom-6 bg-purple-500 p-3 rounded-full shadow-lg z-50 hover:bg-purple-600 transition-colors"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

export default MainComponent;
