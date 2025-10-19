import React, { useEffect, useState } from "react";
import { dummyBookingData } from "../../assets";
import Loading from "../../components/Loading";
import Title from "../../components/Admin/Title";
import { DateFormate } from "../../lib/DateFormate";
import { useAppContext } from "../../Context/AppContext";

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const { axios, getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);


  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setBookings(data.bookings)

    } catch (error) {
      console.error(error)

    }
    setLoading(false)
  };
  useEffect(() => {
    if (user) {
      getAllBookings();

    }

  }, [user]);



  return !loading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden whitespace-nowrap">
          <thead>
            <tr className="bg-primary/20 text-lg text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((item, index) => (

              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-[180px] pl-5">{item.user.name}</td>
                <td className="p-2">{item.show.movie.title}</td>
                <td className="p-2">{DateFormate(item.show.showDateTime)}</td>
                <td className="p-2">{item.bookedSeats.join(", ")}</td>
                <td className="p-2">
                  {currency} {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading what="Booking details" />
  );
};

export default ListBookings;
