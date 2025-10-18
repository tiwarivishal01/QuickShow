import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/show.js";

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY_HERE'}`,
        },
        timeout: 15000,
      }
    );

    res.json({ success: true, movies: data.results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies. " + error.message,
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
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTc5NGNkMDIzNGQ2ODU0MDYxOWQ1ZGFmZDYxZDYxYyIsIm5iZiI6MTc2MDc2ODQ2MS42MTUsInN1YiI6IjY4ZjMzMWNkNjc5YjM4NGEzODNlOTlhYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gedphSr6Tgk1Ex4p6XC6a0N-zgQc_gjMhIjgsN5oChE'}` },
            timeout: 15000,
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTc5NGNkMDIzNGQ2ODU0MDYxOWQ1ZGFmZDYxZDYxYyIsIm5iZiI6MTc2MDc2ODQ2MS42MTUsInN1YiI6IjY4ZjMzMWNkNjc5YjM4NGEzODNlOTlhYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gedphSr6Tgk1Ex4p6XC6a0N-zgQc_gjMhIjgsN5oChE'}` },
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
        genres: movieApiData.genres.map(genre => genre.name),
        casts: (movieCreditsData.cast || []).map(cast => cast.name),
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};
