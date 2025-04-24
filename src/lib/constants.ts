
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
  { code: "IN", name: "India", language: "hi" },
  { code: "JP", name: "Japan", language: "ja" },
  { code: "KR", name: "Korea", language: "ko" },
  { code: "CN", name: "China", language: "zh" },
  { code: "TH", name: "Thailand", language: "th" },
  { code: "FR", name: "France", language: "fr" },
  { code: "ES", name: "Spain", language: "es" },
  { code: "DE", name: "Germany", language: "de" },
  { code: "IT", name: "Italy", language: "it" }
];

// Pagination
export const ITEMS_PER_PAGE = 20;
