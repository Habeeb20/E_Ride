import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const AvailableVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    duration: '',
    picture: '',
  });
  const [loading, setLoading] = useState(false); // For geocoding and submission
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rentals/vehicles/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVehicles(response.data);
      } catch (error) {
        toast.error('Failed to fetch vehicles');
      }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      setLoading(true);
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error('Failed to upload picture');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const { files } = e.target;
    if (files[0]) {
      const url = await uploadToCloudinary(files[0]);
      setFormData((prev) => ({ ...prev, picture: url }));
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'e_RideProject/1.0' } }
      );
      const data = response.data[0];
      if (!data) throw new Error('No coordinates found for this address');
      return { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
    } catch (error) {
      toast.error(`Geocoding failed: ${error.message}`);
      return { lat: 0, lng: 0 }; // Fallback coordinates
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Geocode pickup and destination addresses
      const pickupCoords = await geocodeAddress(formData.pickupAddress);
      const destCoords = await geocodeAddress(formData.destinationAddress);

      const rentalData = {
        vehicleId: selectedVehicle._id,
        pickupAddress: formData.pickupAddress,
        destinationAddress: formData.destinationAddress,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        destLat: destCoords.lat,
        destLng: destCoords.lng,
        duration: formData.duration,
        picture: formData.picture,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rentals/rentals`,
        rentalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Rental request sent successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Emit rental request via Socket.IO (optional, depending on backend)
      socket.emit('rentalRequest', {
        rental: response.data,
        renter: { /* Add renter details if needed */ },
      });

      setSelectedVehicle(null);
      setFormData({
        pickupAddress: '',
        destinationAddress: '',
        duration: '',
        picture: '',
      });
    } catch (error) {
      toast.error(error.response?.data.error || 'Failed to send rental request', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Vehicles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="bg-white p-4 rounded-lg shadow-md">
            <img src={vehicle.carPicture} alt={vehicle.type} className="w-full h-40 object-cover rounded" />
            <p className="mt-2 font-semibold">Type: {vehicle.type}</p>
            <p>
              Owner Picture:
              <div className="flex items-center space-x-4 mt-2">
                <img
                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                  src={vehicle.displayPicture || 'https://via.placeholder.com/150'}
                  alt={`${vehicle.ownerOfVehicle} Display`}
                />
                <button
                  onClick={() => window.open(vehicle.displayPicture || 'https://via.placeholder.com/150', '_blank')}
                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                >
                  View
                </button>
              </div>
            </p>
            <p>
              Car Document:
              <div className="flex items-center space-x-4 mt-2">
                <img
                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                  src={vehicle.carDocument || 'https://via.placeholder.com/150'}
                  alt={`${vehicle.ownerOfVehicle} Document`}
                />
                <button
                  onClick={() => window.open(vehicle.carDocument || 'https://via.placeholder.com/150', '_blank')}
                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                >
                  View
                </button>
              </div>
            </p>
            <p>Plate Number: {vehicle.plateNumber}</p>
            <p>Owner: {vehicle.ownerOfVehicle}</p>
            <p>Owner Email: {vehicle.owner?.email || 'N/A'}</p>
            <p>Phone Number: {vehicle?.ownerProfile?.phoneNumber || 'N/A'}</p>
            <p>Color: {vehicle.color}</p>
            <button
              onClick={() => setSelectedVehicle(vehicle)}
              className="mt-4 w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              Rent This Vehicle
            </button>
          </div>
        ))}
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Rent {selectedVehicle.type}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
                  Pickup Address
                </label>
                <input
                  id="pickupAddress"
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  placeholder="Enter Pickup Address"
                  className="w-full p-2 border rounded mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700">
                  Destination Address
                </label>
                <input
                  id="destinationAddress"
                  name="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={handleChange}
                  placeholder="Enter Destination Address"
                  className="w-full p-2 border rounded mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 2 days"
                  className="w-full p-2 border rounded mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="picture" className="block text-sm font-medium text-gray-700">
                  Upload your Picture
                </label>
                <input
                  id="picture"
                  type="file"
                  name="picture"
                  onChange={handleFileChange}
                  className="w-full p-2 mt-1"
                  disabled={loading}
                />
                {formData.picture && (
                  <img src={formData.picture} alt="Preview" className="w-20 h-20 object-cover mt-2" />
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className={`w-full bg-customPink text-white p-2 rounded flex items-center justify-center ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-full bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableVehicles;














// import { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import io from 'socket.io-client';
// import { LoadScript, Autocomplete } from '@react-google-maps/api';

// const socket = io(import.meta.env.VITE_BACKEND_URL);

// const libraries = ['places']; // Required for Autocomplete

// const AvailableVehicles = () => {
//   const [vehicles, setVehicles] = useState([]);
//   const [selectedVehicle, setSelectedVehicle] = useState(null);
//   const [formData, setFormData] = useState({
//     pickupAddress: '',
//     destinationAddress: '',
//     duration: '',
//     picture: '',
//     pickupLat: 0,
//     pickupLng: 0,
//     destLat: 0,
//     destLng: 0,
//   });
//   const [loading, setLoading] = useState(false);
//   const token = localStorage.getItem('token');

//   const pickupRef = useRef(null);
//   const destinationRef = useRef(null);

//   useEffect(() => {
//     const fetchVehicles = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rentals/vehicles/available`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setVehicles(response.data);
//       } catch (error) {
//         toast.error('Failed to fetch vehicles');
//       }
//     };
//     fetchVehicles();
//   }, []);

//   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//   const uploadToCloudinary = async (file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

//     try {
//       setLoading(true);
//       const response = await axios.post(
//         `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
//         formData
//       );
//       return response.data.secure_url;
//     } catch (error) {
//       toast.error('Failed to upload picture');
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileChange = async (e) => {
//     const { files } = e.target;
//     if (files[0]) {
//       const url = await uploadToCloudinary(files[0]);
//       setFormData((prev) => ({ ...prev, picture: url }));
//     }
//   };

//   const onPickupPlaceChanged = () => {
//     if (pickupRef.current) {
//       const place = pickupRef.current.getPlace();
//       if (place.geometry) {
//         setFormData((prev) => ({
//           ...prev,
//           pickupAddress: place.formatted_address,
//           pickupLat: place.geometry.location.lat(),
//           pickupLng: place.geometry.location.lng(),
//         }));
//       }
//     }
//   };

//   const onDestinationPlaceChanged = () => {
//     if (destinationRef.current) {
//       const place = destinationRef.current.getPlace();
//       if (place.geometry) {
//         setFormData((prev) => ({
//           ...prev,
//           destinationAddress: place.formatted_address,
//           destLat: place.geometry.location.lat(),
//           destLng: place.geometry.location.lng(),
//         }));
//       }
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const rentalData = {
//         vehicleId: selectedVehicle._id,
//         pickupAddress: formData.pickupAddress,
//         destinationAddress: formData.destinationAddress,
//         pickupLat: formData.pickupLat,
//         pickupLng: formData.pickupLng,
//         destLat: formData.destLat,
//         destLng: formData.destLng,
//         duration: formData.duration,
//         picture: formData.picture,
//       };

//       const response = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/rentals/rentals`,
//         rentalData,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       toast.success('Rental request sent successfully!', {
//         position: 'top-right',
//         autoClose: 3000,
//       });

//       socket.emit('rentalRequest', {
//         rental: response.data,
//         renter: {},
//       });

//       setSelectedVehicle(null);
//       setFormData({
//         pickupAddress: '',
//         destinationAddress: '',
//         duration: '',
//         picture: '',
//         pickupLat: 0,
//         pickupLng: 0,
//         destLat: 0,
//         destLng: 0,
//       });
//     } catch (error) {
//       toast.error(error.response?.data.error || 'Failed to send rental request', {
//         position: 'top-right',
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
//       <div className="p-6">
//         <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Vehicles</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {vehicles.map((vehicle) => (
//             <div key={vehicle._id} className="bg-white p-4 rounded-lg shadow-md">
//               <img src={vehicle.carPicture} alt={vehicle.type} className="w-full h-40 object-cover rounded" />
//               <p className="mt-2 font-semibold">Type: {vehicle.type}</p>
//               <p>
//                 Owner Picture:
//                 <div className="flex items-center space-x-4 mt-2">
//                   <img
//                     className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
//                     src={vehicle.displayPicture || 'https://via.placeholder.com/150'}
//                     alt={`${vehicle.ownerOfVehicle} Display`}
//                   />
//                   <button
//                     onClick={() => window.open(vehicle.displayPicture || 'https://via.placeholder.com/150', '_blank')}
//                     className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
//                   >
//                     View
//                   </button>
//                 </div>
//               </p>
//               <p>
//                 Car Document:
//                 <div className="flex items-center space-x-4 mt-2">
//                   <img
//                     className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
//                     src={vehicle.carDocument || 'https://via.placeholder.com/150'}
//                     alt={`${vehicle.ownerOfVehicle} Document`}
//                   />
//                   <button
//                     onClick={() => window.open(vehicle.carDocument || 'https://via.placeholder.com/150', '_blank')}
//                     className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
//                   >
//                     View
//                   </button>
//                 </div>
//               </p>
//               <p>Plate Number: {vehicle.plateNumber}</p>
//               <p>Owner: {vehicle.ownerOfVehicle}</p>
//               <p>Owner Email: {vehicle.owner?.email || 'N/A'}</p>
//               <p>Phone Number: {vehicle?.ownerProfile?.phoneNumber || 'N/A'}</p>
//               <p>Color: {vehicle.color}</p>
//               <button
//                 onClick={() => setSelectedVehicle(vehicle)}
//                 className="mt-4 w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
//               >
//                 Rent This Vehicle
//               </button>
//             </div>
//           ))}
//         </div>

//         {selectedVehicle && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//             <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
//               <h3 className="text-xl font-bold mb-4">Rent {selectedVehicle.type}</h3>
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
//                     Pickup Address
//                   </label>
//                   <Autocomplete
//                     onLoad={(autocomplete) => (pickupRef.current = autocomplete)}
//                     onPlaceChanged={onPickupPlaceChanged}
//                   >
//                     <input
//                       id="pickupAddress"
//                       name="pickupAddress"
//                       value={formData.pickupAddress}
//                       onChange={handleChange}
//                       placeholder="Enter Pickup Address"
//                       className="w-full p-2 border rounded mt-1"
//                       disabled={loading}
//                     />
//                   </Autocomplete>
//                 </div>
//                 <div>
//                   <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700">
//                     Destination Address
//                   </label>
//                   <Autocomplete
//                     onLoad={(autocomplete) => (destinationRef.current = autocomplete)}
//                     onPlaceChanged={onDestinationPlaceChanged}
//                   >
//                     <input
//                       id="destinationAddress"
//                       name="destinationAddress"
//                       value={formData.destinationAddress}
//                       onChange={handleChange}
//                       placeholder="Enter Destination Address"
//                       className="w-full p-2 border rounded mt-1"
//                       disabled={loading}
//                     />
//                   </Autocomplete>
//                 </div>
//                 <div>
//                   <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
//                     Duration
//                   </label>
//                   <input
//                     id="duration"
//                     name="duration"
//                     value={formData.duration}
//                     onChange={handleChange}
//                     placeholder="e.g., 2 days"
//                     className="w-full p-2 border rounded mt-1"
//                     disabled={loading}
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="picture" className="block text-sm font-medium text-gray-700">
//                     Upload your Picture
//                   </label>
//                   <input
//                     id="picture"
//                     type="file"
//                     name="picture"
//                     onChange={handleFileChange}
//                     className="w-full p-2 mt-1"
//                     disabled={loading}
//                   />
//                   {formData.picture && (
//                     <img src={formData.picture} alt="Preview" className="w-20 h-20 object-cover mt-2" />
//                   )}
//                 </div>
//                 <div className="flex space-x-4">
//                   <button
//                     type="submit"
//                     className={`w-full bg-customPink text-white p-2 rounded flex items-center justify-center ${
//                       loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
//                     }`}
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <svg
//                           className="animate-spin h-5 w-5 mr-2 text-white"
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                           ></path>
//                         </svg>
//                         Submitting...
//                       </>
//                     ) : (
//                       'Submit'
//                     )}
//                   </button>
//                   <button
//                     onClick={() => setSelectedVehicle(null)}
//                     className="w-full bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
//                     disabled={loading}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </LoadScript>
//   );
// };

// export default AvailableVehicles;