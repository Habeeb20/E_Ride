// import { useState } from 'react';
// import axios from 'axios';
// import Autocomplete from 'react-google-autocomplete';
// import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

// const containerStyle = {
//   width: '100%',
//   height: '300px',
// };

// function Fare() {
//   // Separate state for pickup and destination
//   const [pickupAddress, setPickupAddress] = useState('');
//   const [pickupLatLng, setPickupLatLng] = useState(null);
//   const [destinationAddress, setDestinationAddress] = useState('');
//   const [destinationLatLng, setDestinationLatLng] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [fare, setFare] = useState(null);
//   const [directions, setDirections] = useState(null);

//   const googleMapsApiKey = "AIzaSyB58m9sAWsgdU4LjZO4ha9f8N11Px7aeps";

//   const calculateDistanceAndFare = async () => {
//     console.log('State before calculation:', {
//       pickupAddress,
//       destinationAddress,
//       pickupLatLng,
//       destinationLatLng,
//     });
//     if (!pickupAddress || !destinationAddress) {
//       alert('Please enter both pickup and destination addresses');
//       return;
//     }

//     try {
//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/fare/calculate-fare`, {
//         pickupAddress,
//         destinationAddress,
//       });
//       const { distance, fare } = response.data;
//       setDistance(distance);
//       setFare(fare);

//       const directionsService = new window.google.maps.DirectionsService();
//       directionsService.route(
//         {
//           origin: pickupLatLng,
//           destination: destinationLatLng,
//           travelMode: window.google.maps.TravelMode.DRIVING,
//         },
//         (result, status) => {
//           if (status === window.google.maps.DirectionsStatus.OK) {
//             setDirections(result);
//           } else {
//             console.error('Directions request failed:', status);
//           }
//         }
//       );
//     } catch (error) {
//       console.error('Error calculating fare:', error.response?.data || error);
//     }
//   };

//   return (
//     <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
//       <h3 className="text-2xl font-bold text-gray-900 mb-6">Book a Ride</h3>

//       <div className="space-y-6">
//         {/* Pickup Autocomplete */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
//           <Autocomplete
//             apiKey={googleMapsApiKey}
//             onPlaceSelected={(place) => {
//               console.log('Pickup Selected:', place);
//               if (place?.formatted_address && place.geometry?.location) {
//                 setPickupAddress(place.formatted_address);
//                 setPickupLatLng({
//                   lat: place.geometry.location.lat(),
//                   lng: place.geometry.location.lng(),
//                 });
//                 console.log('Pickup Updated:', {
//                   pickupAddress: place.formatted_address,
//                   pickupLatLng: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
//                 });
//               } else {
//                 console.error('Invalid pickup place object:', place);
//               }
//             }}
//             options={{
//               types: ['geocode'],
//               componentRestrictions: { country: 'ng' },
//             }}
//             value={pickupAddress} // Controlled input
//             onChange={(e) => setPickupAddress(e.target.value)} // Manual input fallback
//             className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//             placeholder="Enter pickup location"
//           />
//         </div>

//         {/* Destination Autocomplete */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
//           <Autocomplete
//             apiKey={googleMapsApiKey}
//             onPlaceSelected={(place) => {
//               console.log('Destination Selected:', place);
//               if (place?.formatted_address && place.geometry?.location) {
//                 setDestinationAddress(place.formatted_address);
//                 setDestinationLatLng({
//                   lat: place.geometry.location.lat(),
//                   lng: place.geometry.location.lng(),
//                 });
//                 console.log('Destination Updated:', {
//                   destinationAddress: place.formatted_address,
//                   destinationLatLng: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
//                 });
//               } else {
//                 console.error('Invalid destination place object:', place);
//               }
//             }}
//             options={{
//               types: ['geocode'],
//               componentRestrictions: { country: 'ng' },
//             }}
//             value={destinationAddress} // Controlled input
//             onChange={(e) => setDestinationAddress(e.target.value)} // Manual input fallback
//             className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//             placeholder="Enter destination"
//           />
//         </div>

//         {/* Calculate Button */}
//         <button
//           onClick={calculateDistanceAndFare}
//           className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
//         >
//           Calculate Fare & Show Route
//         </button>

//         {/* Display Distance and Fare */}
//         {distance && fare && (
//           <div className="text-gray-800">
//             <p>Distance: {distance} km</p>
//             <p>Estimated Fare: ₦{fare}</p>
//           </div>
//         )}

//         {/* Google Map */}
//         {pickupLatLng && destinationLatLng && (
//           <LoadScript googleMapsApiKey={googleMapsApiKey}>
//             <GoogleMap
//               mapContainerStyle={containerStyle}
//               center={pickupLatLng}
//               zoom={10}
//             >
//               <Marker position={pickupLatLng} label="Pickup" />
//               <Marker position={destinationLatLng} label="Destination" />
//               {directions && <DirectionsRenderer directions={directions} />}
//             </GoogleMap>
//           </LoadScript>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Fare;


































