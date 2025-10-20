import React, { useEffect } from "react";
import MovieCart from "../components/MovieCart";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../Context/AppContext";
import toast from "react-hot-toast";

const Favorite = () => {
  const { favoritesMovies = [] } = useAppContext();

  // Show toast if no favorite movies
  useEffect(() => {
    if (favoritesMovies.length === 0) {
      toast.error("Please add some movies ad favorites.");
    }
  }, [favoritesMovies]);

  return favoritesMovies.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-lg font-medium my-4">Your Favorite Movies</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {favoritesMovies.map((movie) => (
          <MovieCart movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">
        No movies available.
      </h1>
    </div>
  );
};

export default Favorite;
