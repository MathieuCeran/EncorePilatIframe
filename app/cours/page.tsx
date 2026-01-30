"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CourseType } from "@/types/types";
import Loader from "@/components/loader";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import CheckIcon from "@/components/ui/CheckIcon";
import Title from "@/components/title";
import Button from "@/components/button";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

export default function CoursePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [active, setActive] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1024);

  const mobile = windowWidth < 768;

  // track page view
  usePageViewTracking("cours");

  const next = useCallback(() => {
    const newIndex = (active + 1) % courses.length;
    setActive(newIndex);
  }, [active, courses.length]);

  const prev = useCallback(() => {
    const newIndex = (active - 1 + courses.length) % courses.length;
    setActive(newIndex);
  }, [active, courses.length]);

  useEffect(() => {
    fetch("/api/course-type")
      .then((res) => res.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : data.data || []);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des cours:", error);
        setCourses([]);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Gestion touches clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [prev, next]);

  const handleReserverClick = (courseName: string) => {
    router.push(`/reservation?courseType=${encodeURIComponent(courseName)}`);
  };

  const handleFormulesClick = () => {
    router.push("/formules");
  };

  if (courses.length === 0) {
    return (
      <BackgroundWrapper>
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <Title
        title="Nos Cours"
        description="Chaque cours chez Encore Pilate est conçu pour faire bouger, renforcer et assouplir le corps, tout en respectant le rythme de chacun."
      />
      <div className="mt-4 flex flex-col items-center justify-center w-full">
        <div className="flex items-center justify-between w-full max-w-7xl">
          {/* Carousel desktop / Scroll vertical mobile */}
          <div
            className={
              mobile
                ? "relative flex-1"
                : "relative flex items-center justify-center flex-1 h-[600px] gap-x-16"
            }
          >
            {mobile ? (
              /* Version mobile avec scroll de page */
              <div className="flex flex-col gap-8 px-6 pb-8">
                {courses.map((card, idx) => (
                  <div
                    key={`${card.name}-${idx}`}
                    className="bg-white/20 backdrop-blur-sm p-6 pt-8 w-full max-w-sm mx-auto h-[520px] transition-all duration-300 flex flex-col cursor-pointer"
                    style={{
                      borderRadius: "24px",
                      boxShadow:
                        "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    }}
                    onClick={() => {
                      setActive(idx);
                    }}
                  >
                    {/* Nom du cours */}
                    <div className="mb-6 text-left pt-4 px-6 justify-center">
                      <h2 className="text-2xl font-playfair text-marron">
                        {card.name.toUpperCase()}
                      </h2>
                    </div>

                    {/* Description */}
                    <div className="mb-6 text-left px-6">
                      <p className="text-xs text-marron font-ttdrugs leading-6">
                        {card.description}
                      </p>
                    </div>
                    {/* Trait horizontal lightgold */}
                    <div className="mb-6 flex justify-center">
                      <div className="w-70 h-px bg-gray-200/50" />
                    </div>

                    {/* Benefits */}
                    <div className="flex-1 flex items-start justify-start mb-3 overflow-hidden px-4">
                      <ul className="text-sm space-y-2 text-left text-marron w-full font-ttdrugs">
                        {card.benefits?.map(
                          (pt: string, benefitIdx: number) => (
                            <li
                              key={`${pt}-${benefitIdx}`}
                              className="flex items-start justify-start"
                            >
                              <span
                                className="flex-shrink-0 mr-2"
                                style={{ color: "var(--color-marron)" }}
                              >
                                <CheckIcon className="text-marron" />
                              </span>
                              <span className="text-left leading-relaxed">
                                {pt}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* À réserver */}
                    <div className="text-center px-6 pt-3 gap-4 flex justify-center">
                      <Button
                        variant="filled"
                        bgColor="bg-encoregreen"
                        textColor="text-white"
                        className="font-ttdrugs"
                        hoverBgColor="hover:bg-encoregreen/80"
                        shadow={false}
                        size="sm"
                        onClick={() => handleReserverClick(card.id)}
                      >
                        Réserver
                      </Button>
                      <Button
                        variant="outlined"
                        bgColor="bg-darkBeige2"
                        textColor="text-marron"
                        borderColor="border-marron"
                        className="font-ttdrugs"
                        hoverBgColor="hover:bg-darkBeige2"
                        shadow={false}
                        size="sm"
                        onClick={handleFormulesClick}
                      >
                        Voir nos formules
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Version desktop avec carousel */
              <>
                {/* Bouton flèche gauche */}
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20 hover:cursor-pointer"
                  aria-label="Cours précédent"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-encoregreen"
                  >
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Bouton flèche droite */}
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12  flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20 hover:cursor-pointer"
                  aria-label="Cours suivant"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-encoregreen"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {courses.map((card, idx) => {
                  let style =
                    "absolute transition-all duration-500 ease-in-out bg-white/60 backdrop-blur-sm rounded-2xl p-6 pt-18 w-[400px] h-[600px] opacity-40 scale-90 z-0";
                  if (idx === active) {
                    style =
                      "absolute transition-all duration-500 ease-in-out bg-white/80 backdrop-blur-sm rounded-2xl p-6 pt-18 w-[400px] h-[600px] opacity-100 scale-100 z-10";
                  } else if (
                    idx === (active + 1) % courses.length ||
                    idx === (active - 1 + courses.length) % courses.length
                  ) {
                    style += " opacity-70 scale-95 z-5";
                  }
                  let offset = 0;
                  if (idx === (active - 1 + courses.length) % courses.length)
                    offset = -340;
                  if (idx === (active + 1) % courses.length) offset = 340;
                  if (idx === active) offset = 0;

                  // Vérifier si la carte est cliquable (carte latérale)
                  const isClickable =
                    idx === (active + 1) % courses.length ||
                    idx === (active - 1 + courses.length) % courses.length;

                  return (
                    <div
                      key={`${card.name}-${idx}`}
                      className={`${style} flex flex-col ${isClickable ? "cursor-pointer hover:scale-97" : ""}`}
                      style={{
                        left: `calc(50% + ${offset}px - 200px)`,
                        boxShadow:
                          idx === active
                            ? "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                            : "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                      }}
                      onClick={isClickable ? () => setActive(idx) : undefined}
                    >
                      {/* Nom du cours */}
                      <div className="mb-6 text-left pt-2 px-6 justify-center">
                        <h2 className="text-2xl font-playfair text-marron">
                          {card.name}
                        </h2>
                      </div>

                      {/* Description */}
                      <div className="mb-6 text-left px-6">
                        <p className="text-xs text-marron font-ttdrugs leading-6 ">
                          {card.description}
                        </p>
                      </div>

                      {/* Trait horizontal lightgold */}
                      <div className="mb-6 flex justify-center">
                        <div className="w-74 h-px bg-gray-200/50" />
                      </div>

                      {/* Benefits */}
                      <div className="flex-1 flex items-start justify-start overflow-hidden px-4">
                        <ul className="text-sm space-y-2 text-left text-marron w-full font-ttdrugs">
                          {card.benefits?.map(
                            (pt: string, benefitIdx: number) => (
                              <li
                                key={`${pt}-${benefitIdx}`}
                                className="flex items-start justify-start"
                              >
                                <span
                                  className="flex-shrink-0 mr-2 mt-1"
                                  style={{ color: "var(--color-marron)" }}
                                >
                                  <CheckIcon className="text-marron" />
                                </span>
                                <span className="text-left leading-relaxed">
                                  {pt}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* À réserver */}

                      <div className="text-center px-2 pb-10 gap-4 flex justify-center">
                        <Button
                          variant="filled"
                          bgColor={
                            idx === active ||
                            idx === (active + 1) % courses.length ||
                            idx ===
                              (active - 1 + courses.length) % courses.length
                              ? "bg-encoregreen"
                              : "bg-background"
                          }
                          textColor="text-white"
                          className="font-ttdrugs"
                          hoverBgColor="hover:bg-encoregreen/80"
                          shadow={false}
                          size="sm"
                          onClick={() => handleReserverClick(card.id)}
                        >
                          Réserver
                        </Button>

                        <Button
                          variant="outlined"
                          bgColor="bg-darkBeige2"
                          textColor="text-marron"
                          borderColor="border-marron"
                          className="font-ttdrugs"
                          hoverBgColor="hover:bg-darkBeige2"
                          shadow={false}
                          size="sm"
                          onClick={handleFormulesClick}
                        >
                          Voir nos formules
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
}
