import { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Load Google Maps script dynamically
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      console.log('Script already in DOM, waiting for load');
      document.getElementById(scriptId).addEventListener('load', resolve);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

function CarTracker() {
  const [startLocation, setStartLocation] = useState('Ikeja, Lagos, Nigeria'); // More specific
  const [endLocation, setEndLocation] = useState('Garki, Abuja, Nigeria'); // More specific
  const [carPosition, setCarPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const carMarkerRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePathRef = useRef(null);

  const token = localStorage.getItem("token");
  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    autoConnect: false,
  });

  // Initialize map and socket
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!googleMapRef.current && mapRef.current) {
          googleMapRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: 6.5244, lng: 3.3792 },
            zoom: 6,
            mapTypeId: 'roadmap',
          });
          directionsServiceRef.current = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: googleMapRef.current,
            suppressMarkers: true,
          });
          setMapLoaded(true);
          console.log('Map initialized');
          plotRoute(startLocation, endLocation);
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        toast.error('Failed to load map. Check API key or network.');
      });

    if (token) {
      socket.connect();
      socket.on('connect', () => console.log('Socket connected:', socket.id));
      socket.on('driverLocationUpdate', ({ lat, lng }) => {
        console.log('Received driver location:', { lat, lng });
        updateCarPosition({ lat, lng });
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Plot route when locations or mapLoaded change
  useEffect(() => {
    if (mapLoaded && startLocation && endLocation) {
      plotRoute(startLocation, endLocation);
    }
  }, [startLocation, endLocation, mapLoaded]);

  // Plot route with detailed debugging
  const plotRoute = (start, end) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      console.error('Directions service not initialized');
      return;
    }

    console.log('Attempting to plot route from:', start, 'to:', end);
    directionsServiceRef.current.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.log('Directions API response:', { status, result });
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0].overview_path;
          routePathRef.current = route;

          new window.google.maps.Marker({
            position: route[0],
            map: googleMapRef.current,
            label: 'S',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' },
          });
          new window.google.maps.Marker({
            position: route[route.length - 1],
            map: googleMapRef.current,
            label: 'E',
            icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
          });

          setCarPosition({ lat: route[0].lat(), lng: route[0].lng() });
          console.log('Route plotted successfully:', route);
        } else {
          console.error('Directions request failed with status:', status);
          toast.error(`Failed to plot route: ${status}`);
          // Test with coordinates if address fails
          console.log('Retrying with coordinates...');
          directionsServiceRef.current.route(
            {
              origin: { lat: 6.6018, lng: 3.3515 }, // Ikeja, Lagos
              destination: { lat: 9.0579, lng: 7.4951 }, // Garki, Abuja
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (coordResult, coordStatus) => {
              console.log('Coordinate-based route response:', { coordStatus, coordResult });
              if (coordStatus === window.google.maps.DirectionsStatus.OK) {
                directionsRendererRef.current.setDirections(coordResult);
                const route = coordResult.routes[0].overview_path;
                routePathRef.current = route;
                setCarPosition({ lat: route[0].lat(), lng: route[0].lng() });
                console.log('Route plotted with coordinates successfully');
                toast.success('Route plotted using coordinates');
              } else {
                console.error('Coordinate route failed with status:', coordStatus);
                toast.error(`Coordinate route failed: ${coordStatus}`);
              }
            }
          );
        }
      }
    );
  };

  // Update car marker position
  const updateCarPosition = (position) => {
    if (googleMapRef.current && position) {
      if (!carMarkerRef.current) {
        carMarkerRef.current = new window.google.maps.Marker({
          position,
          map: googleMapRef.current,
          icon: {
            url: 'https://cdn-icons-png.flaticon.com/512/0/11.png',
            scaledSize: new window.google.maps.Size(32, 32),
          },
          title: 'Car',
        });
      } else {
        carMarkerRef.current.setPosition(position);
      }
      googleMapRef.current.panTo(position);
      setCarPosition(position);
      console.log('Car position updated:', position);
    }
  };

  // Simulate car movement
  const startTracking = () => {
    if (!routePathRef.current || isTracking) return;
    setIsTracking(true);

    let index = 0;
    const interval = setInterval(() => {
      if (index < routePathRef.current.length) {
        const nextPosition = {
          lat: routePathRef.current[index].lat(),
          lng: routePathRef.current[index].lng(),
        };
        updateCarPosition(nextPosition);
        index++;
      } else {
        clearInterval(interval);
        setIsTracking(false);
        toast.success('Car reached destination');
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const toggleTracking = () => {
    if (!isTracking) {
      startTracking();
      toast.info('Tracking started');
    } else {
      setIsTracking(false);
      toast.info('Tracking paused');
    }
  };

  const handleRouteChange = () => {
    if (startLocation && endLocation) {
      plotRoute(startLocation, endLocation);
      setCarPosition(null);
      setIsTracking(false);
      if (carMarkerRef.current) {
        carMarkerRef.current.setMap(null);
        carMarkerRef.current = null;
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Car Tracker</h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        <div className="lg:w-1/3 w-full p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Track Car Movement</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Location</label>
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter start location"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">End Location</label>
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter end location"
            />
          </div>
          <button
            onClick={handleRouteChange}
            className="w-full py-2 bg-blue-600 text-white rounded-lg mb-2"
            disabled={!mapLoaded}
          >
            Update Route
          </button>
          <button
            onClick={toggleTracking}
            className={`w-full py-2 ${isTracking ? 'bg-red-600' : 'bg-green-600'} text-white rounded-lg`}
            disabled={!routePathRef.current || !mapLoaded}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
          {carPosition && (
            <div className="mt-4">
              <p>Car Position: Lat {carPosition.lat.toFixed(4)}, Lng {carPosition.lng.toFixed(4)}</p>
            </div>
          )}
        </div>
        <div className="lg:w-2/3 w-full h-96 lg:h-auto">
          <div ref={mapRef} className="w-full h-full rounded-lg" />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CarTracker;