// import { useState } from 'react';
// import axios from 'axios';
// import Autocomplete from 'react-google-autocomplete';
// import { FaArrowLeft } from 'react-icons/fa';

// function Fare() {
//   const [pickupAddress, setPickupAddress] = useState('');
//   const [pickupLatLng, setPickupLatLng] = useState(null);
//   const [destinationAddress, setDestinationAddress] = useState('');
//   const [destinationLatLng, setDestinationLatLng] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [fare, setFare] = useState(null);
//   const [showMap, setShowMap] = useState(false);

//   const googleMapsApiKey = "AIzaSyB58m9sAWsgdU4LjZO4ha9f8N11Px7aeps";
//   const embedApiKey = "AIzaSyAq_rSHqPq1VKhMckXEt3PQGDzdFMAxicM";

//   const calculateDistanceAndFare = async () => {
//     console.log('State before calculation:', {
//       pickupAddress,
//       destinationAddress,
//       pickupLatLng,
//       destinationLatLng,
//     });
//     if (!pickupAddress || !destinationAddress) {
//       alert('Please enter both pickup and destination addresses');
//       return;
//     }

//     try {
//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/fare/calculate-fare`, {
//         pickupAddress,
//         destinationAddress,
//       });
//       const { distance, fare } = response.data;
//       setDistance(distance);
//       setFare(fare);
//       setShowMap(true);
//     } catch (error) {
//       console.error('Error calculating fare:', error.response?.data || error);
//     }
//   };

//   const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}&mode=driving`;

//   return (
//     <div className="min-h-screen bg-gradient-to-r from-green-800 to-customPink flex flex-col">
//       {/* Header */}
//       <header className="flex items-center justify-between p-4 text-white">
//         <div className="flex items-center space-x-2">
//           <button className="text-white">
//             <FaArrowLeft size={20} />
//           </button>
//           <h1 className="text-xl font-bold">Hey James</h1>
//         </div>
//         <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
//       </header>

//       {/* Main Content */}
//       <div className="flex flex-1 flex-col md:flex-row">
//         {/* Left Side: Form */}
//         <div className="md:w-1/3 p-4 flex flex-col justify-center">
//           <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
//             <h3 className="text-xl font-bold text-gray-900">Book a Ride</h3>

//             {/* Pickup Input */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
//               <Autocomplete
//                 apiKey={googleMapsApiKey}
//                 onPlaceSelected={(place) => {
//                   console.log('Pickup Selected:', place);
//                   if (place?.formatted_address && place.geometry?.location) {
//                     setPickupAddress(place.formatted_address);
//                     setPickupLatLng({
//                       lat: place.geometry.location.lat(),
//                       lng: place.geometry.location.lng(),
//                     });
//                   } else {
//                     console.error('Invalid pickup place object:', place);
//                   }
//                 }}
//                 options={{
//                   types: ['geocode'],
//                   componentRestrictions: { country: 'ng' },
//                 }}
//                 value={pickupAddress}
//                 onChange={(e) => {
//                   console.log('Pickup input changed:', e.target.value);
//                   setPickupAddress(e.target.value);
//                 }}
//                 className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                 placeholder="Enter pickup location"
//               />
//             </div>

//             {/* Destination Input */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Where to?</label>
//               <Autocomplete
//                 apiKey={googleMapsApiKey}
//                 onPlaceSelected={(place) => {
//                   console.log('Destination Selected:', place);
//                   if (place?.formatted_address && place.geometry?.location) {
//                     setDestinationAddress(place.formatted_address);
//                     setDestinationLatLng({
//                       lat: place.geometry.location.lat(),
//                       lng: place.geometry.location.lng(),
//                     });
//                   } else {
//                     console.error('Invalid destination place object:', place);
//                   }
//                 }}
//                 options={{
//                   types: ['geocode'],
//                   componentRestrictions: { country: 'ng' },
//                 }}
//                 value={destinationAddress}
//                 onChange={(e) => {
//                   console.log('Destination input changed:', e.target.value);
//                   setDestinationAddress(e.target.value);
//                 }}
//                 className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                 placeholder="Enter destination"
//               />
//             </div>

//             {/* Additional Options */}
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">Places around you</span>
//               <button className="text-sm text-purple-600 font-semibold">See all</button>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">Choose a purpose</span>
//               <button className="text-sm text-purple-600 font-semibold">See all</button>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">Shared ride</span>
//               <button className="text-sm text-purple-600 font-semibold">See all</button>
//             </div>

//             {/* Calculate Button */}
//             <button
//               onClick={calculateDistanceAndFare}
//               className="w-full py-3 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
//             >
//               CONTINUE
//             </button>

//             {/* Display Distance and Fare */}
//             {distance && fare && (
//               <div className="text-gray-800">
//                 <p>Distance: {distance} km</p>
//                 <p>Estimated Fare: ₦{fare}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Side: Map */}
//         <div className="md:w-2/3 p-4 flex-1">
//           {showMap && pickupAddress && destinationAddress ? (
//             <iframe
//               width="100%"
//               height="100%"
//               style={{ border: 0, borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
//               loading="lazy"
//               allowFullScreen
//               src={mapUrl}
//               onLoad={() => console.log('Iframe map loaded')}
//               onError={(error) => console.error('Error loading iframe map:', error)}
//             />
//           ) : (
//             <div className="h-full bg-gray-200 rounded-xl flex items-center justify-center">
//               <p className="text-gray-600">Select locations to view the map</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Fare;










// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import Autocomplete from 'react-google-autocomplete';
// import { FaArrowLeft } from 'react-icons/fa';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';

// function Fare() {
//   const [pickupAddress, setPickupAddress] = useState('');
//   const [pickupLatLng, setPickupLatLng] = useState(null);
//   const [destinationAddress, setDestinationAddress] = useState('');
//   const [destinationLatLng, setDestinationLatLng] = useState(null);
//   const [packageDescription, setPackageDescription] = useState('');
//   const [packagePicture, setPackagePicture] = useState(null);
//   const [packagePictureUrl, setPackagePictureUrl] = useState('');
//   const [distance, setDistance] = useState(null);
//   const [fare, setFare] = useState(null);
//   const [showMap, setShowMap] = useState(false);
//   const [rideStarted, setRideStarted] = useState(false);
//   const [rideProgress, setRideProgress] = useState(0);
//   const [rideStatus, setRideStatus] = useState('');
//   const [driverDetails, setDriverDetails] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [nearbyDrivers, setNearbyDrivers] = useState([]);
//   const [rideOption, setRideOption] = useState('economy');
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [paymentCompleted, setPaymentCompleted] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [rideHistory, setRideHistory] = useState([]);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [deliveryId, setDeliveryId] = useState(null);
//   const [rating, setRating] = useState(0);
//   const [review, setReview] = useState('');
//   const [passenger, setPassenger] = useState(null);
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const [showNotification, setShowNotification] = useState(false);
//   const [passengerId, setPassengerId] = useState('');
//   const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
//   const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

//   useEffect(() => {
//     const fetchMyProfile = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         console.log('No token found in localStorage');
//         setError('Please log in to access the dashboard');
//         toast.error('Please log in to access the dashboard', {
//           style: { background: '#F44336', color: 'white' },
//         });
//         navigate('/plogin');
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('Dashboard response:', response.data);
//         if (response.data.status) {
//           toast.success('Send your packages with ease', {
//             style: { background: '#4CAF50', color: 'white' },
//           });
//           setData(response.data);
//           setPassengerId(response.data._id);
//           setPassenger(response.data);
//           setShowNotification(true);
//           setTimeout(() => setShowNotification(false), 15000);
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch profile');
//         }
//       } catch (error) {
//         console.error('Fetch profile error:', error.response?.data || error.message);
//         const errorMessage = error.response?.data?.message || 'An error occurred while fetching profile';
//         setError(errorMessage);
//         toast.error(errorMessage, {
//           style: { background: '#F44336', color: 'white' },
//         });
//         if (error.response?.status === 401) {
//           localStorage.removeItem('token');
//           navigate('/plogin');
//         }
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMyProfile();
//   }, [navigate]);

//   // Fetch nearby drivers
//   useEffect(() => {
//     if (!pickupLatLng) return;

//     const fetchNearbyDrivers = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/nearby`);
//         setNearbyDrivers(response.data);
//       } catch (error) {
//         console.error('Error fetching nearby drivers:', error);
//       }
//     };
//     fetchNearbyDrivers();
//   }, [pickupLatLng]);

//   // Simulate driver movement
//   useEffect(() => {
//     if (!rideStarted || !deliveryId) return;

//     const interval = setInterval(() => {
//       setRideProgress((prev) => {
//         if (prev >= 100) {
//           clearInterval(interval);
//           setRideStatus('Delivery completed');
//           toast.success('Delivery completed');
//           axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`, { status: 'completed' });
//           return 100;
//         }

//         const newProgress = prev + 2;
//         if (newProgress < 50) {
//           setRideStatus('Driver is on the way');
//           if (newProgress === 2) toast.info('Driver is on the way');
//         } else if (newProgress === 50) {
//           setRideStatus('Driver has arrived at pickup');
//           toast.success('Driver has arrived at pickup');
//         } else {
//           setRideStatus('Delivery in progress');
//         }
//         return newProgress;
//       });
//     }, 500);

//     return () => clearInterval(interval);
//   }, [rideStarted, deliveryId]);

//   // Fetch ride history
//   useEffect(() => {
//     if (!passengerId) return;

//     const fetchRideHistory = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/passenger/${passengerId}`);
//         setRideHistory(response.data);
//       } catch (error) {
//         console.error('Error fetching ride history:', error);
//       }
//     };
//     fetchRideHistory();
//   }, [rideStatus, passengerId]);

//   const calculateDistanceAndFare = async () => {
//     if (!pickupAddress || !destinationAddress || !packageDescription) {
//       alert('Please enter pickup address, destination address, and package description');
//       return;
//     }

//     try {
//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/calculate-fare`, {
//         pickupAddress,
//         destinationAddress,
//       });
//       let { distance, price } = response.data;
//       setDistance(distance);

