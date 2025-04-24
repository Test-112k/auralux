
// API Keys and Base URLs
export const TMDB_API_KEY = "54d82ce065f64ee04381a81d3bcc2455";
export const TMDB_API_BASE = "https://api.themoviedb.org/3";

// Streaming Servers with updated URLs
export const STREAMING_SERVERS = {
  vidsrc: {
    name: "VidSrc",
    movieUrl: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`
  },
  vidapi: {
    name: "VidAPI",
    movieUrl: (id: string) => `https://vidsrc.xyz/embed/movie?imdb=${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidsrc.xyz/embed/tv?imdb=${id}&season=${season}&episode=${episode}`
  },
  streamable: {
    name: "Streamable",
    movieUrl: (id: string) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
  }
};

// Content Types
export const CONTENT_TYPES = {
  ANIME: "anime",
  MOVIE: "movie",
  TV: "tv",
  REGIONAL: "regional"
};

// Available Regions
export const REGIONS = [
  { code: "IN", name: "India", language: "hi", flag: "🇮🇳" },
  { code: "JP", name: "Japan", language: "ja", flag: "🇯🇵" },
  { code: "KR", name: "Korea", language: "ko", flag: "🇰🇷" },
  { code: "CN", name: "China", language: "zh", flag: "🇨🇳" },
  { code: "TH", name: "Thailand", language: "th", flag: "🇹🇭" },
  { code: "FR", name: "France", language: "fr", flag: "🇫🇷" },
  { code: "ES", name: "Spain", language: "es", flag: "🇪🇸" },
  { code: "DE", name: "Germany", language: "de", flag: "🇩🇪" },
  { code: "IT", name: "Italy", language: "it", flag: "🇮🇹" },
  { code: "US", name: "United States", language: "en", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", language: "en", flag: "🇬🇧" },
  { code: "CA", name: "Canada", language: "en", flag: "🇨🇦" },
  { code: "AU", name: "Australia", language: "en", flag: "🇦🇺" },
  { code: "BR", name: "Brazil", language: "pt", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", language: "es", flag: "🇲🇽" }
];

// Pagination
export const ITEMS_PER_PAGE = 20;

// Search API endpoints
export const SEARCH_API = {
  MOVIE: `${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=`,
  TV: `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=`,
  ANIME: `${TMDB_API_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=`
};
