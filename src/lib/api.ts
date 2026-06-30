import { supabase } from './supabase';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_NINJAS_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY;
const REST_COUNTRIES_API_KEY = process.env.EXPO_PUBLIC_REST_COUNTRIES_API_KEY;
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  type: 'movie' | 'music' | 'book' | 'sport' | 'food' | 'place' | 'user' | 'vehicle' | 'game';
  source: string;
  media_type?: string;
  profile_path?: string;
  isSquare?: boolean;
  details?: any;
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let queryBuilder = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);

    if (currentUser) {
      // Exclude current user from search
      queryBuilder = queryBuilder.neq('id', currentUser.id);

      // Exclude users who have blocked current user or are blocked by current user
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${currentUser.id},blocked_id.eq.${currentUser.id}`);

      if (blocks && blocks.length > 0) {
        const blockedUserIds = blocks.map(b => 
          b.blocker_id === currentUser.id ? b.blocked_id : b.blocker_id
        );
        queryBuilder = queryBuilder.not('id', 'in', `(${blockedUserIds.join(',')})`);
      }
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.full_name || item.username,
      subtitle: `@${item.username}`,
      image: item.avatar_url || undefined,
      type: 'user' as const,
      source: 'User',
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

const SPORTS_CONFIG: Record<string, { url: string; category: string }> = {
  'Football': { url: 'https://apiv2.allsportsapi.com/football', category: 'football' },
};

const API_SPORTS_KEY = process.env.EXPO_PUBLIC_API_SPORTS_KEY;

export async function searchSports(query: string, filter: string, entityType: string = 'all'): Promise<SearchResult[]> {
  if (!query || !filter || filter !== 'Football') return [];
  
  const config = SPORTS_CONFIG[filter];
  if (!config) return [];

  try {
    const results: SearchResult[] = [];
    const seenIds = new Set<string>();
    
    // Players search using AllSportsAPI
    if (entityType === 'all' || entityType === 'player') {
      const url = `${config.url}/?&met=Players&playerName=${encodeURIComponent(query)}&APIkey=${API_SPORTS_KEY}`;
      console.log(`Searching Football Players: ${url}`);
      const data = await fetchProxied(url);
      if (data && data.success === 1 && data.result) {
        data.result.forEach((item: any) => {
          const id = `player-${item.player_key?.toString() || Math.random().toString()}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            results.push({
              id,
              title: item.player_name || 'Unknown Player',
              subtitle: item.team_name ? `Football - ${item.team_name}` : 'Football',
              image: item.player_image,
              type: 'sport' as const,
              source: 'Football',
              media_type: 'player',
              details: {
                age: item.player_age,
                number: item.player_number,
                position: item.player_type,
                team_name: item.team_name,
                team_key: item.team_key
              }
            });
          }
        });
      }
    }

    // Teams and Leagues search using AllSportsAPI
    if (entityType === 'all' || entityType === 'team') {
      const url = `${config.url}/?&met=Teams&teamName=${encodeURIComponent(query)}&APIkey=${API_SPORTS_KEY}`;
      console.log(`Searching Football Teams: ${url}`);
      const data = await fetchProxied(url);
      if (data && data.success === 1 && data.result) {
        data.result.forEach((item: any) => {
          const id = `team-${item.team_key?.toString() || Math.random().toString()}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            results.push({
              id,
              title: item.team_name || 'Unknown Team',
              subtitle: 'Football Team',
              image: item.team_logo,
              type: 'sport' as const,
              source: 'Football',
              media_type: 'team',
            });
          }
        });
      }
    }

    if (entityType === 'all' || entityType === 'league') {
      const url = `${config.url}/?&met=Leagues&APIkey=${API_SPORTS_KEY}`;
      console.log(`Searching Football Leagues: ${url}`);
      // AllSportsAPI Leagues doesn't seem to have a name filter in the basic URL, 
      // but let's try to filter results manually or check if they support it.
      const data = await fetchProxied(url);
      if (data && data.success === 1 && data.result) {
        data.result
          .filter((item: any) => item.league_name?.toLowerCase().includes(query.toLowerCase()))
          .forEach((item: any) => {
            const id = `league-${item.league_key?.toString() || Math.random().toString()}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              results.push({
                id,
                title: item.league_name || 'Unknown League',
                subtitle: 'Football League',
                image: item.league_logo,
                type: 'sport' as const,
                source: 'Football',
                media_type: 'league',
              });
            }
          });
      }
    }

    return results.slice(0, 30);
  } catch (error) {
    console.error(`Error searching sports (${filter}):`, error);
    return [];
  }
}

