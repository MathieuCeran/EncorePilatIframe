"use client";

import React from "react";
import Card from "@/components/card";

const MapComponent = () => {
  const studioAddress =
    "Angle Rue N1 et 3, Quartier de l'Aviation, Residence magnolia, Bureau B5, RDC, Casablanca, Maroc";
  const encodedAddress = encodeURIComponent(studioAddress);

  // Coordonnées GPS précises du studio (Casablanca, Maroc)
  const latitude = 33.553761;
  const longitude = -7.6478577;
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=15`;

  return (
    <Card className="p-6">
      <h3 className="text-xl font-playfair text-marron mb-4 text-center">
        Notre Studio
      </h3>

      {/* Carte Google Maps */}
      <div className="w-full h-64 rounded-lg overflow-hidden mb-4">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Studio Encore Location"
        />
      </div>

      {/* Adresse */}
      <div className="text-center">
        <p className="text-gray-700 font-medium mb-2">
          <span className="text-encoregreen">📍</span> Adresse du studio
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Angle Rue N1 et 3, Quartier de l&apos;Aviation,
          <br />
          Residence magnolia, Bureau B5, RDC
        </p>

        {/* Bouton pour ouvrir dans Google Maps */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-4 py-2 bg-encoregreen text-white rounded-lg hover:bg-encoregreen/90 transition-colors text-sm"
        >
          Ouvrir dans Google Maps
        </a>
      </div>
    </Card>
  );
};

export default MapComponent;
