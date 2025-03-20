import React, { useState } from "react";
import { FaFacebookF, FaGoogle, FaTwitter, FaUserCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // For notifications
import axios from "axios";
import Navbar from "../../component/Navbar";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("Sending registration request with:", { firstName, lastName, email, password });
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        firstName,
        lastName,
        email,
        password,
     
      }, 
      {headers:{'Content-Type': 'multipart/form-data' }});
      if (response.data.status) {
      
        localStorage.setItem("token", response.data.token);
      
        navigate(`/verifyemail?email=${encodeURIComponent(email)}`);
        toast.success("Registration successful! Redirecting to verify email...", {
          style: { background: "#4CAF50", color: "white" },
        });
      }
    } catch (err) {
      console.log(err);
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, {
        style: { background: "#F44336", color: "white" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = (provider) => {
    console.log(`Redirecting to ${provider} login...`);
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/${provider.toLowerCase()}`; // Direct social login redirect
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-white px-4 mt-5">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <div className="flex flex-col items-center mb-6">
          <FaUserCheck size={64} className="text-e-ride-purple mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Register</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
              required
            />
          </div>

       

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-customPink text-white font-semibold rounded-full hover:from-purple-600 hover:to-e-ride-purple focus:outline-none focus:ring-2 focus:ring-e-ride-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "REGISTER"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">or connect with</p>
          <div className="flex justify-center space-x-4 mt-2">
            <button
              onClick={() => handleSocialClick("google")}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <FaGoogle size={20} />
            </button>
            <button
              onClick={() => handleSocialClick("facebook")}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaFacebookF size={20} />
            </button>
            <button
              onClick={() => handleSocialClick("twitter")}
              className="p-2 bg-sky-400 text-white rounded-full hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <FaTwitter size={20} />
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/plogin" className="text-e-ride-purple hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
    </>
  
  );
};

export default Signup;




// import React, { useState } from "react";
// import { FaFacebookF, FaGoogle, FaTwitter, FaUserCheck } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import axios from "axios";

// const Signup = () => {
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [profilePicture, setProfilePicture] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     // Create FormData object for multipart/form-data
//     const formData = new FormData();
//     formData.append("firstName", firstName);
//     formData.append("lastName", lastName);
//     formData.append("email", email);
//     formData.append("password", password);
//     if (profilePicture) {
//       formData.append("profilePicture", profilePicture); // File object
//     } else {
//       setError("Profile picture is required");
//       setLoading(false);
//       toast.error("Profile picture is required", {
//         style: { background: "#F44336", color: "white" },
//       });
//       return;
//     }

//     try {
//       console.log("Sending registration request...");
//       const response = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       if (response.data.status) {
//         localStorage.setItem("token", response.data.token);
//         navigate(`/verifyemail?email=${encodeURIComponent(email)}`);
//         toast.success("Registration successful! Redirecting to verify email...", {
//           style: { background: "#4CAF50", color: "white" },
//         });
//       }
//     } catch (err) {
//       console.log(err);
//       const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
//       setError(errorMessage);
//       toast.error(errorMessage, {
//         style: { background: "#F44336", color: "white" },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSocialClick = (provider) => {
//     console.log(`Redirecting to ${provider} login...`);
//     window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/${provider.toLowerCase()}`;
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-white px-4">
//       <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
//         <div className="flex flex-col items-center mb-6">
//           <FaUserCheck size={64} className="text-e-ride-purple mb-2" />
//           <h1 className="text-2xl font-bold text-gray-800">Register</h1>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
//               First Name
//             </label>
//             <input
//               type="text"
//               id="firstName"
//               value={firstName}
//               onChange={(e) => setFirstName(e.target.value)}
//               placeholder="Enter your first name"
//               className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
//               Last Name
//             </label>
//             <input
//               type="text"
//               id="lastName"
//               value={lastName}
//               onChange={(e) => setLastName(e.target.value)}
//               placeholder="Enter your last name"
//               className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//               Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Enter your email"
//               className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               id="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter your password"
//               className="w-full p-3 border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple"
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
//               Profile Picture
//             </label>
//             <input
//               type="file"
//               id="profilePicture"
//               onChange={(e) => setProfilePicture(e.target.files[0])}
//                 className="block w-full text-sm text-gray-500"
//               required
//             />
//             {profilePicture && <p className="text-sm text-gray-600 mt-1">{profilePicture.name}</p>}
//           </div>

//           {error && <p className="text-red-500 text-sm">{error}</p>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-3 bg-gradient-to-r from-purple-500 to-e-ride-purple text-white font-semibold rounded-full hover:from-purple-600 hover:to-e-ride-purple focus:outline-none focus:ring-2 focus:ring-e-ride-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? "Registering..." : "REGISTER"}
//           </button>
//         </form>

//         <div className="mt-4 text-center">
//           <p className="text-sm text-gray-600">or connect with</p>
//           <div className="flex justify-center space-x-4 mt-2">
//             <button
//               onClick={() => handleSocialClick("google")}
//               className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
//             >
//               <FaGoogle size={20} />
//             </button>
//             <button
//               onClick={() => handleSocialClick("facebook")}
//               className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <FaFacebookF size={20} />
//             </button>
//             <button
//               onClick={() => handleSocialClick("twitter")}
//               className="p-2 bg-sky-400 text-white rounded-full hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
//             >
//               <FaTwitter size={20} />
//             </button>
//           </div>
//         </div>

//         <p className="mt-4 text-center text-sm text-gray-600">
//           Already have an account?{" "}
//           <a href="/plogin" className="text-e-ride-purple hover:underline">
//             Login
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Signup;