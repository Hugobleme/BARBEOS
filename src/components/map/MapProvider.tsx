import React, { createContext, useContext, ReactNode, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  is_sponsored?: boolean;
  onClick?: () => void;
  popupContent?: ReactNode;
};

interface MapProps {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const MapContext = createContext<{ provider: string }>({ provider: "leaflet" });

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function LeafletMapImpl({ pins, center = [-23.5505, -46.6333], zoom = 12, className = "w-full h-full" }: MapProps) {
  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} zoom={zoom} />
        {pins.map((pin) => (
          <Marker 
            key={pin.id} 
            position={[pin.lat, pin.lng]} 
            icon={pin.is_sponsored ? customMarkerIcon : defaultMarkerIcon}
            eventHandlers={{ click: pin.onClick }}
          >
            {pin.popupContent && <Popup>{pin.popupContent}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export function MapProvider({ children, provider = import.meta.env.VITE_MAP_PROVIDER || "leaflet" }: { children: ReactNode, provider?: string }) {
  return (
    <MapContext.Provider value={{ provider }}>
      {children}
    </MapContext.Provider>
  );
}

export function MapView(props: MapProps) {
  const { provider } = useContext(MapContext);

  if (provider === "google") {
    return <div className="p-4 bg-muted text-muted-foreground flex items-center justify-center">Google Maps Interface (Mock)</div>;
  }
  
  if (provider === "mapbox") {
    return <div className="p-4 bg-muted text-muted-foreground flex items-center justify-center">Mapbox Interface (Mock)</div>;
  }

  // Default to Leaflet
  return <LeafletMapImpl {...props} />;
}
