"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create a custom CSS marker icon
const customIcon = L.divIcon({
  className: "custom-marker",
  html: '<div class="marker-pin"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// This component handles updating the map view when location changes
function LocationMarker({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [map, position]);

  return <Marker position={position} icon={customIcon} />;
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
