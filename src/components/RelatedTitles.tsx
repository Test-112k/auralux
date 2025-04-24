
import React from "react";
import { TMDB_API_KEY, TMDB_API_BASE } from "../lib/constants";

interface RelatedTitlesProps {
  contentId: number;
  mediaType: string;
  onSelectContent: (content: any) => void;
}

const RelatedTitles = ({ contentId, mediaType, onSelectContent }: RelatedTitlesProps) => {
  const [relatedContent, setRelatedContent] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!contentId) return;
      
      try {
        setLoading(true);
        const endpoint = `${TMDB_API_BASE}/${mediaType}/${contentId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error("Failed to fetch related content");
        }
        
        const data = await response.json();
        
        const formattedData = data.results.map((item: any) => ({
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
          media_type: mediaType
        }));
        
        setRelatedContent(formattedData);
      } catch (error) {
        console.error("Error fetching related content:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedContent();
  }, [contentId, mediaType]);

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
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        Related Titles
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {relatedContent.slice(0, 12).map((item) => (
          <div
            key={`related-${item.id}`}
            className="group cursor-pointer"
            onClick={() => onSelectContent(item)}
          >
            <div className="relative overflow-hidden rounded-lg">
              {item.poster_path ? (
                <img
                  src={item.poster_path}
                  alt={item.title}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
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
                    {item.title}
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
