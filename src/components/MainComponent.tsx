import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowLeft, ArrowUp, Menu, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TMDB_API_KEY, TMDB_API_BASE, STREAMING_SERVERS, CONTENT_TYPES, ITEMS_PER_PAGE, REGIONS } from "../lib/constants";
import RegionSelector from "./RegionSelector";
import ContentViewer from "./ContentViewer";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

function MainComponent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]); // Default to first region (India)
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  
  // Content lists
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [newArrivalsAnime, setNewArrivalsAnime] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [newArrivalsMovies, setNewArrivalsMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [newArrivalsTV, setNewArrivalsTV] = useState([]);
  const [hindiContent, setHindiContent] = useState([]);
  const [trendingHindi, setTrendingHindi] = useState([]);
  const [newArrivalsHindi, setNewArrivalsHindi] = useState([]);
  
  // Pagination variables
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for stored content from search page
  useEffect(() => {
    const storedContent = localStorage.getItem('selectedContent');
    if (storedContent) {
      try {
        const parsedContent = JSON.parse(storedContent);
        setSelectedContent(parsedContent);
        localStorage.removeItem('selectedContent');
      } catch (e) {
        console.error("Error parsing stored content", e);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrendingAndPopular();
  }, [contentType, selectedRegion]);

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
  }, [searchQuery, contentType, selectedRegion]);

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
  }, [contentType, selectedRegion]);

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
      
      // Common parameter to exclude adult content
      const excludeAdultContent = "&include_adult=false&certification.lte=PG-13";
      
      switch(contentType) {
        case CONTENT_TYPES.ANIME:
          endpoint = `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=first_air_date.desc&first_air_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=${nextPage}`;
          setter = setPopularAnime;
          break;
        case CONTENT_TYPES.MOVIE:
          endpoint = `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}${excludeAdultContent}&page=${nextPage}`;
          setter = setPopularMovies;
          break;
        case CONTENT_TYPES.TV:
          endpoint = `${TMDB_API_BASE}/tv/popular?api_key=${TMDB_API_KEY}&without_genres=16${excludeAdultContent}&page=${nextPage}`;
          setter = setPopularTV;
          break;
        case CONTENT_TYPES.REGIONAL:
          endpoint = `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${selectedRegion.language}&region=${selectedRegion.code}&sort_by=popularity.desc${excludeAdultContent}&page=${nextPage}`;
          setter = setHindiContent;
          break;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch more ${contentType}`);
      
      const data = await response.json();
      const formattedData = formatContentData(data.results, contentType === CONTENT_TYPES.MOVIE || contentType === CONTENT_TYPES.REGIONAL ? "movie" : "tv");
      
      // Append new data to existing data
      setter(prev => [...prev, ...formattedData]);
      
      setPage(nextPage);
      setHasMore(data.page < data.total_pages);
    } catch (error) {
      console.error("Error loading more content:", error);
      setError(`Failed to load more ${contentType}`);
      toast({
        title: "Error loading content",
        description: `Failed to load more ${contentType}`,
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Update content fetch to filter by region and get most recent content
  const fetchTrendingAndPopular = async () => {
    try {
      setLoading(true);
      
      // Common parameters to exclude adult content across all requests
      const excludeAdultContent = "&include_adult=false&certification.lte=PG-13";
      
      if (contentType === CONTENT_TYPES.ANIME) {
        // For anime trending, we'll use a discover endpoint with better filters since airing_today doesn't work well
        const trendingResponse = await fetch(
          `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=first_air_date.desc&first_air_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=1`
        );
        
        // Get popular anime - ensure it's from Japan with animation genre
        const popularResponse = await fetch(
          `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc${excludeAdultContent}&page=1`
        );
        
        // Get new arrivals - anime from Japan with most recent first, limit to last 2 years for freshness
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];
        
        const newArrivalsResponse = await fetch(
          `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=first_air_date.desc&first_air_date.gte=${twoYearsAgoStr}&first_air_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=1`
        );

        if (!trendingResponse.ok || !popularResponse.ok || !newArrivalsResponse.ok) {
          throw new Error("Failed to fetch anime");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();
        const newArrivalsData = await newArrivalsResponse.json();

        console.log("Anime trending data:", trendingData);

        // Filter out shows with null or empty posters for better UI experience
        const filterValidShows = (shows) => shows.filter(show => show.poster_path);
        
        // Double-check that we're getting anime (genre 16) and from Japan
        const filterAnime = (shows) => shows.filter(show => {
          const hasAnimation = show.genre_ids && show.genre_ids.includes(16);
          const isJapanese = show.origin_country && show.origin_country.includes("JP");
          return hasAnimation && isJapanese;
        });

        // Add anime tag to make it clear these are anime
        setTrendingAnime(formatContentData(filterAnime(filterValidShows(trendingData.results)), "tv").map(item => ({...item, isAnime: true})));
        setPopularAnime(formatContentData(filterAnime(filterValidShows(popularData.results)), "tv").map(item => ({...item, isAnime: true})));
        setNewArrivalsAnime(formatContentData(filterAnime(filterValidShows(newArrivalsData.results)), "tv").map(item => ({...item, isAnime: true})));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.MOVIE) {
        // Get trending movies - prioritize current week for true trending
        const trendingResponse = await fetch(
          `${TMDB_API_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}${excludeAdultContent}`
        );
        
        // Get popular movies (overall popularity)
        const popularResponse = await fetch(
          `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}${excludeAdultContent}`
        );
        
        // Get new arrivals (newest first)
        const newArrivalsResponse = await fetch(
          `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=1`
        );

        if (!trendingResponse.ok || !popularResponse.ok || !newArrivalsResponse.ok) {
          throw new Error("Failed to fetch movies");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();
        const newArrivalsData = await newArrivalsResponse.json();

        setTrendingMovies(formatContentData(trendingData.results, "movie"));
        setPopularMovies(formatContentData(popularData.results, "movie"));
        setNewArrivalsMovies(formatContentData(newArrivalsData.results, "movie"));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.TV) {
        // Get trending TV - updated to use daily trending for recency, exclude animation genre
        const trendingResponse = await fetch(
          `${TMDB_API_BASE}/trending/tv/day?api_key=${TMDB_API_KEY}${excludeAdultContent}`
        );
        
        // Get popular TV - exclude animation genre to avoid anime
        const popularResponse = await fetch(
          `${TMDB_API_BASE}/tv/popular?api_key=${TMDB_API_KEY}${excludeAdultContent}`
        );
        
        // Get new arrivals - exclude animation genre
        const newArrivalsResponse = await fetch(
          `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&sort_by=first_air_date.desc&first_air_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=1`
        );

        if (!trendingResponse.ok || !popularResponse.ok || !newArrivalsResponse.ok) {
          throw new Error("Failed to fetch TV series");
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();
        const newArrivalsData = await newArrivalsResponse.json();

        // Filter out animation genre (16) to avoid showing anime in TV section
        const filterNonAnime = (shows) => shows.filter(show => 
          !(show.genre_ids && show.genre_ids.includes(16) && 
            show.origin_country && show.origin_country.includes("JP"))
        );

        setTrendingTV(formatContentData(filterNonAnime(trendingData.results), "tv"));
        setPopularTV(formatContentData(filterNonAnime(popularData.results), "tv"));
        setNewArrivalsTV(formatContentData(filterNonAnime(newArrivalsData.results), "tv"));
        
        setHasMore(popularData.page < popularData.total_pages);
      } else if (contentType === CONTENT_TYPES.REGIONAL) {
        // Get trending regional content (last 7 days)
        const trendingResponse = await fetch(
          `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${selectedRegion.language}&region=${selectedRegion.code}&sort_by=popularity.desc${excludeAdultContent}&page=1`
        );
        
        // Get popular regional content (overall popularity)
        const popularResponse = await fetch(
          `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${selectedRegion.language}&region=${selectedRegion.code}&sort_by=popularity.desc${excludeAdultContent}&page=2`
        );
        
        // Get new arrivals (newest first)
        const newArrivalsResponse = await fetch(
          `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${selectedRegion.language}&region=${selectedRegion.code}&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}${excludeAdultContent}&page=1`
        );

        if (!trendingResponse.ok || !popularResponse.ok || !newArrivalsResponse.ok) {
          throw new Error(`Failed to fetch ${selectedRegion.name} content`);
        }

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();
        const newArrivalsData = await newArrivalsResponse.json();

        setTrendingHindi(formatContentData(trendingData.results, "movie"));
        setHindiContent(formatContentData(popularData.results, "movie"));
        setNewArrivalsHindi(formatContentData(newArrivalsData.results, "movie"));
        
        setHasMore(popularData.page < popularData.total_pages);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Failed to load ${contentType} data`);
      toast({
        title: "Error loading data",
        description: `Failed to load ${contentType} data`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format API data into consistent format
  const formatContentData = (items, mediaType) => {
    return items.map((item) => ({
      id: item.id,
      title: mediaType === "movie" ? item.title || item.name || "N/A" : item.name || item.title || "N/A",
      original_title: mediaType === "movie" ? item.original_title || "N/A" : item.original_name || "N/A",
      overview: item.overview || "No overview available",
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdrop_path: item.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : null,
      score: item.vote_average || 0,
      year: mediaType === "movie"
        ? (item.release_date?.split("-")[0] || "N/A")
        : (item.first_air_date?.split("-")[0] || "N/A"),
      status: item.status || "Unknown",
      media_type: mediaType,
      imdb_id: item.imdb_id || null,
      popularity: item.popularity || 0
    }));
  };

  // Search content - update to ensure anime search respects genre filter
  const searchContent = async () => {
    try {
      setLoading(true);
      let endpoint;
      
      // Common parameter to exclude adult content
      const excludeAdultContent = "&include_adult=false";
      
      if (contentType === CONTENT_TYPES.REGIONAL) {
        endpoint = `${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&with_original_language=${selectedRegion.language}&region=${selectedRegion.code}${excludeAdultContent}`;
      } else {
        if (contentType === CONTENT_TYPES.MOVIE) {
          endpoint = `${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}${excludeAdultContent}`;
        } else if (contentType === CONTENT_TYPES.TV) {
          endpoint = `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&without_genres=16${excludeAdultContent}`;
        } else if (contentType === CONTENT_TYPES.ANIME) {
          endpoint = `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&with_genres=16&with_origin_country=JP${excludeAdultContent}`;
        }
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      const mediaType = contentType === CONTENT_TYPES.MOVIE || contentType === CONTENT_TYPES.REGIONAL ? "movie" : "tv";
      
      // For anime, ensure we're only including actual anime
      let results = data.results;
      if (contentType === CONTENT_TYPES.ANIME) {
        results = results.filter(show => {
          const hasAnimation = show.genre_ids && show.genre_ids.includes(16);
          const isJapanese = show.origin_country && show.origin_country.includes("JP");
          return hasAnimation && isJapanese;
        });
      }
      
      const formattedResults = formatContentData(results, mediaType);
      
      // If there are too many results, suggest moving to search page
      if (data.total_results > 20) {
        console.log(`Found ${data.total_results} results, showing first 20`);
      }
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch TV details
  const fetchTVDetails = async (id) => {
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
      );
      if (!response.ok) throw new Error("Failed to fetch TV details");
      const data = await response.json();

      console.log("TV details:", data);

      // Update selected content with IMDB ID if available
      if (data.external_ids?.imdb_id) {
        setSelectedContent(prev => ({...prev, imdb_id: data.external_ids.imdb_id}));
      }

      const validSeasons = data.seasons.filter(
        (season) => season.season_number > 0 && season.episode_count > 0
      );

      setSeasons(validSeasons);

      if (validSeasons.length > 0) {
        // Use the existing selectedSeason if it's valid, otherwise default to the first valid season
        const seasonNumber = validSeasons.some(s => s.season_number === selectedSeason) 
          ? selectedSeason 
          : validSeasons[0].season_number;
          
        setSelectedSeason(seasonNumber);
        await fetchSeasonEpisodes(id, seasonNumber);
      }
    } catch (error) {
      console.error("Error fetching TV details:", error);
      setError("Failed to load TV details");
      toast({
        title: "Error loading TV details",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  // Fetch movie details
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
      toast({
        title: "Error loading movie details",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Fetch season episodes
  const fetchSeasonEpisodes = async (id, seasonNumber) => {
    try {
      console.log(`Fetching episodes for season ${seasonNumber}`);
      const response = await fetch(
        `${TMDB_API_BASE}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      if (!response.ok) throw new Error("Failed to fetch season episodes");
      const data = await response.json();
      console.log("Season episodes:", data);
      
      if (data.episodes && data.episodes.length > 0) {
        setEpisodes(data.episodes);
        
        // Keep the current episode if it's valid for the new season
        const validEpisode = data.episodes.some(e => e.episode_number === selectedEpisode);
        if (!validEpisode) {
          setSelectedEpisode(1); // Reset to first episode if current episode isn't valid
        }
      } else {
        setEpisodes([]);
        setSelectedEpisode(1);
      }
    } catch (error) {
      console.error("Error fetching season episodes:", error);
      setError("Failed to load episodes");
      toast({
        title: "Error loading episodes",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Get streaming URL
  const getStreamingUrl = (content) => {
    if (!content?.id) return "";

    // Use TMDB ID for all servers as they all support it now
    if (content.media_type === "movie") {
      return STREAMING_SERVERS[selectedServer].movieUrl(content.id);
    } else {
      return STREAMING_SERVERS[selectedServer].tvUrl(content.id, selectedSeason, selectedEpisode);
    }
  };

  // Handle content selection
  const handleContentSelection = async (content) => {
    // Set to null first to ensure re-rendering
    setSelectedContent(null);
    
    // Reset these values when selecting new content
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setSeasons([]);
    setEpisodes([]);
    
    // Then set the new content after a brief delay to ensure proper re-rendering
    setTimeout(() => {
      setSelectedContent(content);
      setSearchQuery("");
      setSearchResults([]);
      
      // Scroll to top when content is selected
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 100);
  };

  // Handle return to home
  const handleReturnHome = () => {
    setSelectedContent(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedContent(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle region change
  const handleRegionChange = (code) => {
    const newRegion = REGIONS.find(r => r.code === code) || REGIONS[0];
    setSelectedRegion(newRegion);
    setShowRegionSelector(false);
    console.log("Region changed to:", newRegion);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.length > 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
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

  // Content card component to reduce repetition - add anime badge
  const ContentCard = ({ item, index, refCallback = null }: { item: any; index: any; refCallback?: any }) => (
    <div
      key={`content-${item.id}`}
      ref={refCallback}
      className="bg-[#161616] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg"
      onClick={() => handleContentSelection(item)}
    >
      <div className="relative">
        {item.poster_path ? (
          <img
            src={item.poster_path}
            alt={item.title}
            className="w-full aspect-[2/3] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
            <span className="text-sm text-gray-500">No Image</span>
          </div>
        )}
        {item.isAnime && (
          <span className="absolute top-2 right-2 text-xs bg-yellow-500 px-2 py-0.5 rounded-sm font-medium">
            Anime
          </span>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{item.year || "N/A"}</span>
          <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-sm">
            {item.score?.toFixed(1) || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );

  const getCurrentContent = () => {
    switch (contentType) {
      case CONTENT_TYPES.ANIME:
        return {
          trending: trendingAnime,
          popular: popularAnime,
          newArrivals: newArrivalsAnime
        };
      case CONTENT_TYPES.MOVIE:
        return {
          trending: trendingMovies,
          popular: popularMovies,
          newArrivals: newArrivalsMovies
        };
      case CONTENT_TYPES.TV:
        return {
          trending: trendingTV,
          popular: popularTV,
          newArrivals: newArrivalsTV
        };
      case CONTENT_TYPES.REGIONAL:
        return {
          trending: trendingHindi,
          popular: hindiContent,
          newArrivals: newArrivalsHindi
        };
      default:
        return {
          trending: [],
          popular: [],
          newArrivals: []
        };
    }
  };

  const currentContent = getCurrentContent();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden">
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
                onClick={() => {
                  handleContentTypeChange(CONTENT_TYPES.REGIONAL);
                  setShowRegionSelector(true);
                }}
                className={`${contentType === CONTENT_TYPES.REGIONAL ? "text-purple-500" : "text-gray-300"} hover:text-purple-500 transition-colors`}
              >
                Regional
              </button>
              
              {contentType === CONTENT_TYPES.REGIONAL && (
                <div className="relative">
                  <button 
                    onClick={() => setShowRegionSelector(!showRegionSelector)}
                    className="flex items-center gap-2 px-3 py-1 bg-[#232323] rounded-md border border-gray-700 hover:bg-[#2a2a2a]"
                  >
                    <span className="text-lg mr-1">{selectedRegion.flag}</span>
                    <span>{selectedRegion.name}</span>
                  </button>
                  
                  {showRegionSelector && (
                    <div className="absolute top-full mt-2 left-0 z-50 w-80">
                      <RegionSelector 
                        selectedRegion={selectedRegion} 
                        onRegionChange={handleRegionChange} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
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
                <div className="absolute w-full mt-2 bg-[#232323] rounded-lg shadow-lg z-50 border border-gray-700">
                  <ScrollArea className="h-96">
                    {searchResults.map((item) => (
                      <div
                        key={`search-${item.id}`}
                        className="p-3 hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-3 border-b border-gray-700 last:border-none"
                        onClick={() => handleContentSelection(item)}
                      >
                        {item.poster_path ? (
                          <img
                            src={item.poster_path}
                            alt={item.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-800 flex items-center justify-center rounded">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {item.media_type === "movie" ? "Movie" : "TV"} • {item.year || "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {searchResults.length > 10 && (
                      <button
                        onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                        className="w-full p-3 text-center text-sm text-purple-400 hover:text-purple-300 bg-[#1a1a1a]"
                      >
                        See all results
                      </button>
                    )}
                  </ScrollArea>
                </div>
              )}
            </form>
            <a 
              href="https://t.me/auralux1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center"
              title="Join our Telegram channel"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-6 h-6"
              >
                <path d="M21.6 5.2L2.4 11.2c-.99.4-.99 1.8 0 2.2l4.8 1.8 1.8 5.8c.22.7 1.2.96 1.78.43l2.5-2.28 4.9 3.93c.67.52 1.67.1 1.82-.76L22 6.4c.2-1.1-.76-2-1.6-1.2z" />
                <path d="M11 14l-5 3.5" />
                <path d="M14 13l-3 1" />
              </svg>
            </a>
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
              TV
            </button>
            <button 
              onClick={() => {
                handleContentTypeChange(CONTENT_TYPES.REGIONAL);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-4 rounded text-left ${
                contentType === CONTENT_TYPES.REGIONAL ? "bg-purple-500" : "bg-[#232323]"
              }`}
            >
              Regional
            </button>
            
            {contentType === CONTENT_TYPES.REGIONAL && (
              <div className="mt-2">
                <RegionSelector 
                  selectedRegion={selectedRegion} 
                  onRegionChange={handleRegionChange} 
                />
              </div>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto pt-24 px-4 pb-12 overflow-hidden">
        {selectedContent ? (
          <ContentViewer
            selectedContent={selectedContent}
            selectedServer={selectedServer}
            setSelectedServer={setSelectedServer}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            selectedEpisode={selectedEpisode}
            setSelectedEpisode={setSelectedEpisode}
            episodes={episodes}
            loading={loading}
            getStreamingUrl={getStreamingUrl}
            handleContentSelection={handleContentSelection}
          />
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
                  onClick={() => handleContentTypeChange(CONTENT_TYPES.REGIONAL)}
                  className={`py-2 rounded text-xs ${
                    contentType === CONTENT_TYPES.REGIONAL ? "bg-purple-500" : "bg-[#232323]"
                  }`}
                >
                  Regional
                </button>
              </div>
              
              {contentType === CONTENT_TYPES.REGIONAL && (
                <div className="mt-2">
                  <RegionSelector 
                    selectedRegion={selectedRegion} 
                    onRegionChange={handleRegionChange} 
                  />
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-lg mb-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-4">
                  <h2 className="text-xl font-bold text-white mb-2">Watch Hindi-English Dubbed titles</h2>
                  <p className="text-gray-200">
                    Visit our website or Telegram channel. Facing issues? Report to us right away.
                  </p>
                </div>
                <div className="flex gap-3">
                  <a 
                    href="https://t.me/auralux1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 transition-colors rounded-full font-semibold text-white flex items-center gap-2"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-5 h-5"
                    >
                      <path d="M21.6 5.2L2.4 11.2c-.99.4-.99 1.8 0 2.2l4.8 1.8 1.8 5.8c.22.7 1.2.96 1.78.43l2.5-2.28 4.9 3.93c.67.52 1.67.1 1.82-.76L22 6.4c.2-1.1-.76-2-1.6-1.2z" />
                      <path d="M11 14l-5 3.5" />
                      <path d="M14 13l-3 1" />
                    </svg>
                    Join Now
                  </a>
                  <a 
                    href="https://auralux.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 transition-colors rounded-full font-semibold text-white flex items-center gap-2"
                  >
                    Website
                  </a>
                </div>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-white">Trending</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {currentContent.trending.map((item, index) => (
                  <ContentCard key={`trending-${item.id}`} item={item} index={index} />
                ))}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-white">Popular</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {currentContent.popular.map((item, index) => (
                  <ContentCard 
                    key={`popular-${item.id}`} 
                    item={item} 
                    index={index}
                    refCallback={index === currentContent.popular.length - 5 ? lastElementRef : null}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="flex justify-center mt-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )}
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-white">New Arrivals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {currentContent.newArrivals.map((item, index) => (
                  <ContentCard key={`new-${item.id}`} item={item} index={index} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-purple-500 p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-40"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </div>
  );
}

export default MainComponent;
