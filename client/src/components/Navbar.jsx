import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../Context/AppContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const { favoritesMovies = [] } = useAppContext();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      {/* Logo */}
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      {/* Navigation Links */}
      <div
        className={`
    flex flex-col md:flex-row items-center gap-8 px-10 py-3
    md:py-3 md:px-6
    max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg max-md:justify-center max-md:h-screen
    max-md:overflow-hidden max-md:transition-all max-md:duration-300
    min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20
    ${isOpen ? "max-md:w-full" : "max-md:hidden"}
  `}
      >
        {/* Close icon (mobile only) */}
        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />

        {/* Nav Links */}
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Theaters
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Releases
        </Link>
        {favoritesMovies.length > 0 && (
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favorites"
          >
            Favorites
          </Link>
        )}

      </div>

      {/* Search + Login */}
      <div className="flex items-center gap-8">
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />
        {!user ? (
          <button
            onClick={openSignIn}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      {/* Hamburger menu (mobile only) */}
      <MenuIcon
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-8 h-8 cursor-pointer"
      />
    </div>
  );
}

export default Navbar;