/**
 * Helper to fetch via Supabase Edge Function to avoid CORS issues on Web
 */
async function fetchProxied(url: string, headers: Record<string, string> = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('music-search', {
      body: { url, headers }
    });
    
    if (error) {
      console.warn('Proxy fetch error, falling back to direct fetch:', error);
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!text || text.trim() === '') return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse fallback response as JSON:', text);
        return null;
      }
    }
    
    return data;
  } catch (err) {
    console.warn('Proxy fetch exception, falling back to direct fetch:', err);
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!text || text.trim() === '') return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse fallback response as JSON:', text);
        return null;
      }
    } catch (fetchErr) {
      console.error('Direct fetch also failed:', fetchErr);
      return null;
    }
  }
}


export async function searchMovies(query: string, filter?: 'all' | 'movie' | 'tv' | 'person'): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    let endpoint = 'search/multi';
    if (filter === 'movie') endpoint = 'search/movie';
    else if (filter === 'tv') endpoint = 'search/tv';
    else if (filter === 'person') endpoint = 'search/person';

    const response = await fetch(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return (data.results || [])
      .filter((item: any) => {
        if (filter === 'person') {
          return item.known_for_department === 'Acting';
        }
        return true;
      })
      .map((item: any) => {
        const mediaType = filter === 'all' ? item.media_type : (filter === 'person' ? 'person' : (filter === 'tv' ? 'tv' : 'movie'));
        
        const typeMap: Record<string, { type: 'movie'; source: string }> = {
          movie: { type: 'movie', source: 'Movie' },
          tv: { type: 'movie', source: 'TV Show' },
          person: { type: 'movie', source: 'Person' },
        };
        
        const info = typeMap[mediaType] || { type: 'movie', source: 'Other' };
        
        return {
          id: item.id.toString(),
          title: item.title || item.name,
          subtitle: item.release_date || item.first_air_date || item.known_for_department || '',
          image: item.poster_path || item.profile_path ? `https://image.tmdb.org/t/p/w500${item.poster_path || item.profile_path}` : undefined,
          type: info.type,
          source: info.source,
          media_type: mediaType,
          profile_path: item.profile_path,
        };
      });
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

export async function getPersonDetails(id: string): Promise<any> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting person details:', error);
    return null;
  }
}

export async function getMovieDetails(id: string): Promise<any> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting movie details:', error);
    return null;
  }
}

export async function getTVShowDetails(id: string): Promise<any> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting TV show details:', error);
    return null;
  }
}

export async function getArtistDetails(id: string): Promise<any> {
  try {
    return await fetchProxied(`${MUSICBRAINZ_BASE_URL}/artist/${id}?fmt=json&inc=aliases+tags+genres+release-groups`, {
      'User-Agent': 'FavoritesSocial/1.0.0 ( contact@example.com )'
    });
  } catch (error) {
    console.error('Error getting artist details:', error);
    return null;
  }
}

export async function getAlbumDetails(id: string): Promise<any> {
  try {
    return await fetchProxied(`${MUSICBRAINZ_BASE_URL}/release-group/${id}?fmt=json&inc=artists+releases`, {
      'User-Agent': 'FavoritesSocial/1.0.0 ( contact@example.com )'
    });
  } catch (error) {
    console.error('Error getting album details:', error);
    return null;
  }
}

