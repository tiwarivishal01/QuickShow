import React, { useState } from "react";
import BlurCircle from "./BlurCircle";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const DateSelect = ({ dateTime, id }) => {
  if (!dateTime) return null;

  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

const onBookHandler = () => {
  if (!selected) {
    return toast('Please select a date');
  }
  navigate(`/movies/${id}/${selected}`);
  window.scrollTo(0, 0);
};


  return (
    <div id="dateSelect" className="pt-30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />

        {/* Date Picker */}
        <div className="flex flex-col md:flex-1">
          <p className="text-lg font-semibold">Choose Date</p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronsLeftIcon width={28} className="cursor-pointer" />

            {/* Scrollable date row */}
            <div className="flex overflow-x-auto w-max gap-4 no-scrollbar">
              {Object.keys(dateTime).map((date) => (
                <button
                  onClick={() => setSelected(date)}
                  key={date}
                  className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer text-white hover:bg-gray-700 transition ${
                    selected === date
                      ? "bg-primary text-white"
                      : "border border-primary/70"
                  }`}
                >
                  <span className="font-semibold">{new Date(date).getDate()}</span>
                  <span className="text-xs">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                </button>
              ))}
            </div>

            <ChevronsRightIcon width={28} className="cursor-pointer" />
          </div>
        </div>

        {/* Book Now button */}
        <button
          onClick={onBookHandler}
          className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
