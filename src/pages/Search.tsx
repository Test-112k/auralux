
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { TMDB_API_KEY, TMDB_API_BASE } from '../lib/constants';
import { ScrollArea } from "@/components/ui/scroll-area";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      setPage(1);
      searchContent(query, 1);
    }
  }, [query]);

  const searchContent = async (searchQuery: string, pageNum: number) => {
    try {
      const isLoadingMore = pageNum > 1;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Search in both movies and TV shows
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=${pageNum}`),
        fetch(`${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=${pageNum}`)
      ]);
      
      if (!moviesResponse.ok || !tvResponse.ok) {
        throw new Error("Search failed");
      }
      
      const moviesData = await moviesResponse.json();
      const tvData = await tvResponse.json();
      
      // Format results
      const formattedMovies = formatContentData(moviesData.results, "movie");
      const formattedTV = formatContentData(tvData.results, "tv");
      
      // Combine results
      const combinedResults = [...formattedMovies, ...formattedTV].sort((a, b) => b.popularity - a.popularity);
      
      if (isLoadingMore) {
        setSearchResults(prev => [...prev, ...combinedResults]);
      } else {
        setSearchResults(combinedResults);
      }
      
      // Calculate total pages (max of both)
      const maxPages = Math.max(moviesData.total_pages, tvData.total_pages);
      setTotalPages(maxPages);
      
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatContentData = (items: any[], mediaType: string) => {
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
      popularity: item.popularity || 0,
      status: item.status || "Unknown",
      media_type: mediaType,
      imdb_id: item.imdb_id || null
    }));
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchContent(query, nextPage);
    }
  };

  const handleContentSelect = (content: any) => {
    localStorage.setItem('selectedContent', JSON.stringify(content));
    navigate('/');
  };

  const handleBack = () => {
    navigate('/');
  };

  // Check for bottom scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="bg-[#161616] p-4 fixed w-full top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Search Results: "{query}"</h1>
        </div>
      </div>

      <div className="container mx-auto pt-24 px-4 pb-12">
        {loading && !loadingMore ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => searchContent(query, 1)}
              className="mt-4 bg-purple-500 px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-8" onScroll={handleScroll}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((item, index) => (
                <div
                  key={`${item.id}-${item.media_type}-${index}`}
                  className="bg-[#161616] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => handleContentSelect(item)}
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
                      {item.title || "Unknown Title"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {item.media_type === "movie" ? "Movie" : "TV"} • {item.year || "N/A"}
                      </span>
                      <span className="text-xs bg-purple-500 px-1.5 py-0.5 rounded">
                        {item.score?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}
            
            {!loadingMore && page < totalPages && (
              <div className="flex justify-center py-6">
                <button
                  onClick={loadMore}
                  className="bg-purple-500 px-6 py-2 rounded hover:bg-purple-600 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
