"use client";
import React, { useState, useEffect, useCallback } from "react";

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
  };
}

interface TimeService {
  getCurrentTimeInMorocco(): Date;
  getDayName(date: Date): string;
  formatTimeString(date: Date): string;
}

interface BusinessHoursService {
  isOpen(day: string, time: string): boolean;
  getNextOpeningTime(currentDay: string, currentTime: string): string;
}

// Service pour la gestion du temps
const timeService: TimeService = {
  getCurrentTimeInMorocco(): Date {
    const now = new Date();
    return new Date(
      now.toLocaleString("en-US", { timeZone: "Africa/Casablanca" })
    );
  },

  getDayName(date: Date): string {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[date.getDay()];
  },

  formatTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5);
  },
};

// Service pour la logique métier des horaires
const createBusinessHoursService = (
  openingHours: OpeningHours
): BusinessHoursService => ({
  isOpen(day: string, time: string): boolean {
    const dayHours = openingHours[day];
    if (!dayHours) return false;
    return time >= dayHours.open && time <= dayHours.close;
  },

  getNextOpeningTime(currentDay: string, currentTime: string): string {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayNames = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    const currentDayIndex = days.indexOf(currentDay);

    // Vérifier si on peut ouvrir aujourd'hui
    const todayHours = openingHours[currentDay];
    if (currentTime < todayHours.open) {
      return `Aujourd'hui à ${todayHours.open}`;
    }

    // Chercher le prochain jour d'ouverture
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours.open !== "00:00") {
        return `${dayNames[nextDayIndex]} à ${nextDayHours.open}`;
      }
    }

    return "Fermé";
  },
});

// Hook personnalisé pour la logique d'état
const useOpeningStatus = (openingHours: OpeningHours) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [nextOpening, setNextOpening] = useState<string>("");

  const businessHoursService = createBusinessHoursService(openingHours);

  const updateStatus = useCallback(() => {
    const moroccoTime = timeService.getCurrentTimeInMorocco();
    const currentDay = timeService.getDayName(moroccoTime);
    const currentTimeStr = timeService.formatTimeString(moroccoTime);

    const open = businessHoursService.isOpen(currentDay, currentTimeStr);
    setIsOpen(open);

    if (!open) {
      const nextOpeningTime = businessHoursService.getNextOpeningTime(
        currentDay,
        currentTimeStr
      );
      setNextOpening(nextOpeningTime);
    }
  }, [businessHoursService]);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  return { isOpen, nextOpening };
};

// Constantes
const OPENING_HOURS: OpeningHours = {
  monday: { open: "08:00", close: "21:00" },
  tuesday: { open: "08:00", close: "21:00" },
  wednesday: { open: "08:00", close: "21:00" },
  thursday: { open: "08:00", close: "21:00" },
  friday: { open: "08:00", close: "21:00" },
  saturday: { open: "09:00", close: "21:00" },
  sunday: { open: "09:00", close: "12:45" },
};

// Composant de présentation
const StatusIndicator: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <div
    className={`w-2 h-2 rounded-full animate-pulse ${
      isOpen ? "bg-green-400" : "bg-red-400"
    }`}
  />
);

const StatusText: React.FC<{ isOpen: boolean; nextOpening?: string }> = ({
  isOpen,
  nextOpening,
}) => (
  <div className="flex flex-col">
    <span
      className={`text-xs font-medium ${
        isOpen ? "text-green-400" : "text-red-400"
      }`}
    >
      {isOpen ? "Ouvert maintenant" : "Fermé"}
    </span>
    {!isOpen && nextOpening && (
      <span className="text-xs text-gray-400 mt-1">
        Prochaine ouverture: {nextOpening}
      </span>
    )}
  </div>
);

// Composant principal
const OpeningStatus: React.FC = () => {
  const { isOpen, nextOpening } = useOpeningStatus(OPENING_HOURS);

  return (
    <div className="mt-4 p-3 bg-[#cdab83]/10 rounded-lg max-w-xs mx-auto md:mx-0">
      <div className="flex items-center space-x-2">
        <StatusIndicator isOpen={isOpen} />
        <StatusText isOpen={isOpen} nextOpening={nextOpening} />
      </div>
    </div>
  );
};

export default OpeningStatus;
