import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Seatlayout from "./pages/Seatlayout";
import MyBooking from "./pages/MyBookings";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Favorite from "./pages/Favorite";
import DashBoard from "./pages/Admin/DashBoard";
import AddShows from "./pages/Admin/AddShows";
import ListShows from "./pages/Admin/ListShows";
import ListBookings from "./pages/Admin/ListBookings";
import Layout from "./pages/Admin/Layout";

function App() {
  const isAdminRoute = useLocation().pathname.startsWith("/admin");

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<Seatlayout />} />

        <Route path="/my-bookings" element={<MyBooking />} />
        <Route path="/favorites" element={<Favorite />} />
        <Route path="/admin/*" element={<Layout />}>
          <Route index element={<DashBoard />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookings />} />
        </Route>
      </Routes> 
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default App;
