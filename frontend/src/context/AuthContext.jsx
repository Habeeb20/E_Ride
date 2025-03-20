import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const setAuth = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(!!userData && userData.isVerified);
    document.cookie = `token=${token}; path=/; secure; samesite=strict`;
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/plogin");
  };

  const getToken = () => {
    const name = "token=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Sending registration request with:", userData);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, userData, {
        withCredentials: true,
      });
      navigate('/verifyemail');
      setUser(response.data.user); 

      document.cookie = `token=${response.data.token}; path=/; secure; samesite=strict`; 
      
      navigate(`/verifyemail?email=${encodeURIComponent(userData.email)}`); 
      return response.data;
    } catch (err) {
      console.log("Registration Error in AuthContext:", err);
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Sending login request with:", credentials);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, credentials, {
        withCredentials: true,
      });
      setAuth(response.data.user, response.data.token);
      navigate("/userdashboard");
      return response.data;
    } catch (err) {
      console.log("Login Error in AuthContext:", err);
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    toast.success("Logged out successfully!", {
      style: { background: "#4CAF50", color: "white" },
    });
  };

  const handleSocialLogin = (provider) => {
    console.log(`Redirecting to ${provider} OAuth...`);
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/${provider.toLowerCase()}`; // Updated to match route
  };

  const verifyEmail = async (email, code) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Verifying email with:", { email, code });
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`, { email, code }, {
        withCredentials: true,
      });
      if (response.data.success) {
        setAuth(response.data.user, response.data.token);
        navigate("/userdashboard"); 
        toast.success("Email verified successfully! Redirecting to dashboard...", {
          style: { background: "#4CAF50", color: "white" },
        });
        return response.data;
      } else {
        throw new Error(response.data.message || "Email verification failed");
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setError(err.message || "Failed to verify email. Please try again.");
      toast.error(err.message || "Failed to verify email. Please try again.", {
        style: { background: "#F44336", color: "white" },
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const currentPath = window.location.pathname;

    console.log("Session check - URL Params:", urlParams.toString());
    console.log("Current Path:", currentPath);
    console.log("Session check - Cookie Token:", getToken());

    if (currentPath === "/verifyemail") {
   
      console.log("Skipping session check on /verifyemail");
      setIsAuthenticated(false);
      setUser(null); 
      return;
    }

    if (token) {
      console.log("Social login callback with token:", token);
      setLoading(true);
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((response) => {
          console.log("Dashboard response:", response.data);
          setAuth(response.data.user, token);
          navigate("/userdashboard");
          toast.success("Social login successful! Redirecting to dashboard...", {
            style: { background: "#4CAF50", color: "white" },
          });
        })
        .catch((err) => {
          console.error("Social login error:", err);
          toast.error("Social login failed. Please try again.", {
            style: { background: "#F44336", color: "white" },
          });
          navigate("/plogin");
        })
        .finally(() => setLoading(false));
    } else {
      const cookieToken = getToken();
      if (cookieToken) {
        console.log("Checking session with cookie token:", cookieToken);
        setLoading(true);
        axios
          .get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
            headers: { Authorization: `Bearer ${cookieToken}` },
            withCredentials: true,
          })
          .then((response) => {
            console.log("Dashboard response from cookie:", response.data);
            setAuth(response.data.user, cookieToken);
          })
          .catch((err) => {
            console.error("Session check error:", err);
            setIsAuthenticated(false);
            setUser(null);
          })
          .finally(() => setLoading(false));
      } else {
        console.log("No token found in URL or cookies");
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  }, [navigate]);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    handleSocialLogin,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};