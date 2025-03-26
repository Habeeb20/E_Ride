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

import { useState } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft } from 'react-icons/fa';

function Fare() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const googleMapsApiKey = "AIzaSyB58m9sAWsgdU4LjZO4ha9f8N11Px7aeps";
  const embedApiKey = "AIzaSyAq_rSHqPq1VKhMckXEt3PQGDzdFMAxicM";

  const calculateDistanceAndFare = async () => {
    console.log('State before calculation:', {
      pickupAddress,
      destinationAddress,
      pickupLatLng,
      destinationLatLng,
    });
    if (!pickupAddress || !destinationAddress) {
      alert('Please enter both pickup and destination addresses');
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/fare/calculate-fare`, {
        pickupAddress,
        destinationAddress,
      });
      const { distance, fare } = response.data;
      setDistance(distance);
      setFare(fare);
      setShowMap(true);
    } catch (error) {
      console.error('Error calculating fare:', error.response?.data || error);
    }
  };

  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}&mode=driving`;

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-800 to-customPink flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center space-x-2">
          <button className="text-white">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Hey James</h1>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Side: Form */}
        <div className="md:w-1/3 p-4 flex flex-col justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Book a Ride</h3>

            {/* Pickup Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
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
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter pickup location"
              />
            </div>

            {/* Destination Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Where to?</label>
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
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter destination"
              />
            </div>

            {/* Additional Options */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Places around you</span>
              <button className="text-sm text-purple-600 font-semibold">See all</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Choose a purpose</span>
              <button className="text-sm text-purple-600 font-semibold">See all</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Shared ride</span>
              <button className="text-sm text-purple-600 font-semibold">See all</button>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateDistanceAndFare}
              className="w-full py-3 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
            >
              CONTINUE
            </button>

            {/* Display Distance and Fare */}
            {distance && fare && (
              <div className="text-gray-800">
                <p>Distance: {distance} km</p>
                <p>Estimated Fare: ₦{fare}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="md:w-2/3 p-4 flex-1">
          {showMap && pickupAddress && destinationAddress ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
              onLoad={() => console.log('Iframe map loaded')}
              onError={(error) => console.error('Error loading iframe map:', error)}
            />
          ) : (
            <div className="h-full bg-gray-200 rounded-xl flex items-center justify-center">
              <p className="text-gray-600">Select locations to view the map</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Fare;