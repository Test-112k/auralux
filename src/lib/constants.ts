export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const TMDB_API_BASE = "https://api.themoviedb.org/3";

export const VIDSRC_API_BASE = "https://vidsrc.to/ajax";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Streaming Servers
export const STREAMING_SERVERS = {
  vidsrc: {
    name: "VidSrc",
    movieUrl: (tmdbId: string) =>
      `https://vidsrc.to/embed/movie/${tmdbId}`,
    tvUrl: (tmdbId: string, season: number, episode: number) =>
      `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  // Add more servers here as needed
};

// Content Types
export const CONTENT_TYPES = {
  ANIME: "anime",
  MOVIE: "movie",
  TV: "tv",
  REGIONAL: "regional",
};

// Regions
export const REGIONS = [
  { name: "India", code: "IN", language: "hi", flag: "🇮🇳" },
  { name: "Japan", code: "JP", language: "ja", flag: "🇯🇵" },
  { name: "Korea", code: "KR", language: "ko", flag: "🇰🇷" },
  { name: "China", code: "CN", language: "zh", flag: "🇨🇳" },
  { name: "France", code: "FR", language: "fr", flag: "🇫🇷" },
  { name: "Spain", code: "ES", language: "es", flag: "🇪🇸" },
  { name: "Germany", code: "DE", language: "de", flag: "🇩🇪" },
  { name: "Italy", code: "IT", language: "it", flag: "🇮🇹" },
  { name: "Russia", code: "RU", language: "ru", flag: "🇷🇺" },
];

// Items per page
export const ITEMS_PER_PAGE = 20;

// Genre categories
export const ANIME_GENRES = [
  { id: 0, name: "All" },
  { id: 16, name: "Animation" },
  { id: 10759, name: "Action & Adventure" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 10768, name: "War & Politics" },
  { id: 9648, name: "Mystery" },
];

export const MOVIE_GENRES = [
  { id: 0, name: "All" },
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const TV_GENRES = [
  { id: 0, name: "All" },
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

export const REGIONAL_GENRES = [
  { id: 0, name: "All" },
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 10749, name: "Romance" },
  { id: 53, name: "Thriller" },
  { id: 27, name: "Horror" },
  { id: 14, name: "Fantasy" },
];
