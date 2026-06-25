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

    if (process.env.TMDB_API_KEY) {
      try {
        console.log("Fetching now playing movies from TMDB API for seeding...");
        const base_url = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
        const nowPlayingRes = await axios.get(`${base_url}/movie/now_playing`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          timeout: 15000,
        });

        if (nowPlayingRes.data && Array.isArray(nowPlayingRes.data.results) && nowPlayingRes.data.results.length > 0) {
          // Take top 10 now playing movies
          const tmdbMovies = nowPlayingRes.data.results.slice(0, 10);
          console.log(`Found ${tmdbMovies.length} now playing movies. Fetching details & credits...`);

          const detailedMovies = await Promise.all(
            tmdbMovies.map(async (m) => {
              try {
                const [detailsRes, creditsRes] = await Promise.all([
                  axios.get(`${base_url}/movie/${m.id}`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                    timeout: 10000,
                  }),
                  axios.get(`${base_url}/movie/${m.id}/credits`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                    timeout: 10000,
                  }),
                ]);

                const details = detailsRes.data;
                const credits = creditsRes.data;

                return {
                  _id: String(details.id),
                  title: details.title,
                  overview: details.overview || "",
                  poster_path: details.poster_path || "",
                  backdrop_path: details.backdrop_path || "",
                  release_date: details.release_date || "",
                  original_language: details.original_language || "",
                  tagline: details.tagline || "",
                  genres: (details.genres || []).map((g) => ({ id: g.id, name: g.name })),
                  casts: (credits.cast || [])
                    .filter((c) => !!c.profile_path)
                    .slice(0, 20)
                    .map((c) => ({ name: c.name, profile_path: c.profile_path })),
                  vote_average: details.vote_average || 0,
                  runtime: details.runtime || 120,
                };
              } catch (err) {
                console.error(`Failed to fetch details for movie ${m.id}:`, err.message);
                return null;
              }
            })
          );

          moviesToSeed = detailedMovies.filter(Boolean);
          if (moviesToSeed.length > 0) {
            tmdbSuccess = true;
            console.log(`Successfully fetched details for ${moviesToSeed.length} TMDB movies.`);
          }
        }
      } catch (tmdbError) {
        console.warn("Failed to fetch movies from TMDB API during seeding:", tmdbError.message);
      }
    }

    if (!tmdbSuccess) {
      console.log("Using fallback dummy movies for seeding...");
      moviesToSeed = dummyShowsData;
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
    const dates = [0, 1, 2]; // today, tomorrow, day after

    for (const offset of dates) {
      const showDate = new Date();
      showDate.setDate(baseDate.getDate() + offset);
      const dateString = showDate.toISOString().split("T")[0];

      moviesToSeed.forEach((movieData, movieIdx) => {
        let dateTime1, dateTime2;
        if (offset === 0) {
          dateTime1 = new Date(Date.now() + (2 + movieIdx) * 60 * 60 * 1000);
          dateTime2 = new Date(Date.now() + (6 + movieIdx) * 60 * 60 * 1000);
        } else {
          dateTime1 = new Date(`${dateString}T12:00:00.000Z`);
          dateTime1.setHours(dateTime1.getHours() + (movieIdx % 4));
          
          dateTime2 = new Date(`${dateString}T18:00:00.000Z`);
          dateTime2.setHours(dateTime2.getHours() + (movieIdx % 4));
        }

        showsToCreate.push({
          movie: movieData._id,
          showDatetime: dateTime1,
          showPrice: 10 + (movieIdx % 3) * 2,
          occupiedSeat: {}
        });

        showsToCreate.push({
          movie: movieData._id,
          showDatetime: dateTime2,
          showPrice: 10 + (movieIdx % 3) * 2,
          occupiedSeat: {}
        });
      });
    }

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
      console.log(`Successfully seeded ${showsToCreate.length} default shows!`);
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