//       // Adjust price based on ride option
//       if (rideOption === 'premium') price *= 1.5;
//       if (rideOption === 'shared') price *= 0.7;
//       setFare(price);

//       // Simulate ETA (in a real app, calculate this using Directions API duration)
//       setEta('5 minutes');

//       setShowMap(true);
//     } catch (error) {
//         toast.error("error calculating fares", {
//             style:{backgroundColor: "red", color:"white"}
//         })
//       console.error('Error calculating fare:', error.response?.data || error);
//     }
//   };

//   const handlePackagePictureUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

//     try {
//       const response = await axios.post('https://api.cloudinary.com/v1_1/dc0poqt9l/image/upload', formData);
//       setPackagePictureUrl(response.data.secure_url);
//       setPackagePicture(file);
//     } catch (error) {
//       console.error('Error uploading package picture:', error);
//     }
//   };

//   const createDelivery = async () => {
//     try {
//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/create`, {
//         passengerId,
//         pickupAddress,
//         destinationAddress,
//         packageDescription,
//         packagePicture: packagePictureUrl,
//         distance,
//         price: fare,
//         rideOption,
//         paymentMethod,
//       });

//       const delivery = response.data;
//       setDeliveryId(delivery._id);

//       // Fetch driver details from the Profile schema
//       const driverResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/passengers/${delivery.driver}`);
//       const driver = driverResponse.data;
//       setDriverDetails({
//         name: driver.name,
//         car: `${driver.carDetails.model} ${driver.carDetails.product} (${driver.carDetails.year})`,
//         licensePlate: driver.carDetails.plateNumber,
//       });

//       setRideStarted(true);
//       axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${delivery._id}/status`, { status: 'accepted' });
//     } catch (error) {
//       console.error('Error creating delivery:', error.response?.data || error);
//     }
//   };

//   const sendChatMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/chat`, {
//         sender: 'passenger',
//         text: newMessage,
//       });
//       setChatMessages([...chatMessages, { sender: 'passenger', text: newMessage }]);
//       setTimeout(() => {
//         setChatMessages((prev) => [...prev, { sender: 'driver', text: 'Got it!' }]);
//       }, 1000);
//       setNewMessage('');
//     } catch (error) {
//       console.error('Error sending chat message:', error);
//     }
//   };

//   const submitRatingAndReview = async () => {
//     try {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/rate`, {
//         rating,
//         review,
//       });
//       toast.success('Rating and review submitted');
//     } catch (error) {
//       console.error('Error submitting rating/review:', error);
//     }
//   };

//   const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}&mode=driving`;

//   return (
//     <div className="h-full bg-gray-100 flex flex-col">
//       {/* Header */}
//       <header className="flex items-center justify-between p-4 bg-white shadow-md">
//         {/* <div className="flex items-center space-x-2">
//           <button className="text-gray-600 hover:text-gray-800" onClick={() => navigate(-1)}>
//             <FaArrowLeft size={20} />
//           </button>
      
//         </div> */}
//         <button onClick={() => setShowProfile(!showProfile)}>
//           <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
//             {passenger?.profilePicture && (
//               <img src={passenger.profilePicture} alt="Profile" className="w-full h-full object-cover" />
//             )}
//           </div>
//         </button>
//       </header>

//       {/* Profile and Ride History Modal */}
//       {showProfile && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
//             <button onClick={() => setShowProfile(false)} className="text-green-600 mb-4">
//               Close
//             </button>
//             <h2 className="text-xl font-bold mb-4">Profile</h2>
//             <p>Name: {passenger?.name || 'James'}</p>
//             <p>Email: {passenger?.userEmail || 'james@example.com'}</p>
//             <p>Phone: {passenger?.phoneNumber}</p>
//             <p>Location: {passenger?.location.state}, {passenger?.location.lga}</p>
//             {passenger?.question && <p>Status: {passenger.question}</p>}
//             {passenger?.schoolIdUrl && (
//               <p>
//                 School ID: <a href={passenger.schoolIdUrl} target="_blank" rel="noopener noreferrer">View</a>
//               </p>
//             )}
//             <h3 className="text-lg font-semibold mt-4">Delivery History</h3>
//             {rideHistory.length > 0 ? (
//               <ul className="space-y-2">
//                 {rideHistory.map((ride, index) => (
//                   <li key={index} className="border p-2 rounded-lg">
//                     <p>From: {ride.pickupAddress}</p>
//                     <p>To: {ride.destinationAddress}</p>
//                     <p>Package: {ride.packageDescription}</p>
//                     <p>Distance: {ride.distance} km</p>
//                     <p>Price: ₦{ride.price}</p>
//                     <p>Date: {new Date(ride.createdAt).toLocaleString()}</p>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p>No deliveries yet.</p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4  ">
//         {/* Left Side: Form */}
//         <div className="lg:w-[45%] w-full bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
//           <h3 className="text-lg font-bold text-gray-800 mb-4">Send a Package</h3>

