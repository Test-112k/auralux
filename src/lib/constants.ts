
// API Keys and Base URLs
export const TMDB_API_KEY = "54d82ce065f64ee04381a81d3bcc2455";
export const TMDB_API_BASE = "https://api.themoviedb.org/3";

// Streaming Servers
export const STREAMING_SERVERS = {
  vidsrc: {
    name: "VidSrc",
    movieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
  },
  vidapi: {
    name: "VidAPI",
    movieUrl: (id: string) => `https://vidapi.cyou/imdb.php?id=${id}&hl=hi`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidapi.cyou/tv.php?id=${id}&s=${season}&e=${episode}&hl=hi`
  },
  streamable: {
    name: "Streamable",
    movieUrl: (id: string) => `https://embedsito.com/e/?tmdb=${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://embedsito.com/e/?tmdb=${id}&s=${season}&e=${episode}`
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
  { code: "IT", name: "Italy", language: "it", flag: "🇮🇹" }
];

// Pagination
export const ITEMS_PER_PAGE = 20;
