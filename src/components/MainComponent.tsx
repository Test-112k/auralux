import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

function MainComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [selectedServer, setSelectedServer] = useState("vidsrc");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodeList, setEpisodeList] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingAndPopular();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchAnime();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedAnime?.id) {
      fetchAnimeDetails(selectedAnime.id);
    }
  }, [selectedAnime]);

  const fetchTrendingAndPopular = async () => {
    try {
      const response = await fetch("/api/trending-popular", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trending and popular anime");
      }
      const data = await response.json();
      setTrendingAnime(data.trending || []);
      setPopularAnime(data.popular || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load anime data");
    } finally {
      setLoading(false);
    }
  };

  // Update search function to prioritize English dubs
  const searchAnime = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchQuery,
          preferDub: true // Add parameter to prefer English dubs
        }),
      });
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      
      // Prioritize results with English dub info
      const sortedResults = (data.results || []).sort((a, b) => {
        const hasEnglishDubA = a.hasDub || false;
        const hasEnglishDubB = b.hasDub || false;
        return hasEnglishDubB - hasEnglishDubA;
      });
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimeDetails = async (animeId) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${animeId}?api_key=54d82ce065f64ee04381a81d3bcc2455&language=en-US`
      );
      if (!response.ok) throw new Error("Failed to fetch anime details");
      const data = await response.json();

      const validSeasons = data.seasons.filter(
        (season) => season.season_number > 0 && season.episode_count > 0
      );

      setSeasons(validSeasons);

      if (validSeasons.length > 0) {
        setSelectedSeason(validSeasons[0].season_number);
        await fetchSeasonEpisodes(animeId, validSeasons[0].season_number);
        setSelectedEpisode(1);
      }
    } catch (error) {
      console.error("Error fetching anime details:", error);
      setError("Failed to load anime details");
    }
  };

  const fetchSeasonEpisodes = async (animeId, seasonNumber) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${animeId}/season/${seasonNumber}?api_key=54d82ce065f64ee04381a81d3bcc2455&language=en-US`
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
    if (selectedAnime?.id) {
      await fetchSeasonEpisodes(selectedAnime.id, seasonNumber);
    }
  };

  // Update getStreamingUrl function with new formats
  const getStreamingUrl = (anime) => {
    if (!anime?.id) return "";

    const formatAnimeTitle = (title) => {
      return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const formattedTitle = formatAnimeTitle(anime.title);
    const episodeNumber = selectedEpisode.toString().padStart(2, '0');

    switch (selectedServer) {
      case "vidsrc":
        return `https://vidsrc.to/embed/tv/${anime.id}/${selectedSeason}/${selectedEpisode}`;
      case "vidapi":
        return `https://vidapi.xyz/embed/anime/${formattedTitle}-${episodeNumber}`;
      case "2embed":
        return `https://2anime.xyz/embed/${formattedTitle}-${episodeNumber}`;
      default:
        return "";
    }
  };

  const handleAnimeSelection = async (anime) => {
    setSelectedAnime(anime);
    setSearchQuery("");
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${anime.id}?api_key=54d82ce065f64ee04381a81d3bcc2455&language=en-US`
      );
      if (!response.ok) throw new Error("Failed to fetch anime details");
      const data = await response.json();

      const validSeasons = data.seasons.filter(
        (season) => season.season_number > 0 && season.episode_count > 0
      );

      setSeasons(validSeasons);

      if (validSeasons.length > 0) {
        setSelectedSeason(validSeasons[0].season_number);
        await fetchSeasonEpisodes(anime.id, validSeasons[0].season_number);
        setSelectedEpisode(1);
      }
    } catch (error) {
      console.error("Error fetching anime details:", error);
      setError("Failed to load anime details");
    }
  };

  const handleReturnHome = () => {
    setSelectedAnime(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="bg-[#161616] p-4 fixed w-full top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              onClick={handleReturnHome}
              className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
              ZenithAnime
            </h1>
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Home</a>
              <a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Dubbed</a>
              <a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Trending</a>
              <a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Schedule</a>
            </div>
          </div>
          <div className="relative w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search anime..."
                className="w-full bg-[#232323] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-[#232323] rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 border border-gray-700">
                {searchResults.map((anime) => (
                  <div
                    key={anime.mal_id}
                    className="p-3 hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-3 border-b border-gray-700 last:border-none"
                    onClick={() => handleAnimeSelection(anime)}
                  >
                    {anime.poster_path && (
                      <img
                        src={anime.poster_path}
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium text-sm">{anime.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {anime.type} • {anime.year || "N/A"}
                        {anime.hasDub && (
                          <span className="ml-2 bg-purple-500 px-1.5 py-0.5 rounded text-xs">
                            DUB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto pt-24 px-4">
        {selectedAnime ? (
          <div className="mt-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{selectedAnime.title}</h1>
              {selectedAnime.title_japanese && (
                <h2 className="text-lg text-gray-400">
                  {selectedAnime.title_japanese}
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
                      <option value="2embed">2Embed</option>
                    </select>

                    {selectedAnime.type === "series" && (
                      <>
                        <select
                          className="bg-[#232323] px-4 py-2 rounded text-sm"
                          value={selectedSeason}
                          onChange={(e) =>
                            handleSeasonChange(Number(e.target.value))
                          }
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

                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getStreamingUrl(selectedAnime)}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture"
                      referrerPolicy="origin"
                    ></iframe>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() =>
                      setSelectedEpisode((prev) => Math.max(1, prev - 1))
                    }
                    disabled={selectedEpisode <= 1}
                    className={`px-4 py-2 rounded text-sm ${
                      selectedEpisode <= 1
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-purple-500 hover:bg-purple-600"
                    }`}
                  >
                    Previous Episode
                  </button>
                  <button
                    onClick={() => setSelectedEpisode((prev) => prev + 1)}
