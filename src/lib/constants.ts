
// API Keys
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
    movieUrl: (id: string) => `https://vidapi.xyz/embed/movie/tmdb/${id}`,
    tvUrl: (id: string, season: number, episode: number) => 
      `https://vidapi.xyz/embed/tv/tmdb/${id}/${season}/${episode}`
  }
};

// Content Types
export const CONTENT_TYPES = {
  ANIME: "anime",
  MOVIE: "movie",
  TV: "tv"
};

// Pagination
export const ITEMS_PER_PAGE = 20;
