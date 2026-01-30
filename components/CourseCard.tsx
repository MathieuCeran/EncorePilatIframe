"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Flame } from "lucide-react";
import Button from "./button";
import { FormattedCourse } from "@/types/types";
import { InviteModal } from "@/components/InviteModal";

import { getIntensityLabel } from "@/lib/intensity-utils";

interface CourseCardProps {
  course: FormattedCourse;
  selectedDate: Date;
  onReserve: (course: FormattedCourse, selectedDate: Date) => void;
}

export function CourseCard({
  course,
  selectedDate,
  onReserve,
}: CourseCardProps) {
  // Fonction pour obtenir le nombre de flammes basé sur le niveau
  const getIntensityLevel = (intensity: number): number => {
    // Assurer que le niveau est entre 1 et 3
    return Math.max(1, Math.min(3, intensity || 1));
  };

  return (
    <div
      className="bg-[#FFFFFF]/70 rounded-[24px] backdrop-blur-sm p-4 sm:p-6 "
      style={{
        boxShadow:
          "0 4px 20px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between">
        <div className="flex-1">
          {/* Time and Class Name */}
          <div className="mb-4">
            <p className="text-2xl font-aboreto text-marron ">
              {course.startTime} / {course.endTime} -{" "}
              {course.name?.toUpperCase() || "COURS"}
            </p>
          </div>

          {/* Date */}
          <div className="mb-2">
            <span className="text-sm text-marron font-inter">
              {format(selectedDate, "EEEE, dd MMMM", {
                locale: fr,
              })}
            </span>
          </div>

          {/* Instructor and Intensity */}
          <div className="flex items-center gap-4 text-sm text-marron mb-2 font-inter">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-marron" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-2 font-inter">
              <span>{getIntensityLabel(course.intensity)}</span>
              <div className="flex">
                {[...Array(getIntensityLevel(course.intensity))].map((_, i) => (
                  <Flame key={i} className="w-3 h-3 text-marron" />
                ))}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="text-sm text-marron font-inter-extralight-italic">
            {course.isFull
              ? `Complet`
              : `Plus que ${course.max_capacity - course.current_bookings} place${course.max_capacity - course.current_bookings > 1 ? "s" : ""} disponible${course.max_capacity - course.current_bookings > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Desktop Action buttons */}
        <div className="flex gap-3 ml-6 pt-24">
          {course.isUserBooked ? (
            <Button
              variant="outlined"
              bgColor="bg-encoregreen/10"
              textColor="text-encoregreen"
              borderColor="border-encoregreen/80"
              className="font-chillax text-sm cursor-default"
              shadow={false}
              size="sm"
              disabled={true}
            >
              Déjà inscrit
            </Button>
          ) : !course.isFull ? (
            <Button
              onClick={() => onReserve(course, selectedDate)}
              variant="filled"
              bgColor="bg-encoregreen"
              textColor="text-white"
              className="font-chillax"
              hoverBgColor="hover:bg-encoregreen/80"
              shadow={false}
              size="sm"
              disabled={course.isFull}
            >
              Réserver
            </Button>
          ) : null}

          <InviteModal course={course} selectedDate={selectedDate} size="sm" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Top section: Time and Date on same line */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-aboreto text-marron">
            {course.startTime} / {course.endTime} -{" "}
            {course.name?.toUpperCase() || "MICROFORMER"}
          </div>
        </div>

        {/* Date */}
        <div className="mb-3">
          <span className="text-sm text-marron font-inter">
            {format(selectedDate, "EEEE, dd MMMM", {
              locale: fr,
            })}
          </span>
        </div>

        {/* Instructor and Intensity */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-marron font-inter">
            <User className="w-4 h-4 text-marron" />
            <span>{course.instructor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-marron font-inter">
            <span>{getIntensityLabel(course.intensity)}</span>
            <div className="flex gap-1">
              {[...Array(getIntensityLevel(course.intensity))].map((_, i) => (
                <Flame key={i} className="w-3 h-3 text-marron" />
              ))}
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="text-sm text-marron mb-3 font-inter-extralight-italic">
          {course.isFull
            ? `Complet`
            : `${course.max_capacity - course.current_bookings} place${course.max_capacity - course.current_bookings > 1 ? "s" : ""} disponible${course.max_capacity - course.current_bookings > 1 ? "s" : ""}`}
        </div>

        {/* Bottom section: Availability and buttons */}
        <div className={`flex items-center justify-center`}>
          {/* Mobile Action buttons */}
          <div className="flex gap-2">
            {course.isUserBooked ? (
              <Button
                variant="outlined"
                bgColor="bg-encoregreen/10"
                textColor="text-encoregreen"
                borderColor="border-encoregreen/30"
                className="font-chillax text-xs cursor-default"
                shadow={true}
                size="sm"
                disabled={true}
              >
                Déjà inscrit
              </Button>
            ) : !course.isFull ? (
              <Button
                onClick={() => onReserve(course, selectedDate)}
                variant="filled"
                bgColor="bg-darkBeige2"
                textColor="text-marron"
                className="font-chillax text-xs px-3 py-1"
                hoverBgColor="hover:bg-darkBeige2"
                shadow={true}
                size="sm"
              >
                Réserver
              </Button>
            ) : null}

            <InviteModal
              course={course}
              selectedDate={selectedDate}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
