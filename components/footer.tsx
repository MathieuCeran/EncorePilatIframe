"use client";
import React from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="w-full text-marron relative overflow-hidden"
      style={{ backgroundColor: "#f3efe8" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Logo mobile */}
        <div className="flex justify-center mb-8 ">
          <div className="relative w-32 h-16">
            <Image
              src="/img/encore-pilates-logo.png"
              alt="Encore Pilates"
              fill
              className="object-contain opacity-65"
            />
          </div>
        </div>

        {/* Section principale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-8 lg:mb-12 sm:p">
          {/* Horaires - Premier sur mobile, deuxième sur desktop */}
          <div className="space-y-4 lg:space-y-6 text-left pl-4 sm:pl-0 order-1 md:order-2 md:ml-48">
            <h3 className="text-xl font-playfair tracking-widest text-marron">
              Nos Horaires
            </h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-center max-w-xs">
                <span className="text-xs sm:text-sm text-marron font-chillax opacity-75">
                  Lundi - Vendredi
                </span>
                <span className="text-xs sm:text-sm text-marron font-medium opacity-75">
                  8h - 21h
                </span>
              </div>
              <div className="flex justify-between items-center max-w-xs">
                <span className="text-xs sm:text-sm text-marron font-chillax opacity-75">
                  Samedi - Dimanche
                </span>
                <span className="text-xs sm:text-sm text-marron font-medium opacity-75">
                  9h - 12h45
                </span>
              </div>
            </div>
          </div>

          {/* Contact - Deuxième sur mobile, premier sur desktop */}
          <div className="space-y-4 lg:space-y-6 text-left pl-4 sm:pl-0 order-2 md:order-1">
            <h3 className="text-xl font-playfair tracking-widest text-marron">
              Contact
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {/* Email */}
              <div className="flex flex-wrap items-center space-x-3">
                <div className="w-4 h-4 lg:w-5 lg:h-5 text-marron flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-marron font-chillax break-words opacity-65">
                  encorepilatescasablanca@gmail.com
                </span>
              </div>
              {/* Téléphone */}
              <div className="flex flex-wrap items-center space-x-3">
                <div className="w-4 h-4 lg:w-5 lg:h-5 text-marron flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-marron font-chillax opacity-65">
                  +212 652 943 924
                </span>
              </div>
              {/* Adresse */}
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 lg:w-5 lg:h-5 text-marron flex-shrink-0 mt-1">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <a
                  href="https://www.google.com/maps?q=33.5537610,-7.6478577&entry=gps&lucs=,94242496,94224825,94227247,94227248,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISDTYuMTM3LjEuODkyMDAYACDXggMqYyw5NDI0MjQ5Niw5NDIyNDgyNSw5NDIyNzI0Nyw5NDIyNzI0OCw0NzA3MTcwNCw0NzA2OTUwOCw5NDIxODY0MSw5NDIwMzAxOSw0NzA4NDMwNCw5NDIwODQ1OCw5NDIwODQ0N0ICTUE%3D&g_st=iw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-marron font-chillax break-words opacity-65 leading-relaxed hover:text-marron hover:opacity-100 transition-colors cursor-pointer underline decoration-dotted hover:decoration-solid"
                  title="Voir sur Google Maps"
                >
                  Angle Rue N1 et 3, Quartier de l&apos;Aviation, Residence
                  magnolia, Bureau B5, RDC
                  <div className="mt-1 opacity-65">Casablanca, Maroc</div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bas du footer */}
        <div className="border-t border-darkBeige2/30 pt-6 lg:pt-8 relative">
          <div className="flex flex-col lg:flex-row lg:justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-xs  text-center opacity-60">
              <span className="font-chillaxlight text-marron opacity-60">
                © 2025 Encore Pilates. Tous droits réservés.
              </span>
            </div>
          </div>

          {/* Instagram (lucide-react) - Centré au milieu de la page */}
          <div className="flex justify-center mt-2 lg:mt-8">
            <a
              href="https://www.instagram.com/encorepilates.ma/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Encore Pilate"
              className="w-8 h-8 lg:w-10 lg:h-10 bg-darkBeige2 rounded-full flex items-center justify-center hover:bg-darkBeige1 transition-colors"
            >
              <Instagram
                className="w-4 h-4 lg:w-5 lg:h-5 text-[#3B2C1A]"
                strokeWidth={2}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
