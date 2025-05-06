
import React, { useState, useEffect, useRef, useCallback } from "react";
import { TMDB_API_KEY, TMDB_API_BASE } from "../lib/constants";

interface RelatedTitlesProps {
  contentId: number;
  mediaType: string;
  onSelectContent: (content: any) => void;
}

const RelatedTitles = ({ contentId, mediaType, onSelectContent }: RelatedTitlesProps) => {
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!contentId) return;
      
      try {
        setLoading(true);
        // Use 'recommendations' to get the most relevant and latest related content
        // Set sort_by to popularity.desc to get trending content first
        const endpoint = `${TMDB_API_BASE}/${mediaType}/${contentId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1&sort_by=popularity.desc`;
        const response = await fetch(endpoint, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch related content");
        }
        
        const data = await response.json();
        
        // Sort by popularity first, then by most recent
        const sortedResults = data.results.sort((a: any, b: any) => {
          // First sort by popularity (higher vote_count and vote_average is better)
          const popularityA = (a.vote_count || 0) * (a.vote_average || 0);
          const popularityB = (b.vote_count || 0) * (b.vote_average || 0);
          
          if (Math.abs(popularityB - popularityA) > 10) {
            return popularityB - popularityA;
          }
          
          // If popularity is similar, sort by date
          const dateA = mediaType === "movie" ? a.release_date : a.first_air_date;
          const dateB = mediaType === "movie" ? b.release_date : b.first_air_date;
          return new Date(dateB || "2000-01-01").getTime() - new Date(dateA || "2000-01-01").getTime();
        });
        
        const formattedData = sortedResults.map((item: any) => ({
          id: item.id,
          title: mediaType === "movie" ? item.title || "N/A" : item.name || "N/A",
          overview: item.overview,
          poster_path: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null,
          score: item.vote_average,
          year: mediaType === "movie"
            ? (item.release_date?.split("-")[0] || "N/A")
            : (item.first_air_date?.split("-")[0] || "N/A"),
          status: item.status,
          media_type: mediaType
        }));
        
        setRelatedContent(formattedData);
        setHasMore(data.page < data.total_pages);
        setPage(1);
      } catch (error) {
        console.error("Error fetching related content:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedContent();
  }, [contentId, mediaType]);

  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreRelated();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadMoreRelated = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      // Similar to initial fetch, but with the next page and ensuring we get latest content
      const endpoint = `${TMDB_API_BASE}/${mediaType}/${contentId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=${nextPage}&sort_by=popularity.desc`;
      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch more related content");
      }
      
      const data = await response.json();
      
      // Sort by popularity first, then by most recent
      const sortedResults = data.results.sort((a: any, b: any) => {
        // First sort by popularity (higher vote_count and vote_average is better)
        const popularityA = (a.vote_count || 0) * (a.vote_average || 0);
        const popularityB = (b.vote_count || 0) * (b.vote_average || 0);
        
        if (Math.abs(popularityB - popularityA) > 10) {
          return popularityB - popularityA;
        }
        
        // If popularity is similar, sort by date
        const dateA = mediaType === "movie" ? a.release_date : a.first_air_date;
        const dateB = mediaType === "movie" ? b.release_date : b.first_air_date;
        return new Date(dateB || "2000-01-01").getTime() - new Date(dateA || "2000-01-01").getTime();
      });
      
      const formattedData = sortedResults.map((item: any) => ({
        id: item.id,
        title: mediaType === "movie" ? item.title || "N/A" : item.name || "N/A",
        overview: item.overview,
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        score: item.vote_average,
        year: mediaType === "movie"
          ? (item.release_date?.split("-")[0] || "N/A")
          : (item.first_air_date?.split("-")[0] || "N/A"),
        status: item.status,
        media_type: mediaType
      }));
      
      setRelatedContent(prev => [...prev, ...formattedData]);
      setPage(nextPage);
      setHasMore(data.page < data.total_pages && data.results.length > 0);
    } catch (error) {
      console.error("Error loading more related content:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (relatedContent.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        No related content found
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade-in">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        Related Titles
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {relatedContent.map((item, index) => (
          <div
            key={`related-${item.id}-${index}`}
            className="group cursor-pointer transform transition-transform duration-300 hover:scale-105"
            onClick={() => onSelectContent(item)}
            ref={index === relatedContent.length - 1 ? lastElementRef : null}
          >
            <div className="relative overflow-hidden rounded-lg">
              {item.poster_path ? (
                <img
                  src={item.poster_path}
                  alt={item.title}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-[#232323] rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div>
                  <h3 className="text-sm font-medium line-clamp-2">
                    {item.title || "N/A"}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.year || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedTitles;
