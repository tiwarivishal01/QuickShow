import React from 'react';

const Loading = ({what ="favorite Movie"}) => {
  return (
    <div className="flex flex-col justify-center items-center h-[80vh] gap-4 text-gray-400">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-14 w-14 border-2 border-gray-500 border-t-primary"></div>

      {/* Text */}
      <p className="italic text-center text-sm md:text-base">
        Hold on tight... we’re fetching your {what} 🎬
      </p>
    </div>
  );
};

export default Loading;
