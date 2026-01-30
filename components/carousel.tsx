import Button from "./button";
import { useState, useEffect } from "react";

const videoDesktop =
  "https://nvd02ath3xbdcmxu.public.blob.vercel-storage.com/prod/video-desktop.mp4";
const videoMobile =
  "/video/mobile.mp4";

export default function Carousel({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return (
    <div className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        src={isMobile ? videoMobile : videoDesktop}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-10"
        onError={(e) => {
          console.error("Video failed to load:", e);
        }}
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 z-15"></div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4">
        <h1 className="text-white text-3xl md:text-5xl font-light mb-8 drop-shadow-2xl text-center font-playfair max-w-4xl">
          A Ritual in Motion.
        </h1>
        <div className="flex flex-col sm:flex-row gap-4">
          {isLoggedIn ? (
            <Button
              variant="filled"
              bgColor="bg-darkBeige2"
              textColor="text-marron"
              className="font-chillax"
              hoverBgColor="hover:bg-darkBeige2/80"
              size="sm"
              href="/cours"
            >
              Nos cours
            </Button>
          ) : (
            <Button
              variant="filled"
              bgColor="bg-darkBeige2"
              textColor="text-marron"
              className="font-chillax"
              hoverBgColor="hover:bg-darkBeige2/80"
              size="sm"
              href="/signin"
            >
              Se connecter
            </Button>
          )}
          <Button
            variant="outlined"
            bgColor="bg-transparent"
            borderColor="border-white"
            hoverBgColor="hover:bg-darkBeige2"
            hoverTextColor="hover:text-marron"
            textColor="text-white"
            className="font-chillax"
            size="sm"
            href="/reservation"
          >
            Réserver
          </Button>
        </div>
      </div>
    </div>
  );
}
