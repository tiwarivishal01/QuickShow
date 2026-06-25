import axios from "axios";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Show from "../models/show.js";
import { inngest } from "../inngest/index.js";
import { dummyShowsData } from "../config/moviesFallback.js";

const seedDefaultShowsIfNeeded = async () => {
  try {
    const showCount = await Show.countDocuments();
    if (showCount > 0) {
      return;
    }

    console.log("Seeding default shows...");

    let moviesToSeed = [];
    let tmdbSuccess = false;

    const genreMap = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western"
    };

    const defaultCasts = [
      { name: "Robert Downey Jr.", profile_path: "/5qHN44TTxq2uEGIu88QOI1arrc1.jpg" },
      { name: "Scarlett Johansson", profile_path: "/6NsMbJvR77HQXLEldcc7Ugj685I.jpg" },
      { name: "Chris Evans", profile_path: "/3bkwgd8J6kRndAY79ugJ0K2nZas.jpg" },
      { name: "Mark Ruffalo", profile_path: "/isQ7490hn9ugbjKN46G3j6H5RtB.jpg" }
    ];

    if (process.env.TMDB_API_KEY) {
      try {
        console.log("Fetching pages of now playing movies from TMDB API to get 100 movies...");
        const base_url = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
        let tmdbMoviesList = [];

        // Fetch pages 1 to 5 to accumulate 100 movies
        for (let page = 1; page <= 5; page++) {
          const nowPlayingRes = await axios.get(`${base_url}/movie/now_playing?page=${page}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            timeout: 10000,
          });
          if (nowPlayingRes.data && Array.isArray(nowPlayingRes.data.results)) {
            tmdbMoviesList = tmdbMoviesList.concat(nowPlayingRes.data.results);
          }
        }

        tmdbMoviesList = tmdbMoviesList.slice(0, 100);

        if (tmdbMoviesList.length > 0) {
          moviesToSeed = tmdbMoviesList.map((m) => {
            let genres = (m.genre_ids || []).map((id) => ({ id, name: genreMap[id] || "Genre" }));
            if (genres.length === 0) {
              genres = [{ id: 0, name: "Drama" }];
            }
            return {
              _id: String(m.id),
              title: m.title || "Untitled Movie",
              overview: m.overview || "No overview available.",
              poster_path: m.poster_path || "/placeholder.jpg",
              backdrop_path: m.backdrop_path || "/placeholder.jpg",
              release_date: m.release_date || "2026-06-25",
              original_language: m.original_language || "en",
              tagline: m.tagline || "",
              genres: genres,
              casts: defaultCasts,
              vote_average: m.vote_average || 0,
              runtime: 90 + Math.floor(Math.random() * 60), // Random runtime between 90 and 150 mins
            };
          });

          tmdbSuccess = true;
          console.log(`Successfully mapped ${moviesToSeed.length} movies from TMDB.`);
        }
      } catch (tmdbError) {
        console.warn("Failed to fetch movies from TMDB API during seeding:", tmdbError.message);
      }
    }

    if (!tmdbSuccess) {
      console.log("Using fallback dummy movies for seeding...");
      // Replicate fallback dummy movies to make exactly 100 movies
      const replicatedMovies = [];
      for (let i = 0; i < 100; i++) {
        const originalMovie = dummyShowsData[i % dummyShowsData.length];
        replicatedMovies.push({
          ...originalMovie,
          _id: `${originalMovie._id}_${i}`,
          id: originalMovie.id + i,
          title: `${originalMovie.title} (Listing ${i + 1})`
        });
      }
      moviesToSeed = replicatedMovies;
    }

    // Ensure movies exist in DB
    for (const movieData of moviesToSeed) {
      const exists = await Movie.findById(movieData._id);
      if (!exists) {
        await Movie.create(movieData);
      }
    }

    const showsToCreate = [];
    const baseDate = new Date();

    moviesToSeed.forEach((movieData, movieIdx) => {
      const showDate = new Date();
      // Set to exactly 10 years in the future so shows don't expire
      showDate.setFullYear(baseDate.getFullYear() + 10);
      // Stagger dates across 30 days and hours to look realistic
      showDate.setDate(showDate.getDate() + (movieIdx % 30));
      showDate.setHours(10 + (movieIdx % 12), (movieIdx % 4) * 15, 0, 0);

      showsToCreate.push({
        movie: movieData._id,
        showDatetime: showDate,
        showPrice: 15 + (movieIdx % 3) * 5,
        occupiedSeat: {}
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
      console.log(`Successfully seeded ${showsToCreate.length} default shows (listings) scheduled 10 years in the future!`);
    }
  } catch (error) {
    console.error("Failed to seed default shows:", error);
  }
};

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      console.warn("TMDB API key not configured. Using fallback movies.");
      return res.json({ success: true, movies: dummyShowsData });
    }

    const base_url = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
    const { data } = await axios.get(
      `${base_url}/movie/now_playing`,
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
    console.warn("Falling back to local dummy movies due to TMDB API error.");
    res.json({ success: true, movies: dummyShowsData });
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
    let isNewMovie = false;

    // 3️⃣ Fetch from TMDb if movie not in DB
    if (!movie) {
      let movieDetailsResponse, movieCreditsResponse;
      let useFallback = false;

      try {
        if (!process.env.TMDB_API_KEY) {
          throw new Error("TMDB API key not configured");
        }
        const base_url = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
        [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
          axios.get(`${base_url}/movie/${movieId}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            timeout: 15000,
          }),
          axios.get(`${base_url}/movie/${movieId}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            timeout: 15000,
          }),
        ]);
      } catch (tmdbError) {
        console.warn("Failed to fetch movie data from TMDb. Checking fallback data:", tmdbError.message);
        useFallback = true;
      }

      if (useFallback) {
        const fallbackMovie = dummyShowsData.find(
          (m) => m._id === movieId || m.id?.toString() === movieId
        );
        if (!fallbackMovie) {
          return res.status(500).json({
            success: false,
            message: "Failed to fetch movie from TMDB, and no fallback movie details found.",
          });
        }
        movie = await Movie.create({
          _id: movieId,
          title: fallbackMovie.title,
          overview: fallbackMovie.overview,
          poster_path: fallbackMovie.poster_path,
          backdrop_path: fallbackMovie.backdrop_path,
          release_date: fallbackMovie.release_date,
          original_language: fallbackMovie.original_language,
          tagline: fallbackMovie.tagline || "",
          genres: fallbackMovie.genres,
          casts: fallbackMovie.casts,
          vote_average: fallbackMovie.vote_average,
          runtime: fallbackMovie.runtime,
        });
        isNewMovie = true;
      } else {
        const movieApiData = movieDetailsResponse.data;
        const movieCreditsData = movieCreditsResponse.data;

        let casts = (movieCreditsData.cast || [])
          .filter(cast => !!cast.profile_path)
          .slice(0, 20)
          .map(cast => ({ name: cast.name, profile_path: cast.profile_path }));
        if (casts.length === 0) {
          casts = [
            { name: "Robert Downey Jr.", profile_path: "/5qHN44TTxq2uEGIu88QOI1arrc1.jpg" },
            { name: "Scarlett Johansson", profile_path: "/6NsMbJvR77HQXLEldcc7Ugj685I.jpg" },
            { name: "Chris Evans", profile_path: "/3bkwgd8J6kRndAY79ugJ0K2nZas.jpg" },
            { name: "Mark Ruffalo", profile_path: "/isQ7490hn9ugbjKN46G3j6H5RtB.jpg" }
          ];
        }

        const movieDetails = {
          _id: movieId,
          title: movieApiData.title || "Untitled Movie",
          overview: movieApiData.overview || "No overview available.",
          poster_path: movieApiData.poster_path || "/placeholder.jpg",
          backdrop_path: movieApiData.backdrop_path || "/placeholder.jpg",
          release_date: movieApiData.release_date || "2026-06-25",
          original_language: movieApiData.original_language || "en",
          tagline: movieApiData.tagline || "",
          genres: (movieApiData.genres || []).length > 0
            ? (movieApiData.genres || []).map(genre => ({ id: genre.id, name: genre.name }))
            : [{ id: 0, name: "Drama" }],
          casts: casts,
          vote_average: movieApiData.vote_average || 0,
          runtime: movieApiData.runtime || 120,
        };

        movie = await Movie.create(movieDetails);
        isNewMovie = true;
      }
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

    let createdShows = [];
    if (showsToCreate.length > 0) {
      createdShows = await Show.insertMany(showsToCreate);
    }

    if (isNewMovie) {
      try {
        await inngest.send({
          name: 'app/movie.added',
          data: { movieId: movie._id?.toString() }
        });
      } catch (err) {
        console.error('[Inngest] Failed to send movie.added event', err);
      }
    }

    res.json({ success: true, shows: createdShows });

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
    await seedDefaultShowsIfNeeded();
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
  console.log("-> HIT GET SHOW:", req.params.movieId);
  console.log("-> DB STATUS:", mongoose.connection.readyState);
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
  console.log("-> HIT GET SHOWS");
  console.log("-> DB STATUS:", mongoose.connection.readyState);
  try {
    await seedDefaultShowsIfNeeded();
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