export async function getSongDetails(id: string): Promise<any> {
  try {
    return await fetchProxied(`${MUSICBRAINZ_BASE_URL}/recording/${id}?fmt=json&inc=artists+releases`, {
      'User-Agent': 'FavoritesSocial/1.0.0 ( contact@example.com )'
    });
  } catch (error) {
    console.error('Error getting song details:', error);
    return null;
  }
}

export async function searchMusic(query: string, filter?: 'all' | 'artist' | 'album' | 'song'): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    // MusicBrainz API requires a User-Agent header
    const headers = {
      'User-Agent': 'FavoritesSocial/1.0.0 ( contact@example.com )'
    };

    const searches = [];
    if (!filter || filter === 'all' || filter === 'artist') {
      searches.push(fetchProxied(`${MUSICBRAINZ_BASE_URL}/artist?query=${encodeURIComponent(query)}&fmt=json`, headers));
    } else {
      searches.push(Promise.resolve({ artists: [] }));
    }

    if (!filter || filter === 'all' || filter === 'album') {
      // release-group is better for "Albums" as it groups different versions
      searches.push(fetchProxied(`${MUSICBRAINZ_BASE_URL}/release-group?query=${encodeURIComponent(query)}&fmt=json`, headers));
    } else {
      searches.push(Promise.resolve({ 'release-groups': [] }));
    }

    if (!filter || filter === 'all' || filter === 'song') {
      searches.push(fetchProxied(`${MUSICBRAINZ_BASE_URL}/recording?query=${encodeURIComponent(query)}&fmt=json`, headers));
    } else {
      searches.push(Promise.resolve({ recordings: [] }));
    }

    const [artistsData, albumsData, recordingsData] = await Promise.all(searches);

    const artists = await Promise.all((artistsData.artists || []).slice(0, 10).map(async (item: any) => {
      // For artists, we try to find a representative release to get a cover
      let image = undefined;
      try {
        const releaseData = await fetchProxied(`${MUSICBRAINZ_BASE_URL}/release?query=arid:${item.id}&limit=1&fmt=json`, headers);
        if (releaseData.releases?.[0]) {
          image = `https://coverartarchive.org/release/${releaseData.releases[0].id}/front-250`;
        }
      } catch (e) {
        // Fallback to no image
      }

      return {
        id: item.id,
        title: item.name,
        subtitle: item.type || item.country || '',
        image,
        type: 'music' as const,
        source: 'Artist',
      };
    }));

    const albums = (albumsData['release-groups'] || []).slice(0, 10).map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item['artist-credit']?.[0]?.name || '',
      image: `https://coverartarchive.org/release-group/${item.id}/front-250`,
      type: 'music' as const,
      source: item['primary-type'] || 'Album',
    }));

    const songs = (recordingsData.recordings || []).slice(0, 10).map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item['artist-credit']?.[0]?.name || '',
      image: item.releases?.[0]?.id ? `https://coverartarchive.org/release/${item.releases[0].id}/front-250` : undefined,
      type: 'music' as const,
      source: 'Song',
    }));

    return [...artists, ...albums, ...songs];
  } catch (error) {
    console.error('Error searching music:', error);
    return [];
  }
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const [booksData, authorsData] = await Promise.all([
      fetchProxied(`${OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=15`),
      fetchProxied(`${OPEN_LIBRARY_BASE_URL}/search/authors.json?q=${encodeURIComponent(query)}&limit=10`)
    ]);
    
    const books: SearchResult[] = (booksData.docs || []).map((item: any) => ({
      id: item.key.replace('/works/', ''),
      title: item.title,
      subtitle: item.author_name?.join(', ') || '',
      image: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : undefined,
      type: 'book' as const,
      source: 'Book',
    }));

    const authors: SearchResult[] = (authorsData.docs || []).map((item: any) => ({
      id: item.key,
      title: item.name,
      subtitle: item.birth_date ? `Born: ${item.birth_date}` : (item.top_work || ''),
      image: item.key ? `https://covers.openlibrary.org/a/olid/${item.key}-M.jpg` : undefined,
      type: 'book' as const,
      source: 'Author',
    }));

    return [...authors, ...books];
  } catch (error) {
    console.error('Error searching books and authors:', error);
    return [];
  }
}

