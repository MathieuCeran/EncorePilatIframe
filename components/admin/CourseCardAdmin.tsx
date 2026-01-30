"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Flame, Edit, Trash2, Users } from "lucide-react";
import Button from "../button";
import { FormattedCourse } from "@/types/types";
import Link from "next/link";

import { getIntensityLabel } from "@/lib/intensity-utils";

interface CourseCardAdminProps {
  course: FormattedCourse;
  selectedDate: Date;
  onEdit: (course: FormattedCourse) => void;
  onDelete?: (course: FormattedCourse) => void;
}

export function CourseCardAdmin({
  course,
  selectedDate,
  onEdit,
  onDelete,
}: CourseCardAdminProps) {
  // Fonction pour afficher le niveau avec des flammes
  const renderIntensity = (intensity: number) => {
    // Assurer que le niveau est entre 1 et 3
    const level = Math.max(1, Math.min(3, intensity || 1));
    return (
      <div className="flex gap-1">
        {[...Array(level)].map((_, i) => (
          <Flame key={i} className="w-3 h-3 text-marron" />
        ))}
      </div>
    );
  };

  // Fonction pour obtenir le nom du cours depuis le type de cours
  const getCourseName = () => {
    return course.name || course.courseType || "COURS";
  };

  // Fonction pour obtenir le nom de l'instructeur
  const getInstructorName = () => {
    return course.instructor || "Instructeur non assigné";
  };

  return (
    <div
      className="bg-[#FFFFFF]/50 rounded-[24px] p-4 sm:p-6 "
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
              {getCourseName().toUpperCase()}
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
              <span>{getInstructorName()}</span>
            </div>
            <div className="flex items-center gap-2 font-inter">
              <span>{getIntensityLabel(course.intensity)}</span>
              {renderIntensity(course.intensity)}
            </div>
          </div>

          {/* Availability */}
          <div className="text-sm text-marron font-inter-extralight-italic">
            {course.isFull
              ? `${course.current_bookings}/${course.max_capacity} Complet`
              : `${course.current_bookings}/${course.max_capacity} Réservés`}
          </div>

          {/* Status */}
          <div className="text-sm text-marron font-inter mt-1">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                course.status === "active"
                  ? "bg-green-100 text-green-800"
                  : course.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {course.status === "active"
                ? "Actif"
                : course.status === "cancelled"
                  ? "Annulé"
                  : course.status === "completed"
                    ? "Terminé"
                    : course.status}
            </span>
          </div>
        </div>

        {/* Desktop Action buttons */}
        <div className="flex gap-3 ml-6 pt-24">
          <Link href={`/admin/cours/${course.id}/participants`}>
            <Button
              variant="filled"
              bgColor="bg-blue-600"
              textColor="text-white"
              className="font-chillax flex items-center gap-2"
              hoverBgColor="hover:bg-blue-700"
              shadow={false}
              size="sm"
            >
              <Users className="w-4 h-4" />
              Participants
            </Button>
          </Link>
          <Button
            onClick={() => onEdit(course)}
            variant="filled"
            bgColor="bg-encoregreen"
            textColor="text-white"
            className="font-chillax flex items-center gap-2"
            hoverBgColor="hover:bg-encoregreen/80"
            shadow={false}
            size="sm"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
          {onDelete && course.status !== "cancelled" && (
            <Button
              onClick={() => onDelete(course)}
              variant="filled"
              bgColor="bg-red-600"
              textColor="text-white"
              className="font-chillax flex items-center gap-2"
              hoverBgColor="hover:bg-red-700"
              shadow={false}
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Top section: Time and Date on same line */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-aboreto text-marron">
            {course.startTime} / {course.endTime} -{" "}
            {getCourseName().toUpperCase()}
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
            <span>{getInstructorName()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-marron font-inter">
            <span>{getIntensityLabel(course.intensity)}</span>
            {renderIntensity(course.intensity)}
          </div>
        </div>

        {/* Availability */}
        <div className="text-sm text-marron mb-3 font-inter-extralight-italic">
          {course.isFull
            ? `${course.current_bookings}/${course.max_capacity} Complet`
            : `${course.current_bookings}/${course.max_capacity} Réservés`}
        </div>

        {/* Status */}
        <div className="text-sm text-marron font-inter mb-3">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              course.status === "active"
                ? "bg-green-100 text-green-800"
                : course.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {course.status === "active"
              ? "Actif"
              : course.status === "cancelled"
                ? "Annulé"
                : course.status === "completed"
                  ? "Terminé"
                  : course.status}
          </span>
        </div>

        {/* Bottom section: Action buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link href={`/admin/cours/${course.id}/participants`}>
            <Button
              variant="filled"
              bgColor="bg-blue-600"
              textColor="text-white"
              className="font-chillax text-xs px-3 py-1 flex items-center gap-1"
              hoverBgColor="hover:bg-blue-700"
              shadow={true}
              size="sm"
            >
              <Users className="w-3 h-3" />
              Participants
            </Button>
          </Link>
          <Button
            onClick={() => onEdit(course)}
            variant="filled"
            bgColor="bg-encoregreen"
            textColor="text-white"
            className="font-chillax text-xs px-3 py-1 flex items-center gap-1"
            hoverBgColor="hover:bg-encoregreen/80"
            shadow={true}
            size="sm"
          >
            <Edit className="w-3 h-3" />
            Modifier
          </Button>
          {onDelete && course.status !== "cancelled" && (
            <Button
              onClick={() => onDelete(course)}
              variant="filled"
              bgColor="bg-red-600"
              textColor="text-white"
              className="font-chillax text-xs px-3 py-1 flex items-center gap-1"
              hoverBgColor="hover:bg-red-700"
              shadow={true}
              size="sm"
            >
              <Trash2 className="w-3 h-3" />
              Annuler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
