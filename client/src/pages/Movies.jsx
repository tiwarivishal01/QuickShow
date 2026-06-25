import React, { useState } from "react";

import MovieCart from "../components/MovieCart";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../Context/AppContext";

const Movies = () => {
  const { shows } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 30;

  // Pagination indexing
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = shows.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(shows.length / moviesPerPage);

  return shows.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-lg font-medium my-4">Now Showing</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {currentMovies.map((movie, index) => (
          <MovieCart movie={movie} key={movie?._id || movie?.id || index} />
        ))}
      </div>

      {/* Pagination Controls */}
      {shows.length > moviesPerPage && (
        <div className="flex justify-center items-center gap-4 mt-20 text-gray-300">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((prev) => Math.max(prev - 1, 1));
              window.scrollTo(0, 0);
            }}
            className="px-6 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary transition rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
          >
            Previous
          </button>
          <span className="text-sm font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((prev) => Math.min(prev + 1, totalPages));
              window.scrollTo(0, 0);
            }}
            className="px-6 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary transition rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">No Movie available</h1>
    </div>
  );
};

export default Movies;
