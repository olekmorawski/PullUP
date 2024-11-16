"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: "/marker-icon.png", // You'll need to add these images to your public folder
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// This component handles updating the map view when location changes
function LocationMarker({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [map, position]);

  return <Marker position={position} icon={icon} />;
}

export const MapComponent = () => {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([
    40.7128, -74.006,
  ]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <MapContainer
      center={currentLocation}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={currentLocation} />
    </MapContainer>
  );
};

// Add this to your global CSS or a styled-component
const styles = `
  .leaflet-container {
    height: 100%;
    width: 100%;
  }
  
  /* Optional: Customize map controls */
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  }
  
  .leaflet-control-zoom a {
    color: #666 !important;
    background-color: white !important;
  }
  
  .leaflet-control-zoom a:hover {
    color: #000 !important;
  }
`;
