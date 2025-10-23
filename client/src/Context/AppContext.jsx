import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; 

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoritesMovies, setFavoritesMovies] = useState([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const isAdminUser = data.success ? data.isAdmin : false;
      setIsAdmin(isAdminUser);
      
      if (!isAdminUser && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("Access Denied! Admin privileges required.");
      }
    } catch (error) {
      setIsAdmin(false);
      if (location.pathname.startsWith("/admin")) {
        toast.error("Access Denied! Admin privileges required.");
        navigate("/");
      }
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");
      if (data.success) {
        const validShows = (data.shows || []).filter(show => show && (show._id || show.id));
        setShows(validShows);
      } else {
        toast.error(data.message || "Failed to fetch shows");
        setShows([]);
      }
    } catch (error) {
      setShows([]);
      toast.error("Failed to load shows. Please check your connection.");
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/favorite", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFavoritesMovies(data.movies || []);
      } else {
        toast.error(data.message || "Failed to fetch favorites");
        setFavoritesMovies([]);
      }
    } catch (error) {
      setFavoritesMovies([]);
      if (error.response?.status === 401) {
        toast.error("Please log in to view favorites");
      } else if (error.response?.status === 404) {
        // Silently handle missing endpoint
      } else {
        toast.error("Failed to load favorites");
      }
    }
  };

  useEffect(() => {
    fetchShows();
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    fetchShows,
    fetchFavoriteMovies,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoritesMovies,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
