import axios from "axios";
import Movie from "../models/Movie";

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies. " + error.message,
    });
  }
};

//api to add a new shw to the db


export const addShow = async (req, res) => {
  try {

    const { movieId, showInput, showPrice } = req.body;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      //fetch movie details and cresitds from tmdb api
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
          timeout: 15000,
        }),


        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
          timeout: 15000,
        })


      ])

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
        genres: movieApiData.genres,
        casts: movieApiData.casts,
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,

      }
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies. " + error.message,
    });
  }

}