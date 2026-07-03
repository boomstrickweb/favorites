import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, View, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMovies, searchMusic, searchBooks, searchSports, searchDishes, searchDrinks, searchDesserts, searchCountries, SearchResult, getPersonDetails, getMovieDetails, getTVShowDetails, getArtistDetails, getAlbumDetails, getSongDetails, getAuthorDetails, getBookDetails, searchUsers, searchVehicles, searchGames } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';

type Category = 'movies' | 'music' | 'books' | 'sports' | 'food' | 'places' | 'vehicles' | 'games' | 'users';
type VehicleFilter = 'passenger car' | 'bus' | 'mpv' | 'truck' | 'motorcycle' | 'lsv';
type MovieFilter = 'all' | 'movie' | 'tv' | 'person';
type MusicFilter = 'all' | 'artist' | 'album' | 'song';
type SportsFilter = 'Football';
type FoodFilter = 'dishes' | 'drinks' | 'desserts';
type PlacesFilter = 'countries';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('movies');
  const [movieFilter, setMovieFilter] = useState<MovieFilter>('all');
  const [musicFilter, setMusicFilter] = useState<MusicFilter>('all');
  const [sportsFilter, setSportsFilter] = useState<SportsFilter>('Football');
  const [foodFilter, setFoodFilter] = useState<FoodFilter>('dishes');
  const [placesFilter, setPlacesFilter] = useState<PlacesFilter>('countries');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('passenger car');
  const [sportsEntityFilter, setSportsEntityFilter] = useState<'team' | 'player' | 'league'>('team');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [selectedSportItem, setSelectedSportItem] = useState<any>(null);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [movieLoading, setMovieLoading] = useState(false);
  const [artistLoading, setArtistLoading] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [songLoading, setSongLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [foodLoading, setFoodLoading] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingMode, setRatingMode] = useState<'none' | 'general' | 'aspects'>('none');
  const [generalRating, setGeneralRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState({
    story: 0,
    acting: 0,
    cinematography: 0,
    soundtrack: 0,
    atmosphere: 0,
  });
  const [musicAspectRatings, setMusicAspectRatings] = useState({
    vocals: 0,
    melody: 0,
    lyrics: 0,
    production: 0,
    vibe: 0,
  });
  const [placeAspectRatings, setPlaceAspectRatings] = useState({
    gastronomy: 0,
    culture: 0,
    nature: 0,
    vibe: 0,
    affordability: 0,
  });
  const [vehicleAspectRatings, setVehicleAspectRatings] = useState({
    performance: 0,
    design: 0,
    driving: 0,
    usability: 0,
    offroad: 0,
    space: 0,
    safety: 0,
    versatility: 0,
    exclusivity: 0,
    powerWeight: 0,
    customization: 0,
    ridingExperience: 0,
    towing: 0,
    durability: 0,
    utility: 0,
    roadPresence: 0,
    history: 0,
    luxury: 0,
    capacity: 0,
    fun: 0,
    eco: 0,
    maneuverability: 0,
  });
  const [gameAspectRatings, setGameAspectRatings] = useState({
    gameplay: 0,
    graphics: 0,
    story: 0,
    audio: 0,
    performance: 0,
  });
  const [traveled, setTraveled] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const theme = useTheme();
  const router = useRouter();
  const textColor = theme.text;
  const inputBackground = theme.backgroundElement;
  const tintColor = theme.brand;

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      let data: SearchResult[] = [];
      
      switch (category) {
        case 'movies':
          data = await searchMovies(debouncedQuery, movieFilter);
          break;
        case 'music':
          data = await searchMusic(debouncedQuery, musicFilter);
          break;
        case 'books':
          data = await searchBooks(debouncedQuery);
          break;
        case 'sports':
          data = await searchSports(debouncedQuery, sportsFilter, sportsEntityFilter);
          break;
        case 'food':
          if (foodFilter === 'dishes') {
            data = await searchDishes(debouncedQuery);
          } else if (foodFilter === 'drinks') {
            data = await searchDrinks(debouncedQuery);
          } else {
            data = await searchDesserts(debouncedQuery);
          }
          break;
        case 'places':
          if (placesFilter === 'countries') {
            data = await searchCountries(debouncedQuery);
          }
          break;
        case 'vehicles':
          if (vehicleFilter === 'mpv') {
            data = await searchVehicles(debouncedQuery, 'multipurpose passenger vehicle (mpv)');
          } else if (vehicleFilter === 'lsv') {
            data = await searchVehicles(debouncedQuery, 'low speed vehicle (lsv)');
          } else {
            data = await searchVehicles(debouncedQuery, vehicleFilter);
          }
          break;
        case 'games':
          data = await searchGames(debouncedQuery);
          break;
        case 'users':
          data = await searchUsers(debouncedQuery);
          break;
      }

      setResults(data);
      setLoading(false);
    };

    performSearch();
  }, [debouncedQuery, category, movieFilter, musicFilter, sportsFilter, sportsEntityFilter, foodFilter, vehicleFilter]);

  const handleItemPress = async (item: SearchResult) => {
    if (item.type === 'movie') {
      if (item.media_type === 'person') {
        setPersonLoading(true);
        const details = await getPersonDetails(item.id);
        setSelectedPerson(details);
        
        // Check if already in favorites
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('movie_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'actor')
              .eq('metadata->>tmdb_id', item.id.toString())
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setPersonLoading(false);
      } else if (item.media_type === 'movie' || item.media_type === 'tv') {
        setMovieLoading(true);
        const details = item.media_type === 'movie' 
          ? await getMovieDetails(item.id) 
          : await getTVShowDetails(item.id);
        
        setSelectedMovie({ ...details, media_type: item.media_type });
        setRatingMode('none');
        setGeneralRating(0);
        setAspectRatings({ story: 0, acting: 0, cinematography: 0, soundtrack: 0, atmosphere: 0 });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('movie_favorites')
              .select('*')
              .eq('user_id', user.id)
              .or(`type.eq.${item.media_type},type.eq.movie,type.eq.tv`)
              .eq('metadata->>tmdb_id', item.id.toString())
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setMovieLoading(false);
      }
    } else if (item.type === 'music') {
      if (item.source === 'Artist') {
        setArtistLoading(true);
        const details = await getArtistDetails(item.id);
        setSelectedArtist({ ...details, image: item.image });
        
        // Check if already in favorites
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('music_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'artist')
              .eq('value', details.name)
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setArtistLoading(false);
      } else if (item.source === 'Song') {
        setSongLoading(true);
        const details = await getSongDetails(item.id);
        setSelectedSong({ ...details, image: item.image, title: item.title, artist: item.subtitle });
        setRatingMode('none');
        setGeneralRating(0);
        setMusicAspectRatings({ vocals: 0, melody: 0, lyrics: 0, production: 0, vibe: 0 });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('music_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'song')
              .eq('value', item.title)
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setSongLoading(false);
      } else {
        // Handle Albums, Singles, EPs
        setAlbumLoading(true);
        const details = await getAlbumDetails(item.id);
        setSelectedAlbum({ ...details, image: item.image, title: item.title, artist: item.subtitle, source: item.source });
        setRatingMode('none');
        setGeneralRating(0);
        setMusicAspectRatings({ vocals: 0, melody: 0, lyrics: 0, production: 0, vibe: 0 });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('music_favorites')
              .select('id')
              .eq('user_id', user.id)
              .or(`type.eq.album,type.eq.Single,type.eq.EP`)
              .eq('value', item.title)
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setAlbumLoading(false);
      }
    } else if (item.type === 'book') {
      if (item.source === 'Author') {
        setAuthorLoading(true);
        setSelectedAuthor({ ...item });
        try {
          const details = await getAuthorDetails(item.id);
          setSelectedAuthor((prev: any) => ({ ...prev, ...details }));
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('book_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'author')
              .eq('value', item.title)
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error getting author details:', error);
        }
        setAuthorLoading(false);
      } else {
        setBookLoading(true);
        setSelectedBook({ ...item });
        
        try {
          const details = await getBookDetails(item.id);
          setSelectedBook((prev: any) => ({ ...prev, ...details }));

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('book_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'book')
              .eq('value', item.title)
              .maybeSingle();
            
            setIsFavorite(!!data && !error);
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
        setBookLoading(false);
      }
    } else if (item.type === 'sport') {
      setSelectedSportItem(item);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('sports_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', item.media_type || 'team')
            .eq('item_id', item.title)
            .maybeSingle();
          
          setIsFavorite(!!data && !error);
        }
      } catch (error) {
        console.error('Error checking sports favorite status:', error);
      }
    } else if (item.type === 'food') {
      setFoodLoading(true);
      setSelectedFood(item);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('food_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', item.media_type)
            .eq('value', item.title)
            .maybeSingle();
          
          setIsFavorite(!!data && !error);
        }
      } catch (error) {
        console.error('Error checking food favorite status:', error);
      }
      setFoodLoading(false);
    } else if (item.type === 'place') {
      setPlaceLoading(true);
      setSelectedPlace(item);
      setRatingMode('none');
      setGeneralRating(0);
      setPlaceAspectRatings({ gastronomy: 0, culture: 0, nature: 0, vibe: 0, affordability: 0 });
      setTraveled(false);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('places_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'country')
            .eq('value', item.title)
            .maybeSingle();
          
          setIsFavorite(!!data && !error);
          if (data && !error) {
            setRatingMode(data.rating_mode || 'general');
            setGeneralRating(data.rating_general || 0);
            setPlaceAspectRatings({
              gastronomy: data.rating_gastronomy || 0,
              culture: data.rating_culture || 0,
              nature: data.rating_nature || 0,
              vibe: data.rating_vibe || 0,
              affordability: data.rating_affordability || 0,
            });
            setTraveled(data.traveled || false);
          }
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
      setPlaceLoading(false);
    } else if (item.type === 'user') {
      router.push(`/user/${item.id}`);
    } else if (item.type === 'vehicle') {
      setVehicleLoading(true);
      setSelectedVehicle(item);
      setRatingMode('none');
      setGeneralRating(0);
      setVehicleAspectRatings({
        performance: 0, design: 0, driving: 0, usability: 0,
        offroad: 0, space: 0, safety: 0, versatility: 0,
        exclusivity: 0, powerWeight: 0, customization: 0, ridingExperience: 0,
        towing: 0, durability: 0, utility: 0, roadPresence: 0,
        history: 0, luxury: 0, capacity: 0,
        fun: 0, eco: 0, maneuverability: 0
      });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('vehicle_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('value', item.title)
            .maybeSingle();
          
          if (!error && data) {
            setIsFavorite(true);
            setRatingMode(data.rating_mode || 'none');
            setGeneralRating(data.rating_general || 0);
            if (data.rating_mode === 'aspects' && data.metadata?.aspect_ratings) {
              setVehicleAspectRatings({
                ...vehicleAspectRatings,
                ...data.metadata.aspect_ratings
              });
            }
          } else {
            setIsFavorite(false);
          }
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
      setVehicleLoading(false);
    } else if (item.type === 'game') {
      setGameLoading(true);
      setSelectedGame(item);
      setRatingMode('none');
      setGeneralRating(0);
      setGameAspectRatings({
        gameplay: 0,
        graphics: 0,
        story: 0,
        audio: 0,
        performance: 0,
      });
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('games_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('value', item.title)
            .maybeSingle();
          
          if (!error && data) {
            setIsFavorite(true);
            setRatingMode(data.rating_mode || 'none');
            setGeneralRating(data.rating_general || 0);
            if (data.rating_mode === 'aspects' && data.metadata?.aspect_ratings) {
              setGameAspectRatings({
                ...gameAspectRatings,
                ...data.metadata.aspect_ratings
              });
            }
          } else {
            setIsFavorite(false);
          }
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
      setGameLoading(false);
    }
  };

  const toggleFavoriteGame = async (game: SearchResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('games_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('value', game.title);
        
        if (error) throw error;
        setIsFavorite(false);
        setSelectedGame(null);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating mode and provide a rating before adding to favorites.');
          return;
        }

        const ratingData = ratingMode === 'general' 
          ? { mode: 'general', value: generalRating }
          : { mode: 'aspects', ...gameAspectRatings };

        const { error } = await supabase
          .from('games_favorites')
          .insert({
            user_id: user.id,
            type: 'game',
            value: game.title,
            rating_mode: ratingMode,
            rating_general: ratingMode === 'general' ? generalRating : 0,
            metadata: {
              rawg_id: game.details?.id,
              released: game.details?.released,
              image: game.image,
              rating: game.details?.rating,
              metacritic: game.details?.metacritic,
              platforms: game.details?.platforms?.map((p: any) => p.platform.name),
              aspect_ratings: ratingMode === 'aspects' ? gameAspectRatings : undefined,
              rating: ratingData
            }
          });
        
        if (error) throw error;
        setIsFavorite(true);
        setSelectedGame(null);
        Alert.alert('Success', 'Added to favorites!');
      }
    } catch (error: any) {
      console.error('Error toggling favorite game:', error);
      Alert.alert('Error', error.message || 'Could not update favorites');
    }
  };

  const toggleFavoriteVehicle = async (vehicle: SearchResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('vehicle_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('value', vehicle.title);
        
        if (error) throw error;
        setIsFavorite(false);
        setSelectedVehicle(null);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating mode and provide a rating before adding to favorites.');
          return;
        }

        const vehicleType = vehicle.details?.vehicle_type || 'vehicle';
        const ratingData = ratingMode === 'general' 
          ? { mode: 'general', value: generalRating }
          : { mode: 'aspects', ...vehicleAspectRatings };
        
        const { error } = await supabase
          .from('vehicle_favorites')
          .insert({
            user_id: user.id,
            type: vehicleType,
            value: vehicle.title,
            rating_mode: ratingMode,
            rating_general: ratingMode === 'general' ? generalRating : 0,
            metadata: {
              make_id: vehicle.details?.make_id,
              make_name: vehicle.details?.make_name,
              model_id: vehicle.details?.model_id,
              image: vehicle.image,
              vehicle_type: vehicleType,
              aspect_ratings: ratingMode === 'aspects' ? vehicleAspectRatings : undefined,
              rating: ratingData
            }
          });
        
        if (error) throw error;
        setIsFavorite(true);
        setSelectedVehicle(null);
        Alert.alert('Success', 'Added to favorites!');
      }
    } catch (error: any) {
      console.error('Error toggling favorite vehicle:', error);
      Alert.alert('Error', error.message || 'Could not update favorites');
    }
  };

  const toggleFavoritePlace = async (place: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('places_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'country')
          .eq('value', place.title);
        
        if (error) throw error;
        setIsFavorite(false);
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating mode and provide a rating before adding to favorites.');
          return;
        }

        const { error } = await supabase
          .from('places_favorites')
          .insert({
            user_id: user.id,
            type: 'country',
            value: place.title,
            rating_mode: ratingMode,
            rating_general: ratingMode === 'general' ? generalRating : 0,
            rating_gastronomy: ratingMode === 'aspects' ? placeAspectRatings.gastronomy : 0,
            rating_culture: ratingMode === 'aspects' ? placeAspectRatings.culture : 0,
            rating_nature: ratingMode === 'aspects' ? placeAspectRatings.nature : 0,
            rating_vibe: ratingMode === 'aspects' ? placeAspectRatings.vibe : 0,
            rating_affordability: ratingMode === 'aspects' ? placeAspectRatings.affordability : 0,
            traveled: traveled,
            metadata: {
              image: place.image,
              region: place.subtitle,
              iso2: place.id,
              details: place.details
            }
          });
        
        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorite countries!');
      }
    } catch (error: any) {
      console.error('Error toggling favorite place:', error);
      Alert.alert('Error', error.message || 'Could not update favorites');
    }
  };

  const toggleFavoriteAlbum = async (album: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      const type = (album.source || 'album').toLowerCase();

      if (isFavorite) {
        const { error } = await supabase
          .from('music_favorites')
          .delete()
          .eq('user_id', user.id)
          .or(`type.eq.album,type.eq.single,type.eq.ep`)
          .eq('value', album.title);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${album.title} removed from favorites`);
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating method first.');
          return;
        }

        const ratingData = ratingMode === 'general' 
          ? { mode: 'general', value: generalRating }
          : { mode: 'aspects', ...musicAspectRatings };

        const { error } = await supabase
          .from('music_favorites')
          .insert({
            user_id: user.id,
            type: type,
            value: album.title,
            metadata: {
              mb_id: album.id,
              image: album.image,
              artist: album.artist || album.subtitle,
              rating: ratingData
            }
          });

        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', `${album.title} added to favorites!`, [
          {
            text: 'Added to Favorites',
            onPress: () => {
              setSelectedAlbum(null);
              router.push('/musiccollections');
            }
          },
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error toggling favorite album:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteSong = async (song: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('music_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'song')
          .eq('value', song.title);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${song.title} removed from favorites`);
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating method first.');
          return;
        }

        const ratingData = ratingMode === 'general' 
          ? { mode: 'general', value: generalRating }
          : { mode: 'aspects', ...musicAspectRatings };

        const { error } = await supabase
          .from('music_favorites')
          .insert({
            user_id: user.id,
            type: 'song',
            value: song.title,
            metadata: {
              mb_id: song.id,
              image: song.image,
              artist: song.artist || song.subtitle,
              rating: ratingData
            }
          });

        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', `${song.title} added to favorites!`, [
          {
            text: 'Added to Favorites',
            onPress: () => {
              setSelectedSong(null);
              router.push('/musiccollections');
            }
          },
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error toggling favorite song:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteArtist = async (artist: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('music_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'artist')
          .eq('value', artist.name);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${artist.name} removed from favorites`);
      } else {
        const { error } = await supabase
          .from('music_favorites')
          .insert({
            user_id: user.id,
            type: 'artist',
            value: artist.name,
            metadata: {
              mbid: artist.id,
              image: artist.image,
              country: artist.country,
              artist_type: artist.type
            }
          });

        if (error) throw error;
        setIsFavorite(true);
        
        // Determine the type for the alert message
        const artistType = artist.type?.toLowerCase() === 'person' ? 'artist' : 'band/duo';
        
        Alert.alert('Success', `${artist.name} added to favorites!`, [
          {
            text: 'Added to Favorites',
            onPress: () => {
              setSelectedArtist(null);
              router.push('/musiccollections');
            }
          },
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error toggling favorite artist:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteMovie = async (movie: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('movie_favorites')
          .delete()
          .eq('user_id', user.id)
          .or('type.eq.movie,type.eq.tv')
          .eq('metadata->>tmdb_id', movie.id.toString());

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${movie.title || movie.name} removed from favorites`);
      } else {
        if (ratingMode === 'none') {
          Alert.alert('Selection Required', 'Please choose a rating method first.');
          return;
        }

        const ratingData = ratingMode === 'general' 
          ? { mode: 'general', value: generalRating }
          : { mode: 'aspects', ...aspectRatings };

        const { error } = await supabase
          .from('movie_favorites')
          .insert({
            user_id: user.id,
            type: movie.media_type,
            value: movie.title || movie.name,
            metadata: {
              tmdb_id: movie.id,
              poster_path: movie.poster_path,
              release_date: movie.release_date || movie.first_air_date,
              rating: ratingData
            }
          });

        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', `${movie.title || movie.name} added to favorites!`);
      }
    } catch (error) {
      console.error('Error toggling favorite movie:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavorite = async (person: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      // Only allow adding to favorites if the person is in the Acting department
      if (!isFavorite && person.known_for_department !== 'Acting') {
        Alert.alert('Not Available', 'Only actors can be added to favorites in the Movies & TV category.');
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('movie_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'actor')
          .eq('metadata->>tmdb_id', person.id.toString());

        if (error) throw error;
        
        setIsFavorite(false);
        Alert.alert('Success', `${person.name} removed from favorites`);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('movie_favorites')
          .insert({
            user_id: user.id,
            type: 'actor',
            value: person.name,
            metadata: {
              tmdb_id: person.id,
              profile_path: person.profile_path,
              known_for_department: person.known_for_department
            }
          });

        if (error) {
          if (error.code === '23505') {
            setIsFavorite(true);
            Alert.alert('Info', 'This person is already in your favorites');
          } else {
            throw error;
          }
        } else {
          setIsFavorite(true);
          Alert.alert('Success', `${person.name} added to favorites!`, [
            {
              text: 'Added to Favorites',
              onPress: () => {
                setSelectedPerson(null);
                router.push({
                  pathname: '/moviecollections',
                  params: { view: 'actors' }
                });
              }
            },
            { text: 'OK' }
          ]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteBook = async (book: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      const type = book.source === 'Author' ? 'author' : 'book';
      const value = book.title || book.name;

      if (isFavorite) {
        const { error } = await supabase
          .from('book_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('type', type)
          .eq('value', value);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${value} removed from favorites`);
      } else {
        if (isFavorite) {
          const { error } = await supabase
            .from('book_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('type', type)
            .eq('value', value);

          if (error) throw error;
          setIsFavorite(false);
          Alert.alert('Success', `${value} removed from favorites`);
        } else {
          const { error } = await supabase
            .from('book_favorites')
            .insert({
              user_id: user.id,
              type: type,
              value: value,
              metadata: {
                ol_id: book.id,
                image: book.image,
                author: book.subtitle,
                bio: book.bio,
                birth_date: book.birth_date
              }
            });

          if (error) throw error;
          setIsFavorite(true);
          Alert.alert('Success', `${value} added to favorites!`, [
            {
              text: 'Added to Favorites',
              onPress: () => {
                setSelectedBook(null);
                setSelectedAuthor(null);
                router.push('/bookcollections');
              }
            },
            { text: 'OK' }
          ]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite book/author:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteSport = async (item: SearchResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      const mediaType = item.media_type || 'team';

      // Check if already favorite
      const { data: existing } = await supabase
        .from('sports_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', mediaType)
        .eq('item_id', item.title)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('sports_favorites')
          .delete()
          .eq('id', existing.id);
        
        if (error) {
          console.error('Supabase error deleting sport favorite:', error);
          Alert.alert('Error', 'Failed to remove from favorites: ' + error.message);
          return;
        }
        setIsFavorite(false);
        Alert.alert('Success', `${item.title} removed from favorites`);
      } else {
        const { error } = await supabase
          .from('sports_favorites')
          .insert({
            user_id: user.id,
            type: mediaType,
            item_id: item.title,
            metadata: {
              image: item.image,
              sport: item.source,
              api_sports_id: item.id,
              subtitle: item.subtitle
            }
          });
        
        if (error) {
          console.error('Supabase error inserting sport favorite:', error);
          Alert.alert('Error', 'Failed to add to favorites: ' + error.message);
          return;
        }
        setIsFavorite(true);
        Alert.alert('Success', `${item.title} added to favorites!`, [
          {
            text: 'View Collection',
            onPress: () => {
              setSelectedSportItem(null);
              router.push('/sportscollections');
            }
          },
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error toggling sport favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteAuthor = async (authorName: string, image?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      const { data: existing } = await supabase
        .from('book_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'author')
        .eq('value', authorName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('book_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        Alert.alert('Success', `${authorName} removed from favorite authors`);
      } else {
        const { error } = await supabase
          .from('book_favorites')
          .insert({
            user_id: user.id,
            type: 'author',
            value: authorName,
            metadata: { image }
          });

        if (error) throw error;
        Alert.alert('Success', `${authorName} added to favorite authors!`);
      }
    } catch (error) {
      console.error('Error toggling favorite author:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleFavoriteFood = async (item: SearchResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to manage favorites');
        return;
      }

      const type = item.media_type; // 'dish' or 'drink'
      
      const { data: existing } = await supabase
        .from('food_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('value', item.title)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('food_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        setIsFavorite(false);
        Alert.alert('Success', `${item.title} removed from favorites`);
      } else {
        const { error } = await supabase
          .from('food_favorites')
          .insert({
            user_id: user.id,
            type: type,
            value: item.title,
            metadata: { 
              image: item.image,
              api_id: item.id,
              category: item.details?.strCategory,
              area: item.details?.strArea || item.details?.strAlcoholic
            }
          });

        if (error) throw error;
        setIsFavorite(true);
        Alert.alert('Success', `${item.title} added to favorites!`, [
          {
            text: 'View Collection',
            onPress: () => {
              setSelectedFood(null);
              router.push('/foodcollections');
            }
          },
          { text: 'OK' }
          ]);
        }
    } catch (error) {
      console.error('Error toggling food favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };



  const renderItem = ({ item }: { item: SearchResult }) => {
    const isSquare = item.isSquare || item.type === 'place' || item.type === 'sport' || item.type === 'food' || item.type === 'game';
    const thumbnailStyle = item.type === 'user' ? styles.userThumbnail : (isSquare ? styles.squareThumbnail : styles.thumbnail);

    // Some images (like flags from country search) might not have a scheme on some platforms
    const imageUri = item.image;

    return (
      <View style={styles.resultItemContainer}>
        <TouchableOpacity style={styles.resultItem} onPress={() => handleItemPress(item)}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={thumbnailStyle} 
              resizeMode={item.type === 'place' ? "contain" : (isSquare ? "cover" : "contain")}
            />
          ) : (
            <View style={[thumbnailStyle, styles.placeholderThumbnail]}>
              <ThemedText style={styles.placeholderText}>
                {category === 'movies' ? '🎬' : category === 'music' ? '🎵' : category === 'food' ? '🍲' : category === 'users' ? '👤' : category === 'vehicles' ? '🚗' : category === 'places' ? '🚩' : '📚'}
              </ThemedText>
            </View>
          )}
          <View style={styles.itemInfo}>
            <View style={styles.titleRow}>
              <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.titleText}>{item.title}</ThemedText>
              <View style={styles.sourceBadge}>
                <ThemedText style={styles.sourceText}>{item.source}</ThemedText>
              </View>
            </View>
            {item.subtitle ? (
              <ThemedText type="default" style={styles.subtitle} numberOfLines={1}>{item.subtitle}</ThemedText>
            ) : null}
          </View>
        </TouchableOpacity>
        
        {item.type === 'movie' && item.media_type === 'person' && item.subtitle === 'Acting' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => toggleFavorite({
              id: item.id,
              name: item.title,
              profile_path: item.profile_path,
              known_for_department: item.subtitle
            })}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'music' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => {
              if (item.source === 'Song') {
                toggleFavoriteSong({
                  id: item.id,
                  title: item.title,
                  image: item.image,
                  subtitle: item.subtitle
                });
              } else if (item.source === 'Artist') {
                toggleFavoriteArtist({
                  id: item.id,
                  name: item.title,
                  image: item.image
                });
              } else {
                toggleFavoriteAlbum({
                  id: item.id,
                  title: item.title,
                  image: item.image,
                  subtitle: item.subtitle,
                  source: item.source
                });
              }
            }}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'book' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => toggleFavoriteBook(item)}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'sport' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => toggleFavoriteSport(item)}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'food' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => toggleFavoriteFood(item)}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'place' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => toggleFavoritePlace(item)}
          >
            <Ionicons name="heart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.type === 'user' && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { backgroundColor: tintColor }]} 
            onPress={() => router.push(`/user/${item.id}`)}
          >
            <Ionicons name="person" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Search</ThemedText>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryContainer}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          {(['movies', 'music', 'books', 'sports', 'food', 'places', 'vehicles', 'games', 'users'] as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryButton,
                category === cat ? { backgroundColor: tintColor } : undefined
              ].filter(Boolean) as any}
            >
              <ThemedText style={[
                styles.categoryText,
                (category === cat ? styles.activeCategoryText : undefined)
              ].filter(Boolean) as any}>
                {cat === 'movies' ? 'Movies & TV' : 
                 cat.charAt(0).toUpperCase() + cat.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {category === 'movies' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'all', label: 'All' },
              { id: 'person', label: 'Acting' },
              { id: 'movie', label: 'Movie' },
              { id: 'tv', label: 'TV Show' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setMovieFilter(f.id as MovieFilter)}
                style={[
                  styles.filterButton,
                  movieFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  movieFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {category === 'music' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'all', label: 'All' },
              { id: 'artist', label: 'Artist' },
              { id: 'album', label: 'Album' },
              { id: 'song', label: 'Song' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setMusicFilter(f.id as MusicFilter)}
                style={[
                  styles.filterButton,
                  musicFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  musicFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {category === 'sports' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'team', label: 'Football Teams' },
              { id: 'player', label: 'Football Players' },
              { id: 'league', label: 'Football Leagues' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setSportsEntityFilter(f.id as any)}
                style={[
                  styles.filterButton,
                  sportsEntityFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  sportsEntityFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {category === 'food' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'dishes', label: 'Dishes' },
              { id: 'drinks', label: 'Drinks' },
              { id: 'desserts', label: 'Desserts' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFoodFilter(f.id as FoodFilter)}
                style={[
                  styles.filterButton,
                  foodFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  foodFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {category === 'places' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'countries', label: 'Countries' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setPlacesFilter(f.id as PlacesFilter)}
                style={[
                  styles.filterButton,
                  placesFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  placesFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {category === 'vehicles' && (
          <View style={[styles.categoryContainer, { marginTop: 0, marginBottom: 15 }]}>
            {[
              { id: 'passenger car', label: 'Car' },
              { id: 'bus', label: 'Bus' },
              { id: 'mpv', label: 'MPV' },
              { id: 'truck', label: 'Truck' },
              { id: 'motorcycle', label: 'Moto' },
              { id: 'lsv', label: 'LSV' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setVehicleFilter(f.id as VehicleFilter)}
                style={[
                  styles.filterButton,
                  vehicleFilter === f.id ? { backgroundColor: tintColor } : undefined
                ].filter(Boolean) as any}
              >
                <ThemedText style={[
                  styles.filterText,
                  vehicleFilter === f.id && styles.activeCategoryText
                ]}>
                  {f.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput
          style={[styles.searchInput, { backgroundColor: inputBackground, color: textColor }]}
          placeholder={category === 'sports' ? 'Search Football...' : `Search ${category}...`}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            query.trim() ? (
              <ThemedText style={styles.emptyText}>No results found for "{query}"</ThemedText>
            ) : (
              <ThemedText style={styles.emptyText}>Start typing to search for {category === 'sports' ? 'Football' : category}</ThemedText>
            )
          }
        />
      )}


      <Modal
        visible={!!selectedPerson || personLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPerson(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {personLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedPerson ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedPerson.name}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedPerson(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedPerson.profile_path ? (
                      <Image 
                        source={{ uri: `https://image.tmdb.org/t/p/w500${selectedPerson.profile_path}` }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>👤</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Department</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedPerson.known_for_department}</ThemedText>
                      
                      {selectedPerson.birthday && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Born</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedPerson.birthday}</ThemedText>
                        </>
                      )}
                      
                      {selectedPerson.place_of_birth && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Place of Birth</ThemedText>
                          <ThemedText style={styles.metaText} numberOfLines={2}>{selectedPerson.place_of_birth}</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {selectedPerson.biography ? (
                    <View style={styles.bioContainer}>
                      <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Biography</ThemedText>
                      <ThemedText style={styles.bioText}>
                        {selectedPerson.biography}
                      </ThemedText>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  {selectedPerson.known_for_department === 'Acting' || isFavorite ? (
                    <TouchableOpacity 
                      style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                      onPress={() => toggleFavorite(selectedPerson)}
                    >
                      <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                      <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                        {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.favoriteButton, { backgroundColor: '#8E8E93', height: 56, opacity: 0.7 }]}>
                      <ThemedText style={[styles.favoriteButtonText, { fontSize: 16, color: '#fff' }]}>
                        Only actors can be added
                      </ThemedText>
                    </View>
                  )}
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedArtist || artistLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedArtist(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {artistLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedArtist ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedArtist.name}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedArtist(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedArtist.image ? (
                      <Image 
                        source={{ uri: selectedArtist.image }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🎵</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Type</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedArtist.type || 'Artist'}</ThemedText>
                      
                      {selectedArtist.country && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Country</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedArtist.country}</ThemedText>
                        </>
                      )}

                      {selectedArtist.life_span && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Active</ThemedText>
                          <ThemedText style={styles.metaText}>
                            {selectedArtist.life_span.begin} {selectedArtist.life_span.end ? ` - ${selectedArtist.life_span.end}` : ''}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {selectedArtist.genres && selectedArtist.genres.length > 0 && (
                    <View style={styles.bioContainer}>
                      <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Genres</ThemedText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {selectedArtist.genres.map((g: any) => (
                          <View key={g.name} style={{ backgroundColor: 'rgba(128,128,128,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                            <ThemedText style={{ fontSize: 12 }}>{g.name}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedArtist.tags && selectedArtist.tags.length > 0 && (
                    <View style={styles.bioContainer}>
                      <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Tags</ThemedText>
                      <ThemedText style={styles.bioText}>
                        {selectedArtist.tags.slice(0, 10).map((t: any) => t.name).join(', ')}
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteArtist(selectedArtist)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedAlbum || albumLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAlbum(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {albumLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedAlbum ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="subtitle">{selectedAlbum.title}</ThemedText>
                      <ThemedText style={{ color: tintColor }}>{selectedAlbum.source || 'Album'}</ThemedText>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedAlbum(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedAlbum.image ? (
                      <Image 
                        source={{ uri: selectedAlbum.image }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>💿</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Artist</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedAlbum.artist || (selectedAlbum['artist-credit']?.[0]?.name) || selectedAlbum.subtitle || 'Unknown'}</ThemedText>
                      
                      {selectedAlbum['first-release-date'] && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Released</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedAlbum['first-release-date']}</ThemedText>
                        </>
                      )}

                      {selectedAlbum.releases && selectedAlbum.releases.length > 0 && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Releases</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedAlbum.releases.length} versions</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {!isFavorite && (
                    <View style={styles.ratingSection}>
                      <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: tintColor }]}>Add to Favorites</ThemedText>
                      <ThemedText style={{ fontSize: 13, opacity: 0.6, marginBottom: Spacing.two }}>How would you like to rate this?</ThemedText>
                      <View style={styles.ratingModeButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'general' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('general')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'general' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>General</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'aspects' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('aspects')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'aspects' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>By Aspects</ThemedText>
                    </TouchableOpacity>
                      </View>

                      {ratingMode === 'general' && (
                        <View style={styles.starsContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setGeneralRating(star)}>
                              <Ionicons 
                                name={star <= generalRating ? "star" : "star-outline"} 
                                size={32} 
                                color={star <= generalRating ? "#FFD700" : textColor} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {ratingMode === 'aspects' && (
                        <View style={styles.aspectsContainer}>
                          {[
                            { key: 'vocals', label: 'Vocals' },
                            { key: 'melody', label: 'Melody' },
                            { key: 'lyrics', label: 'Lyrics' },
                            { key: 'production', label: 'Production & Mix' },
                            { key: 'vibe', label: 'Vibe' }
                          ].map((aspect) => (
                            <View key={aspect.key} style={styles.aspectItem}>
                              <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                              <View style={styles.aspectStars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <TouchableOpacity 
                                    key={star} 
                                    onPress={() => setMusicAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                                  >
                                    <Ionicons 
                                      name={star <= (musicAspectRatings as any)[aspect.key] ? "star" : "star-outline"} 
                                      size={24} 
                                      color={star <= (musicAspectRatings as any)[aspect.key] ? "#FFD700" : textColor} 
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteAlbum(selectedAlbum)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedSong || songLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSong(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {songLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedSong ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="subtitle">{selectedSong.title}</ThemedText>
                      <ThemedText style={{ color: tintColor }}>Song</ThemedText>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedSong(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedSong.image ? (
                      <Image 
                        source={{ uri: selectedSong.image }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🎵</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Artist</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedSong.artist || (selectedSong['artist-credit']?.[0]?.name) || 'Unknown'}</ThemedText>
                      
                      {selectedSong.length ? (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Duration</ThemedText>
                          <ThemedText style={styles.metaText}>{Math.floor(selectedSong.length / 60000)}:{( (selectedSong.length % 60000) / 1000).toFixed(0).padStart(2, '0')}</ThemedText>
                        </>
                      ) : null}

                      {selectedSong.releases && selectedSong.releases.length > 0 && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Appears on</ThemedText>
                          <ThemedText style={styles.metaText} numberOfLines={2}>{selectedSong.releases[0].title}</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {!isFavorite && (
                    <View style={styles.ratingSection}>
                      <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: tintColor }]}>Add to Favorites</ThemedText>
                      <ThemedText style={{ fontSize: 13, opacity: 0.6, marginBottom: Spacing.two }}>How would you like to rate this?</ThemedText>
                      <View style={styles.ratingModeButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'general' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('general')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'general' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>General</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'aspects' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('aspects')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'aspects' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>By Aspects</ThemedText>
                    </TouchableOpacity>
                      </View>

                      {ratingMode === 'general' && (
                        <View style={styles.starsContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setGeneralRating(star)}>
                              <Ionicons 
                                name={star <= generalRating ? "star" : "star-outline"} 
                                size={32} 
                                color={star <= generalRating ? "#FFD700" : textColor} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {ratingMode === 'aspects' && (
                        <View style={styles.aspectsContainer}>
                          {[
                            { key: 'vocals', label: 'Vocals' },
                            { key: 'melody', label: 'Melody' },
                            { key: 'lyrics', label: 'Lyrics' },
                            { key: 'production', label: 'Production & Mix' },
                            { key: 'vibe', label: 'Vibe' }
                          ].map((aspect) => (
                            <View key={aspect.key} style={styles.aspectItem}>
                              <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                              <View style={styles.aspectStars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <TouchableOpacity 
                                    key={star} 
                                    onPress={() => setMusicAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                                  >
                                    <Ionicons 
                                      name={star <= (musicAspectRatings as any)[aspect.key] ? "star" : "star-outline"} 
                                      size={24} 
                                      color={star <= (musicAspectRatings as any)[aspect.key] ? "#FFD700" : textColor} 
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteSong(selectedSong)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedAuthor || authorLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAuthor(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {authorLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedAuthor ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedAuthor.title || selectedAuthor.name}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedAuthor(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedAuthor.image ? (
                      <Image 
                        source={{ uri: selectedAuthor.image }} 
                        style={styles.modalThumbnail} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>👤</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Details</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedAuthor.subtitle || 'Author'}</ThemedText>
                      
                      {selectedAuthor.birth_date && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Born</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedAuthor.birth_date}</ThemedText>
                        </>
                      )}

                      {selectedAuthor.top_work && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Top Work</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedAuthor.top_work}</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {selectedAuthor.bio && (
                    <View style={{ marginTop: Spacing.three, paddingHorizontal: Spacing.one }}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor, marginBottom: Spacing.one }}>Biography</ThemedText>
                      <ThemedText style={{ lineHeight: 20 }}>
                        {typeof selectedAuthor.bio === 'string' ? selectedAuthor.bio : selectedAuthor.bio.value}
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteBook(selectedAuthor)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedBook || bookLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {bookLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedBook ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedBook.title}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedBook(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedBook.image ? (
                      <Image 
                        source={{ uri: selectedBook.image }} 
                        style={[styles.modalThumbnail, { height: 180 }]} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>📚</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Author(s)</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedBook.subtitle || 'Unknown'}</ThemedText>
                      
                      <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Type</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedBook.source}</ThemedText>

                      {selectedBook.description && (
                        <View style={{ marginTop: Spacing.two }}>
                          <ThemedText type="defaultSemiBold" style={{ color: tintColor, marginBottom: Spacing.half }}>Description</ThemedText>
                          <ThemedText style={{ fontSize: 13, lineHeight: 18 }} numberOfLines={5}>
                            {typeof selectedBook.description === 'string' ? selectedBook.description : selectedBook.description.value}
                          </ThemedText>
                        </View>
                      )}

                      {selectedBook.subtitle && (
                        <TouchableOpacity 
                          style={[styles.favoriteButton, { height: 40, marginTop: Spacing.two, paddingHorizontal: 12 }]}
                          onPress={() => toggleFavoriteAuthor(selectedBook.subtitle)}
                        >
                          <Ionicons name="person-add" size={18} color="#fff" />
                          <ThemedText style={[styles.favoriteButtonText, { fontSize: 14, color: '#fff' }]}>
                            Favorite Author
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteBook(selectedBook)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>
      
      <Modal
        visible={!!selectedMovie || movieLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMovie(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {movieLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedMovie ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedMovie.title || selectedMovie.name}</ThemedText>
                    {!isFavorite && ratingMode !== 'none' && (
                      <TouchableOpacity 
                        onPress={() => toggleFavoriteMovie(selectedMovie)}
                        style={{ paddingHorizontal: Spacing.three, paddingVertical: Spacing.one }}
                      >
                        <ThemedText style={{ color: tintColor, fontWeight: '700' }}>Add</ThemedText>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => setSelectedMovie(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedMovie.poster_path ? (
                      <Image 
                        source={{ uri: `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🎬</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Release Date</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedMovie.release_date || selectedMovie.first_air_date}</ThemedText>
                      
                      {selectedMovie.vote_average && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>TMDB Rating</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedMovie.vote_average.toFixed(1)} / 10</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  {selectedMovie.overview ? (
                    <View style={styles.bioContainer}>
                      <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Overview</ThemedText>
                      <ThemedText style={styles.bioText}>
                        {selectedMovie.overview}
                      </ThemedText>
                    </View>
                  ) : null}

                  {!isFavorite && (
                    <View style={styles.ratingSection}>
                      <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: tintColor }]}>Add to Favorites</ThemedText>
                      <ThemedText style={{ fontSize: 13, opacity: 0.6, marginBottom: Spacing.two }}>How would you like to rate this?</ThemedText>
                      <View style={styles.ratingModeButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'general' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('general')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'general' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>General</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'aspects' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('aspects')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'aspects' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>By Aspects</ThemedText>
                    </TouchableOpacity>
                      </View>

                      {ratingMode === 'general' && (
                        <View style={styles.starsContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setGeneralRating(star)}>
                              <Ionicons 
                                name={star <= generalRating ? "star" : "star-outline"} 
                                size={32} 
                                color={star <= generalRating ? "#FFD700" : textColor} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {ratingMode === 'aspects' && (
                        <View style={styles.aspectsContainer}>
                          {[
                            { key: 'story', label: 'Story' },
                            { key: 'acting', label: 'Acting/Cast Performance' },
                            { key: 'cinematography', label: 'Cinematography & Directing' },
                            { key: 'soundtrack', label: 'Soundtrack' },
                            { key: 'atmosphere', label: 'Atmosphere' }
                          ].map((aspect) => (
                            <View key={aspect.key} style={styles.aspectItem}>
                              <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                              <View style={styles.aspectStars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <TouchableOpacity 
                                    key={star} 
                                    onPress={() => setAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                                  >
                                    <Ionicons 
                                      name={star <= (aspectRatings as any)[aspect.key] ? "star" : "star-outline"} 
                                      size={24} 
                                      color={star <= (aspectRatings as any)[aspect.key] ? "#FFD700" : textColor} 
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteMovie(selectedMovie)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>
      <Modal
        visible={!!selectedSportItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSportItem(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {selectedSportItem ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedSportItem.title}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedSportItem(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedSportItem.image ? (
                      <Image 
                        source={{ uri: selectedSportItem.image }} 
                        style={styles.modalThumbnail} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🏟️</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Sport</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedSportItem.source}</ThemedText>
                      
                      <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Type</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedSportItem.media_type}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.bioContainer}>
                    <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Details</ThemedText>
                    {selectedSportItem.media_type === 'player' && selectedSportItem.details ? (
                      <View style={{ gap: Spacing.two }}>
                        <View style={styles.detailRow}>
                          <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Team: </ThemedText>
                          <ThemedText style={styles.bioText}>{selectedSportItem.details.team_name || 'N/A'}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Position: </ThemedText>
                          <ThemedText style={styles.bioText}>{selectedSportItem.details.position || 'N/A'}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Age: </ThemedText>
                          <ThemedText style={styles.bioText}>{selectedSportItem.details.age || 'N/A'}</ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Number: </ThemedText>
                          <ThemedText style={styles.bioText}>{selectedSportItem.details.number || 'N/A'}</ThemedText>
                        </View>
                      </View>
                    ) : (
                      <ThemedText style={styles.bioText}>
                        This is a {selectedSportItem.media_type} from {selectedSportItem.source}. 
                        Add it to your favorites to keep track of it!
                      </ThemedText>
                    )}
                  </View>
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteSport(selectedSportItem)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      {/* Food Detail Modal */}
      <Modal
        visible={!!selectedPlace || placeLoading}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {placeLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five }}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : selectedPlace ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedPlace.title}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedPlace(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedPlace.image ? (
                      <Image 
                        source={{ uri: selectedPlace.image }} 
                        style={styles.modalThumbnail} 
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🌍</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Region</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedPlace.subtitle}</ThemedText>
                      
                      <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Capital</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedPlace.details?.capital?.[0] || 'N/A'}</ThemedText>

                      <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Languages</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedPlace.details?.languages ? Object.values(selectedPlace.details.languages).join(', ') : 'N/A'}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.ratingSection}>
                    <ThemedText type="defaultSemiBold" style={styles.ratingTitle}>Add to Favorites</ThemedText>
                    <ThemedText style={{ fontSize: 13, opacity: 0.6, marginBottom: Spacing.two }}>How would you like to rate this?</ThemedText>
                    
                    {!isFavorite && (
                      <View style={styles.ratingModeButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'general' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('general')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'general' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>General</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.modeButton, 
                        (ratingMode === 'aspects' ? { backgroundColor: tintColor } : undefined)
                      ].filter(Boolean) as any}
                      onPress={() => setRatingMode('aspects')}
                    >
                      <ThemedText style={[
                        styles.modeButtonText, 
                        (ratingMode === 'aspects' ? { color: '#fff' } : undefined)
                      ].filter(Boolean) as any}>By Aspects</ThemedText>
                    </TouchableOpacity>
                      </View>
                    )}

                    {ratingMode === 'general' && (
                      <View style={styles.aspectRatingRow}>
                        <ThemedText style={styles.aspectLabel}>General Rating</ThemedText>
                        <View style={styles.aspectStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => !isFavorite && setGeneralRating(star)}>
                              <Ionicons 
                                name={star <= generalRating ? "star" : "star-outline"} 
                                size={32} 
                                color={star <= generalRating ? "#FFCC00" : textColor} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {ratingMode === 'aspects' && (
                      <View style={{ gap: Spacing.two }}>
                        <View style={styles.aspectRatingRow}>
                          <ThemedText style={styles.aspectLabel}>Gastronomy</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => !isFavorite && setPlaceAspectRatings(prev => ({ ...prev, gastronomy: star }))}>
                                <Ionicons 
                                  name={star <= placeAspectRatings.gastronomy ? "star" : "star-outline"} 
                                  size={24} 
                                  color={star <= placeAspectRatings.gastronomy ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.aspectRatingRow}>
                          <ThemedText style={styles.aspectLabel}>Culture</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => !isFavorite && setPlaceAspectRatings(prev => ({ ...prev, culture: star }))}>
                                <Ionicons 
                                  name={star <= placeAspectRatings.culture ? "star" : "star-outline"} 
                                  size={24} 
                                  color={star <= placeAspectRatings.culture ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.aspectRatingRow}>
                          <ThemedText style={styles.aspectLabel}>Nature</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => !isFavorite && setPlaceAspectRatings(prev => ({ ...prev, nature: star }))}>
                                <Ionicons 
                                  name={star <= placeAspectRatings.nature ? "star" : "star-outline"} 
                                  size={24} 
                                  color={star <= placeAspectRatings.nature ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.aspectRatingRow}>
                          <ThemedText style={styles.aspectLabel}>Vibe</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => !isFavorite && setPlaceAspectRatings(prev => ({ ...prev, vibe: star }))}>
                                <Ionicons 
                                  name={star <= placeAspectRatings.vibe ? "star" : "star-outline"} 
                                  size={24} 
                                  color={star <= placeAspectRatings.vibe ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.aspectRatingRow}>
                          <ThemedText style={styles.aspectLabel}>Affordability</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => !isFavorite && setPlaceAspectRatings(prev => ({ ...prev, affordability: star }))}>
                                <Ionicons 
                                  name={star <= placeAspectRatings.affordability ? "star" : "star-outline"} 
                                  size={24} 
                                  color={star <= placeAspectRatings.affordability ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => !isFavorite && setTraveled(!traveled)}
                      activeOpacity={0.7}
                      disabled={isFavorite}
                    >
                      <Ionicons 
                        name={traveled ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={traveled ? tintColor : textColor} 
                      />
                      <ThemedText style={styles.checkboxLabel}>I Have Traveled</ThemedText>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.modalActionBtn, { backgroundColor: tintColor, marginTop: Spacing.four }]}
                    onPress={() => toggleFavoritePlace(selectedPlace)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={styles.actionBtnText}>
                      {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>

      <Modal
        visible={!!selectedFood}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFood(null)}
      >
        <View style={styles.modalOverlay}>
      <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <ThemedView style={styles.modalContent}>
            {selectedFood ? (
              <>
                <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                  <View style={styles.modalHeader}>
                    <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedFood.title}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setSelectedFood(null)}
                      style={{ padding: Spacing.one }}
                    >
                      <Ionicons name="close-circle" size={32} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.personInfoRow}>
                    {selectedFood.image ? (
                      <Image 
                        source={{ uri: selectedFood.image }} 
                        style={styles.modalThumbnail} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                        <ThemedText style={styles.placeholderText}>🍲</ThemedText>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Category</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedFood.source}</ThemedText>
                      
                      <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Type</ThemedText>
                      <ThemedText style={styles.metaText}>{selectedFood.details?.strCategory || 'N/A'}</ThemedText>

                      {selectedFood.details?.strArea && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Area</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedFood.details.strArea}</ThemedText>
                        </>
                      )}
                      {selectedFood.details?.strAlcoholic && (
                        <>
                          <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Type</ThemedText>
                          <ThemedText style={styles.metaText}>{selectedFood.details.strAlcoholic}</ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.bioContainer}>
                    <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.four, color: tintColor }}>Instructions / Description</ThemedText>
                    <ThemedText style={styles.bioText}>
                      {selectedFood.details?.strInstructions || `This is a delicious ${selectedFood.media_type}! Add it to your favorites to save it to your collection.`}
                    </ThemedText>
                  </View>
                </ScrollView>

                <View style={[styles.stickyButtonContainer, { borderTopColor: theme.background === '#ffffff' ? '#eee' : '#444' }]}>
                  <TouchableOpacity 
                    style={[styles.favoriteButton, { backgroundColor: isFavorite ? '#8E8E93' : '#FF3B30', height: 56 }]}
                    onPress={() => toggleFavoriteFood(selectedFood)}
                  >
                    <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                    <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                      {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ThemedView>
        </SafeAreaView>
      </View>
      </Modal>
      <Modal
        visible={!!selectedGame}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGame(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
            <ThemedView style={styles.modalContent}>
              {selectedGame ? (
                <>
                  <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                    <View style={styles.modalHeader}>
                      <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedGame.title}</ThemedText>
                      <TouchableOpacity 
                        onPress={() => setSelectedGame(null)}
                        style={{ padding: Spacing.one }}
                      >
                        <Ionicons name="close-circle" size={32} color={textColor} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.personInfoRow}>
                      {selectedGame.image ? (
                        <Image 
                          source={{ uri: selectedGame.image }} 
                          style={styles.modalThumbnail} 
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                          <ThemedText style={styles.placeholderText}>🎮</ThemedText>
                        </View>
                      )}
                      <View style={styles.personMeta}>
                        <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Released</ThemedText>
                        <ThemedText style={styles.metaText}>{selectedGame.details?.released || 'Unknown'}</ThemedText>
                        
                        <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Rating</ThemedText>
                        <ThemedText style={styles.metaText}>{selectedGame.details?.rating} / 5</ThemedText>

                        {selectedGame.details?.metacritic && (
                          <>
                            <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Metacritic</ThemedText>
                            <ThemedText style={styles.metaText}>{selectedGame.details?.metacritic}</ThemedText>
                          </>
                        )}
                      </View>
                    </View>

                    {selectedGame.details?.platforms && (
                      <View style={{ marginTop: Spacing.two }}>
                        <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Platforms</ThemedText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.one }}>
                          {selectedGame.details.platforms.map((p: any, idx: number) => (
                            <View key={idx} style={{ backgroundColor: inputBackground, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8, marginBottom: 8 }}>
                              <ThemedText style={{ fontSize: 12 }}>{p.platform.name}</ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {!isFavorite && (
                      <View style={styles.ratingSection}>
                        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: tintColor }]}>Rating</ThemedText>
                        
                        <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two }}>
                          <TouchableOpacity 
                            style={[
                              styles.modeButton, 
                              ratingMode === 'general' && { backgroundColor: tintColor }
                            ]}
                            onPress={() => setRatingMode('general')}
                          >
                            <ThemedText style={[styles.modeButtonText, ratingMode === 'general' && { color: '#fff' }]}>General</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[
                              styles.modeButton, 
                              ratingMode === 'aspects' && { backgroundColor: tintColor }
                            ]}
                            onPress={() => setRatingMode('aspects')}
                          >
                            <ThemedText style={[styles.modeButtonText, ratingMode === 'aspects' && { color: '#fff' }]}>By Aspects</ThemedText>
                          </TouchableOpacity>
                        </View>

                        {ratingMode === 'general' && (
                          <View style={styles.ratingStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => {
                                setRatingMode('general');
                                setGeneralRating(star);
                              }}>
                                <Ionicons 
                                  name={star <= generalRating ? "star" : "star-outline"} 
                                  size={32} 
                                  color={star <= generalRating ? "#FFCC00" : textColor} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {ratingMode === 'aspects' && (
                          <View style={{ gap: Spacing.two }}>
                            {[
                              { key: 'gameplay', label: 'Gameplay' },
                              { key: 'graphics', label: 'Graphics' },
                              { key: 'story', label: 'Story' },
                              { key: 'audio', label: 'Audio' },
                              { key: 'performance', label: 'Performance' }
                            ].map((aspect) => (
                              <View key={aspect.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 14 }}>{aspect.label}</ThemedText>
                                <View style={{ flexDirection: 'row', gap: 4 }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity 
                                      key={star} 
                                      onPress={() => setGameAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                                    >
                                      <Ionicons 
                                        name={star <= (gameAspectRatings as any)[aspect.key] ? "star" : "star-outline"} 
                                        size={20} 
                                        color={star <= (gameAspectRatings as any)[aspect.key] ? "#FFCC00" : textColor} 
                                      />
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={[styles.favoriteButton, isFavorite ? styles.isFavorite : { backgroundColor: tintColor }]}
                      onPress={() => toggleFavoriteGame(selectedGame)}
                    >
                      <Ionicons 
                        name={isFavorite ? "heart" : "heart-outline"} 
                        size={24} 
                        color="#fff" 
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText style={[styles.favoriteButtonText, { fontSize: 18, color: '#fff' }]}>
                        {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </ThemedView>
          </SafeAreaView>
        </View>
      </Modal>
      <Modal
        visible={!!selectedVehicle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVehicle(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
            <ThemedView style={styles.modalContent}>
              {selectedVehicle ? (
                <>
                  <ScrollView style={styles.personDetailContainer} contentContainerStyle={{ paddingBottom: Spacing.five }}>
                    <View style={styles.modalHeader}>
                      <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedVehicle.title}</ThemedText>
                      <TouchableOpacity 
                        onPress={() => setSelectedVehicle(null)}
                        style={{ padding: Spacing.one }}
                      >
                        <Ionicons name="close-circle" size={32} color={textColor} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.personInfoRow}>
                      {selectedVehicle.image ? (
                        <Image 
                          source={{ uri: selectedVehicle.image }} 
                          style={styles.modalThumbnail} 
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.modalThumbnail, styles.placeholderThumbnail]}>
                          <ThemedText style={styles.placeholderText}>🚗</ThemedText>
                        </View>
                      )}
                      <View style={styles.personMeta}>
                        <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>Make</ThemedText>
                        <ThemedText style={styles.metaText}>{selectedVehicle.details?.make_name}</ThemedText>
                        
                        <ThemedText type="defaultSemiBold" style={[styles.metaLabel, { color: tintColor }]}>Type</ThemedText>
                        <ThemedText style={styles.metaText}>{selectedVehicle.details?.vehicle_type || 'Vehicle'}</ThemedText>
                      </View>
                    </View>

                    {!isFavorite && (
                      <View style={styles.ratingSection}>
                        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: tintColor }]}>Choose Rating Mode</ThemedText>
                        <View style={styles.ratingModeContainer}>
                          <TouchableOpacity 
                            style={[styles.ratingModeButton, ratingMode === 'general' && { backgroundColor: tintColor }]}
                            onPress={() => setRatingMode('general')}
                          >
                            <ThemedText style={[styles.ratingModeText, ratingMode === 'general' && styles.activeCategoryText]}>General</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.ratingModeButton, ratingMode === 'aspects' && { backgroundColor: tintColor }]}
                            onPress={() => setRatingMode('aspects')}
                          >
                            <ThemedText style={[styles.ratingModeText, ratingMode === 'aspects' && styles.activeCategoryText]}>Aspects</ThemedText>
                          </TouchableOpacity>
                        </View>

                      {ratingMode === 'general' && (
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setGeneralRating(star)}>
                              <Ionicons 
                                name={star <= generalRating ? "star" : "star-outline"} 
                                size={24} 
                                color={star <= generalRating ? "#FFCC00" : textColor} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                        {ratingMode === 'aspects' && (
                          <View style={styles.aspectsContainer}>
                            {selectedVehicle.details?.vehicle_type === 'passenger car' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Performance & Speed</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, performance: star})}>
                                        <Ionicons 
                                          name={star <= vehicleAspectRatings.performance ? "star" : "star-outline"} 
                                          size={20} 
                                          color={star <= vehicleAspectRatings.performance ? "#FFCC00" : textColor} 
                                        />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Design & Aesthetics</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, design: star})}>
                                        <Ionicons 
                                          name={star <= vehicleAspectRatings.design ? "star" : "star-outline"} 
                                          size={20} 
                                          color={star <= vehicleAspectRatings.design ? "#FFCC00" : textColor} 
                                        />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Driving Dynamics</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, driving: star})}>
                                        <Ionicons 
                                          name={star <= vehicleAspectRatings.driving ? "star" : "star-outline"} 
                                          size={20} 
                                          color={star <= vehicleAspectRatings.driving ? "#FFCC00" : textColor} 
                                        />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Daily Usability</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, usability: star})}>
                                        <Ionicons 
                                          name={star <= vehicleAspectRatings.usability ? "star" : "star-outline"} 
                                          size={20} 
                                          color={star <= vehicleAspectRatings.usability ? "#FFCC00" : textColor} 
                                        />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                            {selectedVehicle.details?.vehicle_type === 'multipurpose passenger vehicle (mpv)' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Off-Road Capability</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, offroad: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.offroad ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.offroad ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Cabin & Cargo Space</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, space: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.space ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.space ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Safety & Reliability</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, safety: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.safety ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.safety ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Versatility & Adventure</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, versatility: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.versatility ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.versatility ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                            {selectedVehicle.details?.vehicle_type === 'motorcycle' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Exclusivity & Heritage</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, exclusivity: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.exclusivity ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.exclusivity ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Power-to-Weight Ratio</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, powerWeight: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.powerWeight ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.powerWeight ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Customization Potential</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, customization: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.customization ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.customization ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Riding Experience</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, ridingExperience: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.ridingExperience ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.ridingExperience ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                            {selectedVehicle.details?.vehicle_type === 'truck' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Towing & Payload Capacity</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, towing: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.towing ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.towing ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Durability & Ruggedness</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, durability: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.durability ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.durability ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Utility & Functionality</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, utility: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.utility ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.utility ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Road Presence</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, roadPresence: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.roadPresence ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.roadPresence ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                            {selectedVehicle.details?.vehicle_type === 'bus' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Historical Significance</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, history: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.history ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.history ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Luxury & Customization</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, luxury: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.luxury ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.luxury ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Passenger Capacity</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, capacity: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.capacity ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.capacity ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                            {selectedVehicle.details?.vehicle_type === 'low speed vehicle (lsv)' && (
                              <>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Recreational Fun</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, fun: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.fun ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.fun ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Eco-Friendliness</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, eco: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.eco ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.eco ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.aspectRow}>
                                  <ThemedText style={styles.aspectLabel}>Compact Maneuverability</ThemedText>
                                  <View style={styles.aspectStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <TouchableOpacity key={star} onPress={() => setVehicleAspectRatings({...vehicleAspectRatings, maneuverability: star})}>
                                        <Ionicons name={star <= vehicleAspectRatings.maneuverability ? "star" : "star-outline"} size={20} color={star <= vehicleAspectRatings.maneuverability ? "#FFCC00" : textColor} />
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: isFavorite ? '#8E8E93' : tintColor, marginTop: Spacing.four }]}
                      onPress={() => toggleFavoriteVehicle(selectedVehicle)}
                    >
                      <Ionicons name={isFavorite ? "heart-dislike" : "heart"} size={24} color="#fff" />
                      <ThemedText style={styles.actionBtnText}>
                        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </ThemedText>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              ) : null}
            </ThemedView>
          </SafeAreaView>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginVertical: 15,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginRight: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginRight: 10,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
  },
  searchInput: {
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  resultItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginRight: 15,
  },
  squareThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
  },
  userThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  placeholderThumbnail: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    flex: 1,
    marginRight: 8,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    opacity: 0.7,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
    width: '100%',
    height: '85%',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  personDetailContainer: {
    flex: 1,
  },
  stickyButtonContainer: {
    padding: Spacing.four,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
    zIndex: 10,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.two,
  },
  aspectRow: {
    marginBottom: Spacing.three,
  },
  aspectLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: Spacing.one,
  },
  aspectStars: {
    flexDirection: 'row',
    gap: 4,
  },
  aspectsContainer: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  personInfoRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  modalThumbnail: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  personMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  metaLabel: {
    marginTop: Spacing.two,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.8,
  },
  bioContainer: {
    gap: Spacing.two,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  favoriteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: Spacing.four,
    paddingTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  ratingModeButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  aspectsContainer: {
    gap: Spacing.three,
  },
  aspectItem: {
    gap: Spacing.one,
  },
  aspectLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  aspectStars: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingModeContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  ratingModeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    alignItems: 'center',
  },
  ratingModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  ratingSlider: {
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: 'inherit',
  },
  aspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  aspectInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    textAlign: 'center',
    color: 'inherit',
  },
});