//           {/* Pickup Input */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
//             <Autocomplete
//               apiKey={googleMapsApiKey}
//               onPlaceSelected={(place) => {
//                 console.log('Pickup Selected:', place);
//                 if (place?.formatted_address && place.geometry?.location) {
//                   setPickupAddress(place.formatted_address);
//                   setPickupLatLng({
//                     lat: place.geometry.location.lat(),
//                     lng: place.geometry.location.lng(),
//                   });
//                 } else {
//                   console.error('Invalid pickup place object:', place);
//                 }
//               }}
//               options={{
//                 types: ['geocode'],
//                 componentRestrictions: { country: 'ng' },
//               }}
//               value={pickupAddress}
//               onChange={(e) => {
//                 console.log('Pickup input changed:', e.target.value);
//                 setPickupAddress(e.target.value);
//               }}
//               className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//               placeholder="Enter pickup location"
//             />
//           </div>

//           {/* Destination Input */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
//             <Autocomplete
//               apiKey={googleMapsApiKey}
//               onPlaceSelected={(place) => {
//                 console.log('Destination Selected:', place);
//                 if (place?.formatted_address && place.geometry?.location) {
//                   setDestinationAddress(place.formatted_address);
//                   setDestinationLatLng({
//                     lat: place.geometry.location.lat(),
//                     lng: place.geometry.location.lng(),
//                   });
//                 } else {
//                   console.error('Invalid destination place object:', place);
//                 }
//               }}
//               options={{
//                 types: ['geocode'],
//                 componentRestrictions: { country: 'ng' },
//               }}
//               value={destinationAddress}
//               onChange={(e) => {
//                 console.log('Destination input changed:', e.target.value);
//                 setDestinationAddress(e.target.value);
//               }}
//               className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//               placeholder="Enter destination"
//             />
//           </div>

//           {/* Package Description */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Package Description</label>
//             <textarea
//               value={packageDescription}
//               onChange={(e) => setPackageDescription(e.target.value)}
//               className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//               placeholder="Describe the package (e.g., size, weight, contents)"
//               rows="3"
//             />
//           </div>

//           {/* Package Picture */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Package Picture (Optional)</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handlePackagePictureUpload}
//               className="w-full p-2 border border-gray-200 rounded-lg"
//             />
//             {packagePictureUrl && (
//               <img src={packagePictureUrl} alt="Package" className="mt-2 w-24 h-24 object-cover rounded-lg" />
//             )}
//           </div>

//           {/* Nearby Drivers */}
//           {nearbyDrivers.length > 0 && !rideStarted && (
//             <div className="mb-4">
//               <h4 className="text-sm font-medium text-gray-700 mb-1">Nearby Drivers</h4>
//               <ul className="space-y-1">
//                 {nearbyDrivers.map((driver, index) => (
//                   <li key={index} className="text-sm text-gray-600">
//                     {driver.name} - {driver.distance}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Ride Options */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
//             <select
//               value={rideOption}
//               onChange={(e) => setRideOption(e.target.value)}
//               className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//             >
//               <option value="economy">Economy</option>
//               <option value="premium">Premium</option>
//               <option value="shared">Shared Delivery</option>
//             </select>
//           </div>

//           {/* Payment Method */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//             >
//               <option value="cash">Cash</option>
//               <option value="card">Card</option>
//             </select>
//           </div>

//           {/* Calculate Button */}
//           <button
//             onClick={calculateDistanceAndFare}
//             className="w-full py-2 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
//           >
//             CONTINUE
//           </button>

//                {/* Display Distance and Price */}
//                {distance && fare && (
//             <div className="text-gray-800 mt-4">
//               <p>Distance: {distance} km</p>
//               <p>Estimated Price: <span className='font-bold text-green-800'>₦{fare}</span></p>
//             </div>
//           )}


//           {/* Start Delivery Button */}
//           {distance && fare && !rideStarted && (
//             <button
//               onClick={createDelivery}
//               className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all mt-2"
//             >
//               Start Delivery
//             </button>
//           )}

     
//           {/* Driver Details & ETA */}
//           {driverDetails && eta && rideStarted && (
//             <div className="text-gray-800 border-t pt-4 mt-4">
//               <h4 className="text-base font-semibold">Driver Details</h4>
//               <p>Name: {driverDetails.name}</p>
//               <p>Car: {driverDetails.car}</p>
//               <p>License Plate: {driverDetails.licensePlate}</p>
//               <p>ETA: {eta}</p>
//             </div>
//           )}

//           {/* Ride Status and Progress */}
//           {rideStarted && (
//             <div className="mt-4">
//               <h4 className="text-base font-semibold">Delivery Status: {rideStatus}</h4>
//               <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//                 <div
//                   className="bg-green-600 h-2 rounded-full"
//                   style={{ width: `${rideProgress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}

