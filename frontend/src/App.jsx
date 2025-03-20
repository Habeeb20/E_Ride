import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import OnboardingScreen1 from "./pages/Onboarding/OnboardingScreen1";
import OnboardingScreen2 from "./pages/Onboarding/OnboardingScreen2";
import OnboardingScreen3 from "./pages/Onboarding/OnboardingScreen3";
import SignUp from "./pages/Auth/Signup";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Passenger/Dashboard";
import Login from "./pages/Auth/Login";
import EmailVerify from "./pages/Auth/verifyEmail";
import { Toaster } from "sonner";
import ProfileForm from "./pages/Auth/ProfileForm";
import FaceAuth from "./pages/Auth/FaceAuth";

// Custom PrivateRoute to check token in localStorage
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/plogin" state={{ from: location }} replace />;
  }

  return children;
};

// Custom EmailVerifyRoute to allow access without token for verification
const EmailVerifyRoute = () => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email");

  // Allow access to /verifyemail if there's an email query param (post-registration) or token exists
  if (email || token) {
    return <EmailVerify />;
  }

  // Redirect to login if no email query or token
  return <Navigate to="/plogin" replace />;
};

const App = () => {
  return (
    <Router>
      <Toaster />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/face-auth" element={<FaceAuth />} />
        <Route path="/onboarding1" element={<OnboardingScreen1 />} />
        <Route path="/onboarding2" element={<OnboardingScreen2 />} />
        <Route path="/onboarding3" element={<OnboardingScreen3 />} />
        <Route path="/pregister" element={<SignUp />} />
        <Route path="/plogin" element={<Login />} />
        <Route path="/verifyemail" element={<EmailVerifyRoute />} />
        <Route path="/profileform" element={<ProfileForm  />} /> 

    
        <Route
          path="/userdashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;












