export async function getAuthorDetails(id: string): Promise<any> {
  try {
    return await fetchProxied(
      `${OPEN_LIBRARY_BASE_URL}/authors/${id}.json`
    );
  } catch (error) {
    console.error('Error getting author details:', error);
    return null;
  }
}

export async function getBookDetails(id: string): Promise<any> {
  try {
    return await fetchProxied(
      `${OPEN_LIBRARY_BASE_URL}/works/${id}.json`
    );
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
}

export async function searchDishes(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!data) return [];
    return (data.meals || [])
      .filter((item: any) => item.strCategory !== 'Dessert')
      .map((item: any) => ({
      id: item.idMeal,
      title: item.strMeal,
      subtitle: `${item.strCategory} - ${item.strArea}`,
      image: item.strMealThumb,
      type: 'food' as const,
      source: 'Dish',
      media_type: 'dish',
      details: item
    }));
  } catch (error) {
    console.error('Error searching dishes:', error);
    return [];
  }
}

export async function searchDrinks(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!data) return [];
    return (data.drinks || []).map((item: any) => ({
      id: item.idDrink,
      title: item.strDrink,
      subtitle: `${item.strCategory} - ${item.strAlcoholic}`,
      image: item.strDrinkThumb,
      type: 'food' as const,
      source: 'Drink',
      media_type: 'drink',
      details: item
    }));
  } catch (error) {
    console.error('Error searching drinks:', error);
    return [];
  }
}

export async function searchDesserts(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!data) return [];
    return (data.meals || [])
      .filter((item: any) => item.strCategory === 'Dessert')
      .map((item: any) => ({
        id: item.idMeal,
        title: item.strMeal,
        subtitle: `Dessert - ${item.strArea}`,
        image: item.strMealThumb,
        type: 'food' as const,
        source: 'Dessert',
        media_type: 'dessert',
        details: item
      }));
  } catch (error) {
    console.error('Error searching desserts:', error);
    return [];
  }
}

export async function searchCountries(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(query)}`,
      { 
        headers: { 
          'X-Api-Key': API_NINJAS_KEY,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Countries API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const results = data.map((country: any) => {
      const flagImage = country.iso2 ? `https://flagsapi.com/${country.iso2.toUpperCase()}/flat/64.png` : undefined;

      return {
        id: country.iso2 || Math.random().toString(),
        title: country.name || 'Unknown',
        subtitle: country.region || country.continent || '',
        image: flagImage,
        isSquare: !!flagImage,
        type: 'place' as const,
        source: 'Country',
        media_type: 'country',
        details: country
      };
    });

    return results;
  } catch (error) {
    console.error('Error searching countries:', error);
    return [];
  }
}

