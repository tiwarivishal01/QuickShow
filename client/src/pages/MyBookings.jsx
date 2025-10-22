import React, { useEffect, useState } from "react";
import { dummyBookingData } from "../assets";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/TimeFormate";
import { DateFormate } from "../lib/DateFormate";
import { useAppContext } from "../Context/AppContext";

const MyBookings = () => {
  const {  axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    // // simulate fetching dummy data
    // setBookings(dummyBookingData || []);
    // setIsLoading(false);



    try{
      const {data} = await axios.get('/api/user/bookings',  { headers: { Authorization: `Bearer ${await getToken()}` } })

      if(data.success){
        setBookings(data.bookings)
      }

    }catch(error){
      console.log(error);
      
    }
    setIsLoading(false)
  };

  useEffect(() => {
    if(user){
       getMyBookings();
    }
   
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      {/* Background blur effects */}
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings?.length > 0 ? (
        bookings.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            {/* Movie Details */}
            <div className="flex flex-col md:flex-row">
              <img
                src={image_base_url + item.show?.movie?.poster_path}
                alt={item.show?.movie?.title || "Poster"}
                className="md:max-w-[180px] aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-base font-semibold">
                  {item.show?.movie?.title || "Untitled Movie"}
                </p>
                <p className="text-sm text-gray-400">
                  {item.show?.movie?.runtime
                    ? timeFormat(item.show.movie.runtime)
                    : "N/A"}
                </p>
                <p className="text-sm text-gray-400 mt-auto">
                  {item.show?.showDateTime
                    ? DateFormate(item.show.showDateTime)
                    : "Date not available"}
                </p>
              </div>
            </div>

            {/* Booking Info */}
            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex items-center gap-4 mb-3">
                <p className="text-2xl font-semibold">
                  {currency}
                  {item.amount || 0}
                </p>
                {!item.isPaid && (
                  <button className="bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer hover:bg-primary/80 transition">
                    Pay Now
                  </button>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-400">Total Tickets: </span>
                  {item.bookedSeat?.length || 0}
                </p>
                <p>
                  <span className="text-gray-400">Seat Numbers: </span>
                  {item.bookedSeats?.join(", ") || "N/A"}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default MyBookings;
