
/**
 * Helper function for making authenticated TMDB API requests
 * @param endpoint - API endpoint to call (without base URL)
 * @param params - URL query parameters
 * @returns Promise with response data
 */
import { TMDB_API_BASE, TMDB_API_TOKEN } from './constants';

export async function fetchTMDB(endpoint: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key].toString());
  });
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TMDB_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('TMDB API Error:', errorData);
    throw new Error(`Error ${response.status}: ${errorData.status_message || 'Failed to fetch data'}`);
  }

  return response.json();
}