//           {/* Chat with Driver */}
//           {rideStarted && (
//             <div className="mt-4">
//               <h4 className="text-base font-semibold">Chat with Driver</h4>
//               <div className="border p-2 rounded-lg h-24 overflow-y-auto">
//                 {chatMessages.map((msg, index) => (
//                   <p key={index} className={msg.sender === 'passenger' ? 'text-right text-blue-600' : 'text-left text-gray-600'}>
//                     {msg.sender === 'passenger' ? 'You' : 'Driver'}: {msg.text}
//                   </p>
//                 ))}
//               </div>
//               <div className="flex mt-2">
//                 <input
//                   type="text"
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   className="flex-1 p-2 border rounded-lg"
//                   placeholder="Type a message..."
//                 />
//                 <button
//                   onClick={sendChatMessage}
//                   className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg"
//                 >
//                   Send
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Payment Confirmation */}
//           {rideStatus === 'Delivery completed' && !paymentCompleted && (
//             <div className="mt-4">
//               <button
//                 onClick={() => {
//                   setPaymentCompleted(true);
//                   toast.success(`Payment of ₦${fare} completed via ${paymentMethod}`);
//                 }}
//                 className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
//               >
//                 Complete Payment
//               </button>
//             </div>
//           )}
//           {paymentCompleted && (
//             <div className="text-green-600 mt-2">
//               <p>Payment completed successfully!</p>
//             </div>
//           )}

//           {/* Rate and Review Driver */}
//           {paymentCompleted && (
//             <div className="mt-4">
//               <h4 className="text-base font-semibold">Rate and Review Driver</h4>
//               <div className="flex items-center space-x-2">
//                 <label className="text-sm font-medium text-gray-700">Rating (1-5):</label>
//                 <input
//                   type="number"
//                   min="1"
//                   max="5"
//                   value={rating}
//                   onChange={(e) => setRating(Number(e.target.value))}
//                   className="w-16 p-2 border rounded-lg"
//                 />
//               </div>
//               <textarea
//                 value={review}
//                 onChange={(e) => setReview(e.target.value)}
//                 className="w-full p-2 border border-gray-200 rounded-lg mt-2"
//                 placeholder="Leave a review (optional)"
//                 rows="3"
//               />
//               <button
//                 onClick={submitRatingAndReview}
//                 className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
//               >
//                 Submit Rating
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Right Side: Map */}
//         <div className="lg:w-[55%] w-full h-96 lg:h-auto">
//           {showMap && pickupAddress && destinationAddress ? (
//             <iframe
//               width="100%"
//               height="100%"
//               style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
//               loading="lazy"
//               allowFullScreen
//               src={mapUrl}
//               onLoad={() => console.log('Iframe map loaded')}
//               onError={(error) => console.error('Error loading iframe map:', error)}
//             />
//           ) : (
//             <div className="h-full bg-gray-200 rounded-lg flex items-center justify-center">
//               <p className="text-gray-600">Select locations to view the map</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// }

// export default Fare;



































import { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function Fare() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  const [packageDescription, setPackageDescription] = useState('');
  const [packagePicture, setPackagePicture] = useState(null);
  const [packagePictureUrl, setPackagePictureUrl] = useState('');
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [rideProgress, setRideProgress] = useState(0);
  const [rideStatus, setRideStatus] = useState('');
  const [driverDetails, setDriverDetails] = useState(null);
  const [eta, setEta] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [rideOption, setRideOption] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [deliveryId, setDeliveryId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [passenger, setPassenger] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [passengerId, setPassengerId] = useState('');
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  useEffect(() => {
    const fetchMyProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        setError('Please log in to access the dashboard');
        toast.error('Please log in to access the dashboard', {
          style: { background: '#F44336', color: 'white' },
        });
        navigate('/plogin');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Dashboard response:', response.data);
        if (response.data.status) {
          toast.success('Send your packages with ease', {
            style: { background: '#4CAF50', color: 'white' },
          });
          setData(response.data);
          setPassengerId(response.data._id);
          setPassenger(response.data);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 15000);
        } else {
          throw new Error(response.data.message || 'Failed to fetch profile');
        }
      } catch (error) {
        console.error('Fetch profile error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'An error occurred while fetching profile';
        setError(errorMessage);
        toast.error(errorMessage, {
          style: { background: '#F44336', color: 'white' },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/plogin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [navigate]);

  // Fetch nearby drivers
  useEffect(() => {
    if (!pickupLatLng) return;

    const fetchNearbyDrivers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/nearby`);
        setNearbyDrivers(response.data);
      } catch (error) {
        console.error('Error fetching nearby drivers:', error);
      }
    };
    fetchNearbyDrivers();
  }, [pickupLatLng]);

  // Simulate driver movement
  useEffect(() => {
    if (!rideStarted || !deliveryId) return;

    const interval = setInterval(() => {
      setRideProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRideStatus('Delivery completed');
          toast.success('Delivery completed');
          axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`, { status: 'completed' });
          return 100;
        }

        const newProgress = prev + 2;
        if (newProgress < 50) {
          setRideStatus('Driver is on the way');
          if (newProgress === 2) toast.info('Driver is on the way');
        } else if (newProgress === 50) {
          setRideStatus('Driver has arrived at pickup');
          toast.success('Driver has arrived at pickup');
        } else {
          setRideStatus('Delivery in progress');
        }
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [rideStarted, deliveryId]);

  // Fetch ride history
  useEffect(() => {
    if (!passengerId) return;

    const fetchRideHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/passenger/${passengerId}`);
        setRideHistory(response.data);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      }
    };
    fetchRideHistory();
  }, [rideStatus, passengerId]);

  const calculateDistanceAndFare = async () => {
    if (!pickupAddress || !destinationAddress || !packageDescription) {
      alert('Please enter pickup address, destination address, and package description');
      return;
    }

    try {
      console.log('Sending request to calculate fare with:', { pickupAddress, destinationAddress, rideOption });
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/calculate-fare`, {
        pickupAddress,
        destinationAddress,
      });
      console.log('Calculate fare response:', response.data);
      
      let { distance, price } = response.data;
      setDistance(distance);

      // Adjust price based on ride option
      if (rideOption === 'premium') {
        price *= 1.5;
        console.log('Price adjusted for premium:', price);
      }
      if (rideOption === 'shared') {
        price *= 0.7;
        console.log('Price adjusted for shared:', price);
      }
      setFare(price);

      // Simulate ETA (in a real app, calculate this using Directions API duration)
      setEta('5 minutes');

      setShowMap(true);
    } catch (error) {
      toast.error("error calculating fares", {
        style: { backgroundColor: "red", color: "white" }
      });
      console.error('Error calculating fare:', error.response?.data || error);
      // Set default values to ensure the section is visible
      setDistance(0);
      setFare(0);
    }
  };

  const handlePackagePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/dc0poqt9l/image/upload', formData);
      setPackagePictureUrl(response.data.secure_url);
      setPackagePicture(file);
    } catch (error) {
      console.error('Error uploading package picture:', error);
    }
  };

  const createDelivery = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/create`, {
        passengerId,
        pickupAddress,
        destinationAddress,
        packageDescription,
        packagePicture: packagePictureUrl,
        distance,
        price: fare,
        rideOption,
        paymentMethod,
      });

      const delivery = response.data;
      setDeliveryId(delivery._id);

      // Fetch driver details from the Profile schema
      const driverResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/passengers/${delivery.driver}`);
      const driver = driverResponse.data;
      setDriverDetails({
        name: driver.name,
        car: `${driver.carDetails.model} ${driver.carDetails.product} (${driver.carDetails.year})`,
        licensePlate: driver.carDetails.plateNumber,
      });

      setRideStarted(true);
      axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${delivery._id}/status`, { status: 'accepted' });
    } catch (error) {
      console.error('Error creating delivery:', error.response?.data || error);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/chat`, {
        sender: 'passenger',
        text: newMessage,
      });
      setChatMessages([...chatMessages, { sender: 'passenger', text: newMessage }]);
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { sender: 'driver', text: 'Got it!' }]);
      }, 1000);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const submitRatingAndReview = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/rate`, {
        rating,
        review,
      });
      toast.success('Rating and review submitted');
    } catch (error) {
      console.error('Error submitting rating/review:', error);
    }
  };

  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}&mode=driving`;

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        {/* <div className="flex items-center space-x-2">
          <button className="text-gray-600 hover:text-gray-800" onClick={() => navigate(-1)}>
            <FaArrowLeft size={20} />
          </button>
      
        </div> */}
        <button onClick={() => setShowProfile(!showProfile)}>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            {passenger?.profilePicture && (
              <img src={passenger.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            )}
          </div>
        </button>
      </header>

      {/* Profile and Ride History Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowProfile(false)} className="text-green-600 mb-4">
              Close
            </button>
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <p>Name: {passenger?.name || 'James'}</p>
            <p>Email: {passenger?.userEmail || 'james@example.com'}</p>
            <p>Phone: {passenger?.phoneNumber}</p>
            <p>Location: {passenger?.location.state}, {passenger?.location.lga}</p>
            {passenger?.question && <p>Status: {passenger.question}</p>}
            {passenger?.schoolIdUrl && (
              <p>
                School ID: <a href={passenger.schoolIdUrl} target="_blank" rel="noopener noreferrer">View</a>
              </p>
            )}
            <h3 className="text-lg font-semibold mt-4">Delivery History</h3>
            {rideHistory.length > 0 ? (
              <ul className="space-y-2">
                {rideHistory.map((ride, index) => (
                  <li key={index} className="border p-2 rounded-lg">
                    <p>From: {ride.pickupAddress}</p>
                    <p>To: {ride.destinationAddress}</p>
                    <p>Package: {ride.packageDescription}</p>
                    <p>Distance: {ride.distance} km</p>
                    <p>Price: ₦{ride.price}</p>
                    <p>Date: {new Date(ride.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No deliveries yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4  ">
        {/* Left Side: Form */}
        <div className="lg:w-[45%] w-full bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Send a Package</h3>

          {/* Pickup Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
            <Autocomplete
              apiKey={googleMapsApiKey}
              onPlaceSelected={(place) => {
                console.log('Pickup Selected:', place);
                if (place?.formatted_address && place.geometry?.location) {
                  setPickupAddress(place.formatted_address);
                  setPickupLatLng({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                } else {
                  console.error('Invalid pickup place object:', place);
                }
              }}
              options={{
                types: ['geocode'],
                componentRestrictions: { country: 'ng' },
              }}
              value={pickupAddress}
              onChange={(e) => {
                console.log('Pickup input changed:', e.target.value);
                setPickupAddress(e.target.value);
              }}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter pickup location"
            />
          </div>

          {/* Destination Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
            <Autocomplete
              apiKey={googleMapsApiKey}
              onPlaceSelected={(place) => {
                console.log('Destination Selected:', place);
                if (place?.formatted_address && place.geometry?.location) {
                  setDestinationAddress(place.formatted_address);
                  setDestinationLatLng({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                } else {
                  console.error('Invalid destination place object:', place);
                }
              }}
              options={{
                types: ['geocode'],
                componentRestrictions: { country: 'ng' },
              }}
              value={destinationAddress}
              onChange={(e) => {
                console.log('Destination input changed:', e.target.value);
                setDestinationAddress(e.target.value);
              }}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter destination"
            />
          </div>

          {/* Package Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Description</label>
            <textarea
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe the package (e.g., size, weight, contents)"
              rows="3"
            />
          </div>

          {/* Package Picture */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Picture (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePackagePictureUpload}
              className="w-full p-2 border border-gray-200 rounded-lg"
            />
            {packagePictureUrl && (
              <img src={packagePictureUrl} alt="Package" className="mt-2 w-24 h-24 object-cover rounded-lg" />
            )}
          </div>

          {/* Nearby Drivers */}
          {nearbyDrivers.length > 0 && !rideStarted && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Nearby Drivers</h4>
              <ul className="space-y-1">
                {nearbyDrivers.map((driver, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {driver.name} - {driver.distance}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ride Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
            <select
              value={rideOption}
              onChange={(e) => setRideOption(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="economy">Economy</option>
              <option value="premium">Premium</option>
              <option value="shared">Shared Delivery</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateDistanceAndFare}
            className="w-full py-2 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
          >
            CONTINUE
          </button>

          {/* Display Distance and Price */}
          <div className="text-gray-800 mt-4">
            <p>Distance: {distance !== null ? `${distance} km` : 'Not calculated'}</p>
            <p>Estimated Price: <span className='font-bold text-green-800'>{fare !== null ? `₦${fare}` : 'Not calculated'}</span></p>
          </div>

          {/* Start Delivery Button */}
          {distance && fare && !rideStarted && (
            <button
              onClick={createDelivery}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all mt-2"
            >
              Start Delivery
            </button>
          )}

          {/* Driver Details & ETA */}
          {driverDetails && eta && rideStarted && (
            <div className="text-gray-800 border-t pt-4 mt-4">
              <h4 className="text-base font-semibold">Driver Details</h4>
              <p>Name: {driverDetails.name}</p>
              <p>Car: {driverDetails.car}</p>
              <p>License Plate: {driverDetails.licensePlate}</p>
              <p>ETA: {eta}</p>
            </div>
          )}

          {/* Ride Status and Progress */}
          {rideStarted && (
            <div className="mt-4">
              <h4 className="text-base font-semibold">Delivery Status: {rideStatus}</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${rideProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Chat with Driver */}
          {rideStarted && (
            <div className="mt-4">
              <h4 className="text-base font-semibold">Chat with Driver</h4>
              <div className="border p-2 rounded-lg h-24 overflow-y-auto">
                {chatMessages.map((msg, index) => (
                  <p key={index} className={msg.sender === 'passenger' ? 'text-right text-blue-600' : 'text-left text-gray-600'}>
                    {msg.sender === 'passenger' ? 'You' : 'Driver'}: {msg.text}
                  </p>
                ))}
              </div>
              <div className="flex mt-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendChatMessage}
                  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Payment Confirmation */}
          {rideStatus === 'Delivery completed' && !paymentCompleted && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setPaymentCompleted(true);
                  toast.success(`Payment of ₦${fare} completed via ${paymentMethod}`);
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Complete Payment
              </button>
            </div>
          )}
          {paymentCompleted && (
            <div className="text-green-600 mt-2">
              <p>Payment completed successfully!</p>
            </div>
          )}

          {/* Rate and Review Driver */}
          {paymentCompleted && (
            <div className="mt-4">
              <h4 className="text-base font-semibold">Rate and Review Driver</h4>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Rating (1-5):</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-16 p-2 border rounded-lg"
                />
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg mt-2"
                placeholder="Leave a review (optional)"
                rows="3"
              />
              <button
                onClick={submitRatingAndReview}
                className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Submit Rating
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {showMap && pickupAddress && destinationAddress ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
              onLoad={() => console.log('Iframe map loaded')}
              onError={(error) => console.error('Error loading iframe map:', error)}
            />
          ) : (
            <div className="h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-600">Select locations to view the map</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Fare;





