export async function searchVehicles(query: string, vehicleType?: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    let url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(query)}?format=json`;
    
    // If a specific vehicle type is provided, use the type-specific endpoint
    // The user provided specific examples for Mercedes/Honda/Polaris
    // But we should allow searching any make with that type if possible.
    // However, the NHTSA API GetModelsForMakeYear has a GetModelsForMakeYear/make/mercedes/vehicleType/passenger car format.
    // Let's use GetModelsForMakeIdYear or similar if we want type filtering.
    // Wait, the user provided these URLs:
    // https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/mercedes/vehicleType/passenger%20car?format=json
    
    if (vehicleType) {
      url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(query)}/vehicleType/${encodeURIComponent(vehicleType)}?format=json`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.Results && data.Results.length > 0) {
      // Get unique make names
      const makeNames = Array.from(new Set(data.Results.map((item: any) => item.Make_Name)));
      
      // Fetch logos for each unique make once
      const logos: Record<string, string | undefined> = {};
      await Promise.all(makeNames.map(async (makeName: any) => {
        try {
          const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(makeName + " logo")}&per_page=1`, {
            headers: {
              'Authorization': 'Ee5iL8mmVy12yC0wEsktulXgkgiagzGwohyILB2XeotP6t9bjAJ3TtKD'
            }
          });
          const pexelsData = await pexelsResponse.json();
          if (pexelsData.photos && pexelsData.photos.length > 0) {
            logos[makeName] = pexelsData.photos[0].src.medium;
          }
        } catch (e) {
          console.error(`Error fetching logo for ${makeName}:`, e);
        }
      }));

      return data.Results.map((item: any) => ({
        id: `vehicle-${item.Make_ID}-${item.Model_ID}`,
        title: item.Model_Name,
        subtitle: `${vehicleType ? vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1) : 'Vehicle'} - ${item.Make_Name}`,
        type: 'vehicle' as const,
        source: 'NHTSA',
        image: logos[item.Make_Name],
        details: {
          make_id: item.Make_ID,
          make_name: item.Make_Name,
          model_id: item.Model_ID,
          model_name: item.Model_Name,
          vehicle_type: vehicleType
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching vehicles:', error);
    return [];
  }
}

export async function searchGames(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  try {
    const url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.results) {
      return data.results.map((item: any) => ({
        id: `game-${item.id}`,
        title: item.name,
        subtitle: `Game${item.released ? ` - ${item.released.substring(0, 4)}` : ''}`,
        image: item.background_image,
        type: 'game' as const,
        source: 'RAWG',
        details: item
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}

function processCountryResponse(data: any): SearchResult[] {
  if (!data) return [];
  
  const countries = Array.isArray(data) ? data : (data.data?.objects || data.data || data.objects || []);
  
  if (!Array.isArray(countries)) {
    console.warn('Unexpected response format from countries API:', data);
    // Fallback if data itself is the country object or wrapped
    const potentialCountry = data.data?.objects?.[0] || data.data || data;
    if (potentialCountry && (potentialCountry.names || potentialCountry.name)) {
      return [mapCountry(potentialCountry)];
    }
    return [];
  }

  return countries.map(mapCountry);
}

function mapCountry(item: any): SearchResult {
  // Defensive check for item
  if (!item) {
    return {
      id: Math.random().toString(),
      title: 'Unknown',
      type: 'place' as const,
      source: 'Country'
    };
  }

  // Handle both API Ninjas and REST Countries (for backward compatibility if needed, 
  // though we updated the main search function)
  return {
    id: item.iso2 || item.codes?.alpha_3 || item.cca3 || item.id || item.uuid || Math.random().toString(),
    title: item.name || item.names?.common || item.name?.common || 'Unknown',
    subtitle: item.region || item.continent || '',
    image: item.flag?.url_png || item.flags?.png || item.flag_url,
    type: 'place' as const,
    source: 'Country',
    media_type: 'country',
    details: item
  };
}

export async function findSoulmates(minPercentage: number = 50, categoryTable?: string): Promise<{ user: any; matchPercentage: number }[]> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return [];

    const tables = categoryTable ? [categoryTable] : [
      'movie_favorites',
      'music_favorites',
      'book_favorites',
      'sports_favorites',
      'food_favorites',
      'places_favorites',
      'vehicle_favorites',
      'games_favorites'
    ];

    // Fetch current user's favorites
    const currentUserFavorites: Set<string> = new Set();
    await Promise.all(tables.map(async (table) => {
      const valueColumn = table === 'sports_favorites' ? 'item_id' : 'value';
      const { data } = await supabase.from(table).select(valueColumn).eq('user_id', currentUser.id);
      data?.forEach(item => {
        const val = item[valueColumn];
        if (val) {
          currentUserFavorites.add(`${table}:${val.toString().trim().toLowerCase()}`);
        }
      });
    }));

    if (currentUserFavorites.size === 0) return [];

    // Fetch all other users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .neq('id', currentUser.id);

    if (profileError) throw profileError;

    // Fetch all favorites for all other users in bulk
    const allOtherFavorites: Record<string, Set<string>> = {};
    profiles.forEach(p => allOtherFavorites[p.id] = new Set());

    await Promise.all(tables.map(async (table) => {
      const valueColumn = table === 'sports_favorites' ? 'item_id' : 'value';
      const { data, error } = await supabase
        .from(table)
        .select(`user_id, ${valueColumn}`)
        .in('user_id', profiles.map(p => p.id));
      
      if (!error && data) {
        data.forEach((item: any) => {
          const val = item[valueColumn];
          if (val && allOtherFavorites[item.user_id]) {
            allOtherFavorites[item.user_id].add(`${table}:${val.toString().trim().toLowerCase()}`);
          }
        });
      }
    }));

    const results: { user: any; matchPercentage: number }[] = [];

    // For each user, calculate match
    profiles.forEach(profile => {
      const otherUserFavorites = allOtherFavorites[profile.id];
      if (!otherUserFavorites || otherUserFavorites.size === 0) return;

      // Calculate intersection
      let intersectionCount = 0;
      otherUserFavorites.forEach(item => {
        if (currentUserFavorites.has(item)) {
          intersectionCount++;
        }
      });

      // Calculate match percentage
      // The user wants to find similarity "no matter the amount".
      // We calculate the percentage relative to the smaller collection.
      const smallerCollectionSize = Math.min(currentUserFavorites.size, otherUserFavorites.size);
      if (smallerCollectionSize <= 0) return;

      const matchPercentage = (intersectionCount / smallerCollectionSize) * 100;

      if (!isNaN(matchPercentage) && matchPercentage >= minPercentage) {
        results.push({
          user: profile,
          matchPercentage: Math.round(matchPercentage)
        });
      }
    });

    return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  } catch (error) {
    console.error('Error finding soulmates:', error);
    return [];
  }
}

export async function getUserFavorites(userId: string): Promise<Record<string, { value: string; type?: string; category?: string }[]>> {
  const tables = [
    'movie_favorites',
    'music_favorites',
    'book_favorites',
    'sports_favorites',
    'food_favorites',
    'places_favorites',
    'vehicle_favorites',
    'games_favorites'
  ];

  const favorites: Record<string, { value: string; type?: string; category?: string }[]> = {};

  try {
    for (const table of tables) {
      const valueColumn = table === 'sports_favorites' ? 'item_id' : 'value';
      const selectColumns = [valueColumn];
      
      // Check for type and category columns
      if (table === 'movie_favorites' || table === 'music_favorites') {
        selectColumns.push('type');
        selectColumns.push('category');
      } else if (table === 'book_favorites') {
        selectColumns.push('type');
        selectColumns.push('category');
      } else if (table === 'food_favorites' || table === 'places_favorites' || table === 'sports_favorites' || table === 'vehicle_favorites' || table === 'games_favorites') {
        selectColumns.push('type');
      }

      const { data, error } = await supabase
        .from(table)
        .select(selectColumns.join(', '))
        .eq('user_id', userId);

      if (error) {
        console.error(`Error fetching favorites from ${table}:`, error);
        favorites[table] = [];
      } else {
        favorites[table] = (data || []).map((item: any) => ({
          value: item[valueColumn],
          type: item.type,
          category: item.category
        }));
      }
    }
    return favorites;
  } catch (error) {
    console.error('Error in getUserFavorites:', error);
    return {};
  }
}

