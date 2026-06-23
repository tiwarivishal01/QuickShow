import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/Admin/Title";
import { dummyShowsData } from "../../assets";
import { CheckIcon, StarIcon } from "lucide-react";
import { kConvertor } from "../../lib/kConvertor";
import { useAppContext } from "../../Context/AppContext";
import toast from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext()
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [showPrice, setShowPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [addingShow, setAddingShow] = useState(false);

  const fetchNowPlayingMovies = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/show/now-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.movies && data.movies.length > 0) {
        setNowPlayingMovies(data.movies);
      } else {
        // Use sample data without showing error
        console.log('Using sample movies data');
        setNowPlayingMovies(dummyShowsData);
      }
    } catch (error) {
      console.log('Using sample movies data due to API issue');
      // Use sample data without showing error
      setNowPlayingMovies(dummyShowsData);
    } finally {
      setIsLoading(false);
    }
  };

  // Add selected datetime to the list
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });

    setDateTimeInput(""); // clear input after adding
  };

  // Remove a specific time for a date
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);

      if (filteredTimes.length === 0) {
        // remove date key if no times left
        const { [date]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [date]: filteredTimes,
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);
  
      if (!selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
        toast.error('Please select a movie, date and time, and enter a show price');
        return;
      }
  
      const showsInput = Object.entries(dateTimeSelection).map(([date, times]) => ({ date, time: times }));
  
      const payload = {
        movieId: selectedMovie,
        showInput: showsInput,
        showPrice: Number(showPrice),
      };
  
      const { data } = await axios.post('/api/show/add', payload, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
  
      if (data.success) {
        toast.success(data.message || 'Show added successfully');
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice('');
        setDateTimeInput('');
        fetchNowPlayingMovies();
      } else {
        toast.error(data.message || 'Failed to add show');
      }
  
    } catch (error) {
      console.log('Error in adding show:', error);
      toast.error('An error occurred while adding show. Please try again.');
    } finally {
      setAddingShow(false);
    }
  };
  

useEffect(() => {
  if (user) {

    fetchNowPlayingMovies();
  }

}, [user]);

if (isLoading) {
  return <Loading what="Movies" />;
}

return nowPlayingMovies.length > 0 ? (
  <>
    <Title text1="add" text2="Shows" />
    <div className="mt-10 flex items-center gap-2">
      <p className="text-lg font-medium">Now Playing Movies</p>
      {nowPlayingMovies === dummyShowsData && (
        <span className="text-sm text-yellow-500 bg-yellow-100 px-2 py-1 rounded">
          Sample Data
        </span>
      )}
    </div>

    <div className="overflow-x-auto pb-4">
      <div className="group flex flex-col sm:flex-row justify-start items-start gap-4 mt-4 w-max">
        {nowPlayingMovies.map((movie) => (
          <div
            key={movie.id}
            className="relative max-w-[160px] cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300"
            onClick={() => setSelectedMovie(prev => prev === (movie._id || movie.id) ? null : (movie._id || movie.id))}
          >
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={(movie.poster_path || '').startsWith('http') ? movie.poster_path : `${image_base_url}${movie.poster_path || ''}`}
                alt={`Poster of ${movie.title}`}
                className="w-full object-cover brightness-90"
              />
              <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                <p className="flex items-center gap-1 text-gray-400">
                  <StarIcon className="w-4 h-4 text-primary fill-primary" />
                  {movie.vote_average.toFixed(1)}
                </p>
                <p className="text-gray-300">
                  {kConvertor(movie.vote_count)} Votes
                </p>
              </div>
            </div>
            {selectedMovie === (movie._id || movie.id) && (
              <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            )}
            <p className="font-medium truncate">{movie.title}</p>
            <p className="text-gray-400">{movie.release_date}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Show Price Input */}
    <div className="mt-8">
      <label className="block text-sm font-medium mb-2">Show Price</label>
      <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
        <p className="text-gray-400 text-sm">{currency}</p>
        <input
          min={0}
          type="number"
          value={showPrice}
          onChange={(e) => setShowPrice(e.target.value)}
          placeholder="Enter show price"
          className="outline-none"
        />
      </div>
    </div>

    {/* Date & Time Selection */}
    <div className="mt-8">
      <label className="block text-sm font-medium mb-2">
        Select Date & Time
      </label>
      <div className="inline-flex gap-2 border border-gray-600 p-1 pl-3 rounded-lg">
        <input
          type="datetime-local"
          value={dateTimeInput}
          onChange={(e) => setDateTimeInput(e.target.value)}
          className="border border-gray-600 rounded-md p-2 outline-none w-full sm:w-auto"
        />
        <button
          onClick={handleDateTimeAdd}
          className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
        >
          Add time
        </button>
      </div>
    </div>

    {Object.keys(dateTimeSelection).length > 0 && (
      <div className="mt-4 space-y-2">
        {Object.entries(dateTimeSelection).map(([date, times]) => (
          <div key={date}>
            <p className="font-medium">{date}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {times.map((time) => (
                <span
                  key={time}
                  className="bg-black text-white px-2 py-1 rounded flex items-center gap-1 border border-primary/20"
                >
                  {time}
                  <button
                    onClick={() => handleRemoveTime(date, time)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
    <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer">Add show</button>
  </>
) : (
  <div className="text-center py-8">
    <p className="text-gray-500">No movies available. Please try again later.</p>
  </div>
);
};

export default AddShows;
