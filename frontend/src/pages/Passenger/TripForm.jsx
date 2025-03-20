import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "sonner";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
 
    withCredentials: true,
});

const TripForm = () => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [proposedFare, setProposedFare] = useState("");
  const [suggestedFare, setSuggestedFare] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 });
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("newOffer", ({ driverId, offeredFare }) => {
      setOffers((prev) => [...prev, { driverId, offeredFare }]);
      toast.info(`New offer received: ₦${offeredFare}`);
    });

    return () => socket.off("newOffer");
  }, []);

  const handlePlaceSelect = (autocomplete, type) => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address,
      };
      if (type === "pickup") setPickup(location);
      else setDestination(location);
      setMapCenter(location);
    }
  };

  const handleFindDriver = async () => {
    if (!pickup || !destination) {
      toast.error("Please select both pickup and destination");
      return;
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/trips/create`,
        { pickup, destination, proposedFare: parseFloat(proposedFare) || undefined },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setSuggestedFare(data.trip.suggestedFare);
      setTripId(data.trip._id);
      socket.emit("newTrip", data.trip);
      toast.success("Trip request sent to drivers!");
    } catch (error) {
      toast.error("Failed to create trip");
    }
  };

  const handleAcceptOffer = async (driverId, offeredFare) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/trips/accept`,
        { tripId, driverId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(`Offer of ₦${offeredFare} accepted!`);
      navigate("/trip-progress"); 
    } catch (error) {
      toast.error("Failed to accept offer");
    }
  };

  return (
    <div className="p-4">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <GoogleMap mapContainerStyle={{ height: "400px", width: "100%" }} center={mapCenter} zoom={10}>
          {pickup && <Marker position={pickup} label="P" />}
          {destination && <Marker position={destination} label="D" />}
        </GoogleMap>

        <div className="mt-4 space-y-4">
          <Autocomplete onLoad={(auto) => auto} onPlaceChanged={() => handlePlaceSelect(auto, "pickup")}>
            <input type="text" placeholder="Enter pickup location" className="w-full p-2 border rounded" />
          </Autocomplete>

          <Autocomplete onLoad={(auto) => auto} onPlaceChanged={() => handlePlaceSelect(auto, "destination")}>
            <input type="text" placeholder="Enter destination" className="w-full p-2 border rounded" />
          </Autocomplete>

          <input
            type="number"
            placeholder="Propose your fare (optional)"
            value={proposedFare}
            onChange={(e) => setProposedFare(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <button
            onClick={handleFindDriver}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Find Driver
          </button>

          {suggestedFare && (
            <p className="text-gray-600">Suggested Fare: ₦{suggestedFare}</p>
          )}

          {offers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Driver Offers:</h3>
              {offers.map((offer, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <p>Driver {offer.driverId.slice(-4)}: ₦{offer.offeredFare}</p>
                  <button
                    onClick={() => handleAcceptOffer(offer.driverId, offer.offeredFare)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </LoadScript>
    </div>
  );
};

export default TripForm;