import React, { useEffect, useState } from "react";
import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  StarIcon,
  UserIcon,
} from "lucide-react";
import Loading from "../../components/Loading";
import Title from "../../components/Admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { DateFormate } from "../../lib/DateFormate";
import { useAppContext } from "../../Context/AppContext";
import toast from "react-hot-toast";

const DashBoard = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [DashBoardData, setDashBoardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
  });
  const [loading, setLoading] = useState(true);

  const DashBoardCards = [
    {
      title: "Total Bookings",
      value: DashBoardData.totalBookings || "0",
      icon: ChartLineIcon,
    },
    {
      title: "Total Revenue",
      value: `${currency}${DashBoardData.totalRevenue || "0"}`,
      icon: CircleDollarSignIcon,
    },
    {
      title: "Active Shows",
      value:
        Array.isArray(DashBoardData.activeShows) &&
        DashBoardData.activeShows.length
          ? DashBoardData.activeShows.length
          : "0",
      icon: PlayCircleIcon,
    },
    {
      title: "Total Users",
      value: DashBoardData.totalUser || "0",
      icon: UserIcon,
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message || "Failed to load dashboard");
      // Guard: filter out shows missing populated movie
      const activeShows = Array.isArray(data.dashboardData?.activeShows)
        ? data.dashboardData.activeShows.filter(s => !!s?.movie)
        : [];
      setDashBoardData({
        totalBookings: data.dashboardData?.totalBookings || 0,
        totalRevenue: data.dashboardData?.totalRevenue || 0,
        activeShows,
        totalUser: data.dashboardData?.totalUser || 0,
      });
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) return <Loading what="Dashboard" />;

  return (
    <div className="relative">
      <Title text1="Admin" text2="Dashboard" />
      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0" />
        <div className="flex flex-wrap gap-4 w-full">
          {DashBoardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full"
              >
                <div>
                  <h1 className="text-sm">{card.title}</h1>
                  <p className="text-xl font-medium mt-1">{card.value}</p>
                </div>
                <Icon className="w-6 h-6 text-primary" />
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-10 text-lg font-medium">Active Shows</p>
      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {Array.isArray(DashBoardData.activeShows) &&
        DashBoardData.activeShows.length > 0 ? (
          DashBoardData.activeShows
            .filter((show) => !!show?.movie)
            .map((show) => (
              <div
                key={show._id}
                className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300"
              >
                {show.movie?.poster_path ? (
                  <img
                    src={image_base_url + show.movie.poster_path}
                    alt={show.movie?.title || "Movie Poster"}
                    className="h-60 w-full object-cover"
                  />
                ) : (
                  <div className="h-60 w-full bg-gray-800 flex items-center justify-center text-sm text-gray-400">
                    No Poster
                  </div>
                )}
                <p className="font-medium p-2 truncate">
                  {show.movie?.title || "Untitled"}
                </p>
                <div className="flex items-center justify-between px-2">
                  <p className="text-lg font-medium">
                    {currency} {show.showPrice}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {show.movie?.vote_average
                      ? show.movie.vote_average.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
                <p className="px-2 pt-2 text-sm text-gray-500">
                  {DateFormate(show.showDatetime)}
                </p>
              </div>
            ))
        ) : (
          <p className="text-gray-400 text-sm">No active shows available.</p>
        )}
      </div>
    </div>
  );
};

export default DashBoard;
