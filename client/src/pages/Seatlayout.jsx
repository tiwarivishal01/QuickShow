import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, dummyDateTimeData, dummyShowsData } from "../assets.js";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import IsoTimeFormate from "../lib/IsoTimeFormate.js";
import BlurCircle from "../components/BlurCircle.jsx";
import { toast } from "react-hot-toast";
import { useAppContext } from "../Context/AppContext.jsx";

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];
  const { axios, getToken, user } = useAppContext();

  const { id, date } = useParams();
  const [selectedSeats, setselectedSeats] = useState([]);
  const [selectedTime, setselectedTime] = useState(null);
  const [show, setshow] = useState(null);
  const [occupiedSeat, setOccupiedSeats] = useState([])
  const [isBooking, setIsBooking] = useState(false)

  const navigate = useNavigate();

  const getshow = async () => {
    try {
      const { data } = await axios.get(`/api/show/movie/${id}`)

      if (data.success) {
        setshow(data)
      }

    } catch (error) {
      console.log(error);

    }
  };
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select a time first");
    }

    if (selectedSeats.length >= 5 && !selectedSeats.includes(seatId)) {
      return toast("You can only select 5 seats");
    }

    if(occupiedSeat.includes(seatId)){
      return toast('This seat is already booked.')
    }

    setselectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const getOccupiedSeat = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if (data.success) {

        setOccupiedSeats(data.occupiedSeats)

      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error);

    }
  }

  const bookTickets = async () =>{
    try{
      if(isBooking) return;
      if(!user) return toast.error('Please login to proceed.')

        if(!selectedTime) return toast.error('Please select a time.')
        if(!selectedSeats || ! selectedSeats.length) return toast.error('Please select seats.')
        
          setIsBooking(true)
          
          // Get token with error handling
          const token = await getToken();
          if (!token) {
            toast.error('Authentication failed. Please login again.');
            return;
          }
          
          const {data} = await axios.post('/api/booking/create-booking', {
            showId: selectedTime.showId, 
            selectedSeats
          }, { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          })
          
          if(data && data.success){
            if(data.url) {
              window.location.href = data.url;
            } else {
              toast.success('Booking successful!');
              navigate('/my-bookings');
            }
          }else{
            toast.error(data?.message || 'Booking failed. Please try again.')
          }

    }catch(error){
      console.log('Booking error:', error);
      console.log('Error response:', error?.response?.data);
      console.log('Error status:', error?.response?.status);
      
      const serverMessage = error?.response?.data?.message;
      if(serverMessage){
        toast.error(serverMessage)
      }else if(error?.response?.status === 401){
        toast.error('Authentication failed. Please login again.')
      }else if(error?.response?.status === 500){
        toast.error('Server error. Please try again later.')
      }else{
        toast.error('Something went wrong while booking. Please try again.')
      }
    } finally {
      setIsBooking(false)
    }
  }

  useEffect(() => {
    getshow();
  }, []);

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeat()
    }

  }, [selectedTime])




  const renderSeat = (row, count = 9) => (
    <div key={row} className="flex flex-wrap mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border border-primary/60 cursor-pointer
                 ${selectedSeats.includes(seatId) && "bg-primary text-white"
                } ${occupiedSeat.includes(seatId) && 'opacity-50'}`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );



  return show ? (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 mt:pt-50">
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {show.dateTime[date].map((item) => (
            <div
              key={item.time}
              onClick={() => setselectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${selectedTime?.time === item.time
                  ? "bg-primary text-white"
                  : "hover:bg-primary/20"
                }
        }`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{IsoTimeFormate(item.time)}</p>
            </div>
          ))}
        </div>
      </div>
      {/* seat layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className="text-2xl font-semibold mb-4">Select Your Seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p>SCREEN SIDE</p>
        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
          <div>{groupRows[0].map((row) => renderSeat(row))}</div>

          <div className="grid grid-cols-2 mt-5 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>{group.map((row) => renderSeat(row))}</div>
            ))}
          </div>
        </div>
        <button onClick={bookTickets} disabled={isBooking} className={`flex items-center gap-1 mt-29 px-10 py-3 text-sm transition rounded-full font-medium cursor-pointer active:scale-95 ${isBooking ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-primary-dull'}`}>
          Procees to checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
