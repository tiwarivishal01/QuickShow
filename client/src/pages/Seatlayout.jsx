import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, dummyDateTimeData, dummyShowsData } from "../assets.js";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import IsoTimeFormate from "../lib/IsoTimeFormate.js";
import BlurCircle from "../components/BlurCircle.jsx";
import { toast } from "react-hot-toast";

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  const { id, date } = useParams();
  const [selectedSeats, setselectedSeats] = useState([]);
  const [selectedTime, setselectedTime] = useState(null);
  const [show, setshow] = useState(null);

  const navigate = useNavigate();

  const getshow = async () => {
    const showData = dummyShowsData.find((show) => show.id.toString() === id);
    if (showData) {
      setshow({
        movie: showData,
        dateTime: dummyDateTimeData,
      });
    } else {
      console.log("Show not found for id:", id);
    }
  };
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select a time first");
    }

    if (selectedSeats.length >= 5 && !selectedSeats.includes(seatId)) {
      return toast("You can only select 5 seats");
    }

    setselectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((saet) => saet !== seatId)
        : [...prev, seatId]
    );
  };

  const renderSeat = (row, count = 9) => (
    <div key={row} className="flex flex-wrap mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${
                selectedSeats.includes(seatId) && "bg-primary text-white"
              }`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    getshow();
  }, []);

  return show ? (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 mt:pt-50">
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {show.dateTime[date].map((item) => (
            <div
              key={item.time}
              onClick={() => setselectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                selectedTime?.time === item.time
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
        <button onClick={()=>navigate('/my-bookings')} className="flex items-center gap-1 mt-29 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95">
          Procees to checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4"/>
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
