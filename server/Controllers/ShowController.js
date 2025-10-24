import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/show.js";

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "TMDB API key not configured. Please contact administrator.",
      });
    }

    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
        timeout: 15000,
      }
    );

    res.json({ success: true, movies: data.results });
  } catch (error) {
    console.error('TMDB API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: "TMDB API key is invalid or expired. Please contact administrator.",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies from TMDB. " + error.message,
    });
  }
};

//api to add a new shw to the db




export const addShow = async (req, res) => {
  try {
    let { movieId, showInput, showPrice } = req.body;

    // 1️⃣ Validate input
    if (!movieId || !showInput || !showPrice) {
      return res.status(400).json({
        success: false,
        message: "movieId, showInput, and showPrice are required.",
      });
    }

    // 2️⃣ Check if movie exists in DB
    let movie = await Movie.findById(movieId);

    // 3️⃣ Fetch from TMDb if movie not in DB
    if (!movie) {
      let movieDetailsResponse, movieCreditsResponse;

      try {
        [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            timeout: 15000,
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            timeout: 15000,
          }),
        ]);
      } catch (tmdbError) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch movie data from TMDb. " + tmdbError.message,
        });
      }

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        genres: (movieApiData.genres || []).map(genre => ({ id: genre.id, name: genre.name })),
        // Store only cast with images to ensure UI can always render photos
        casts: (movieCreditsData.cast || [])
          .filter(cast => !!cast.profile_path)
          .slice(0, 20)
          .map(cast => ({ name: cast.name, profile_path: cast.profile_path })),
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    // 4️⃣ Prepare show documents
    const showsToCreate = [];
    showInput.forEach(show => {
      const showDate = show.date;
      show.time.forEach(time => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movie._id, // Use the actual movie document's _id (ObjectId)
          showDatetime: new Date(dateTimeString), // Fixed field name
          showPrice,
          occupiedSeat: {}, // Fixed field name to match schema
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: "Show added successfully." });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};




//api to get all shows from db
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDatetime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDatetime: 1 });

    const moviesWithShows = new Map();

    shows.forEach(show => {
      if (!show.movie) return; // Skip if movie population failed

      const movieId = show.movie._id.toString();
      if (!moviesWithShows.has(movieId)) {
        moviesWithShows.set(movieId, {
          movie: show.movie,
          dates: new Map()
        });
      }

      const movieEntry = moviesWithShows.get(movieId);
      // Format date to YYYY-MM-DD for grouping
      const showDate = show.showDatetime.toISOString().split("T")[0];

      if (!movieEntry.dates.has(showDate)) {
        movieEntry.dates.set(showDate, []);
      }
      movieEntry.dates.get(showDate).push({
        time: show.showDatetime,
        showId: show._id,
        showPrice: show.showPrice,
        occupiedSeat: show.occupiedSeat // Include occupied seats if needed for client-side filtering
      });
    });

    // Convert maps to arrays for JSON response
    const result = Array.from(moviesWithShows.values()).map(movieEntry => ({
      movie: movieEntry.movie,
      dates: Array.from(movieEntry.dates.entries()).map(([date, shows]) => ({
        date,
        shows: shows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()) // Sort shows by time
      }))
    }));

    res.json({ success: true, movies: result });
  } catch (error) {
    console.error('Error in getAllShows:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//api to get a single show from db

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId, showDatetime: { $gte: new Date() } });
    let movie = await Movie.findById(movieId);

    // If movie has no casts with images, refetch from TMDB once and update
    if (!movie || !Array.isArray(movie.casts) || movie.casts.length === 0) {
      try {
        const credits = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          timeout: 15000,
        });
        const castWithImages = (credits.data.cast || [])
          .filter(c => !!c.profile_path)
          .slice(0, 20)
          .map(c => ({ name: c.name, profile_path: c.profile_path }));
        if (movie && castWithImages.length > 0) {
          movie.casts = castWithImages;
          await movie.save();
        }
      } catch (_) {
        // swallow TMDB fetch error here; UI will just render without casts
      }
    }

    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDatetime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: show.showDatetime, showId: show._id });
    });
    res.json({ success: true, movie, dateTime});

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDatetime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDatetime: 1 });

    const validShows = shows.filter(show => show.movie !== null);
    const uniqueMoviesMap = new Map();
    
    validShows.forEach((show) => {
      if (show && show.movie && show.movie._id) {
        const movieId = show.movie._id.toString();
        if (!uniqueMoviesMap.has(movieId)) {
          uniqueMoviesMap.set(movieId, show.movie);
        }
      }
    });

    const uniqueMovies = Array.from(uniqueMoviesMap.values());
    res.json({ success: true, shows: uniqueMovies });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

