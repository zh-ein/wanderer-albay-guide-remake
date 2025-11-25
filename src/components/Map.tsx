import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const Map = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [destinationInput, setDestinationInput] = useState("");
  const [recommendation, setRecommendation] = useState<string>("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
      },
      () => alert("Failed to get your location. Please enable location services.")
    );
  }, []);

  const FlyToLocation = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      if (coords) map.flyTo(coords, 13);
    }, [coords]);
    return null;
  };

  const handleSearch = async () => {
    if (!destinationInput.trim()) return;
    const query = encodeURIComponent(destinationInput);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await res.json();

    if (data && data[0]) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      setDestination(coords);
    } else {
      alert("Destination not found.");
    }
  };

  useEffect(() => {
    const getRoute = async () => {
      if (!position || !destination) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${position[1]},${position[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        setRoute(routeCoords);
        setDistance(data.routes[0].distance / 1000);
        setDuration(data.routes[0].duration / 60);

        const km = data.routes[0].distance / 1000;
        if (km < 10) setRecommendation("🚌 Take a tricycle, jeepney, or walk if nearby. Quick and easy!");
        else if (km < 80) setRecommendation("🚐 Try taking a bus or van — affordable and frequent rides available.");
        else setRecommendation("🚗 Best to drive your own vehicle or rent one for comfort and time efficiency.");
      }
    };
    getRoute();
  }, [position, destination]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem",
        background: "#0f172a",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          background: "#1e293b",
          borderRadius: "16px",
          overflow: "hidden",
          width: "90%",
          maxWidth: "1200px",
          boxShadow: "0 4px 25px rgba(0,0,0,0.4)",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "320px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            color: "#fff",
            justifyContent: "flex-start",
          }}
        >
          <h3 style={{ color: "#38bdf8", fontWeight: "600", fontSize: "18px" }}>Search Destination</h3>
          <input
            type="text"
            value={destinationInput}
            onChange={(e) => setDestinationInput(e.target.value)}
            placeholder="Enter destination..."
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#000",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            🔍 Search
          </button>

          {distance && duration && (
            <div
              style={{
                background: "#334155",
                borderRadius: "10px",
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginTop: "10px",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: 500 }}>
                🚗 <strong>{distance.toFixed(2)} km</strong>
              </div>
              <div style={{ fontSize: "14px" }}>⏱️ {Math.round(duration)} min</div>
              {recommendation && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    background: "#1e3a8a",
                    borderRadius: "8px",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                >
                  {recommendation}
                </div>
              )}
            </div>
          )}

          {/* Fixed: always visible button */}
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() =>
                navigator.geolocation.getCurrentPosition(
                  (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
                  () => alert("Unable to get your location.")
                )
              }
              style={{
                background: "#f43f5e",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                width: "100%",
                transition: "0.2s",
              }}
            >
              📍 Use My Location
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1 }}>
          <MapContainer
            center={position || [13.143, 123.735]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {position && (
              <Marker position={position} icon={markerIcon}>
                <Popup>Your location</Popup>
              </Marker>
            )}
            {destination && (
              <Marker position={destination} icon={markerIcon}>
                <Popup>Destination</Popup>
              </Marker>
            )}
            {route.length > 0 && <Polyline positions={route} color="#38bdf8" weight={5} />}
            {destination && <FlyToLocation coords={destination} />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Map;
