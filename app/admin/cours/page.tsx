"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import Loader from "@/components/loader";
import { CourseCardAdmin } from "@/components/admin/CourseCardAdmin";
import { CourseFormModal } from "@/components/admin/CourseFormModal";
import { DeleteCourseModal } from "@/components/admin/DeleteCourseModal";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BackgroundWrapper from "@/components/BackgroundWrapper";

const AdminCoursesPage: React.FC = () => {
  const {
    selectedCourseType,
    selectedDate,
    courseTypes,
    courses,
    loading,
    weekDays,
    handleCourseTypeChange,
    handleDateChange,
    handleDayClick,
    handleWeekNavigation,
    handleDayNavigation,
    handleEditCourse,
    handleCreateCourse,
    handleDeleteCourse,
    handleCloseModal,
    selectedCourseForEdit,
    selectedCourseForDelete,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    refreshCourses,
  } = useAdminCourses();

  // État local pour gérer la transition entre les jours
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedCourses, setDisplayedCourses] = useState(courses);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRole(data.role);
    };
    fetchRole();
  }, []);

  // Gérer la transition quand les cours changent
  useEffect(() => {
    if (loading) {
      setIsTransitioning(true);
    } else {
      // Si il n'y a pas de cours, on met à jour immédiatement
      if (courses.length === 0) {
        setDisplayedCourses([]);
        setIsTransitioning(false);
      } else {
        // Délai pour la transition fluide seulement s'il y a des cours
        const timer = setTimeout(() => {
          setDisplayedCourses(courses);
          setIsTransitioning(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [courses, loading]);

  // Déterminer ce qui doit être affiché
  const shouldShowNoCourses =
    !loading && !isTransitioning && courses.length === 0;
  const shouldShowCourses =
    courses.length > 0 || (displayedCourses.length > 0 && isTransitioning);

  const handleModalSuccess = () => {
    refreshCourses();
  };

  return (
    <BackgroundWrapper>
      <div className="min-h-screen pt-10 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Header avec bouton retour et titre */}
          <div className="mb-6">
            <Link href="/admin">
              <Button
                variant="outline"
                className="flex items-center gap-2 mb-4"
              >
                ← Retour au dashboard
              </Button>
            </Link>

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-playfair font-bold">Gestion des cours</h1>
                <p className="text-gray-600">
                  Gérez les cours et les réservations
                </p>
              </div>
              {role === "admin" && (
                <Button
                  onClick={handleCreateCourse}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau cours
                </Button>
              )}
            </div>
          </div>

          <div className="mb-4 sm:mb-6 flex-shrink-0">
            <div className="block sm:hidden mb-4">
              <div className="relative">
                <select
                  value={selectedCourseType}
                  onChange={(e) => handleCourseTypeChange(e.target.value)}
                  className="w-full h-[52px] px-6 py-4 border border-marron/30 rounded-sm bg-transparent appearance-none pr-10 text-transparent"
                >
                  <option value="all">Types de cours</option>
                  {courseTypes.map((courseType) => (
                    <option key={courseType.id} value={courseType.id}>
                      {courseType.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="text-xs text-gray-400">Types de cours</div>
                  <div className="text-sm font-medium text-gray-700">
                    {selectedCourseType === "all"
                      ? "Types de cours"
                      : courseTypes.find((ct) => ct.id === selectedCourseType)
                          ?.name || "Types de cours"}
                  </div>
                </div>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="hidden sm:flex gap-6 mb-6">
              <div className="w-1/2">
                <div className="relative">
                  <select
                    value={selectedCourseType}
                    onChange={(e) => handleCourseTypeChange(e.target.value)}
                    className="w-full h-[52px] px-6 py-4 border border-marron/30 rounded-sm bg-transparent appearance-none pr-10 text-transparent"
                  >
                    <option value="all">Types de cours</option>
                    {courseTypes.map((courseType) => (
                      <option key={courseType.id} value={courseType.id}>
                        {courseType.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <div className="text-xs text-gray-400">Types de cours</div>
                    <div className="text-sm font-medium text-gray-700">
                      {selectedCourseType === "all"
                        ? "Types de cours"
                        : courseTypes.find((ct) => ct.id === selectedCourseType)
                            ?.name || "Types de cours"}
                    </div>
                  </div>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="w-1/2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-[52px] px-6 py-4 border border-marron/30 rounded-sm bg-transparent justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "MMMM yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          handleDateChange(date);
                        }
                      }}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center justify-center mb-4 sm:hidden">
              <button
                onClick={() => handleDayNavigation("prev")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Jour précédent"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex-1 text-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-lg font-medium text-gray-900 bg-transparent border-none text-center cursor-pointer hover:text-[#144C2D] transition-colors shadow-none focus:ring-0 focus:outline-none p-0 justify-center"
                    >
                      {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          handleDateChange(date);
                        }
                      }}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <button
                onClick={() => handleDayNavigation("next")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Jour suivant"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="hidden sm:flex items-center justify-between mb-6">
              <button
                onClick={() => handleWeekNavigation("prev")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex gap-8">
                {weekDays.map((day, index) => {
                  const isSelected =
                    format(day, "yyyy-MM-dd") ===
                    format(selectedDate, "yyyy-MM-dd");

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <span className="text-xs mb-2 text-gray-500">
                        {format(day, "E", { locale: fr })
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDayClick(day)}
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 font-chillax text-marron 
                          ${
                            isSelected
                              ? "bg-encoregreen text-white font-chillax"
                              : " border border-marron/30 text-marron font-chillax hover:border-marron/50 hover:bg-gray-50"
                          }
                        `}
                      >
                        {format(day, "d")}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleWeekNavigation("next")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Semaine suivante"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {/* Loading initial */}
            {loading && displayedCourses.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader size={32} color="var(--color-encoregreen)" />
              </div>
            ) : shouldShowNoCourses ? (
              <div className="text-center py-12">
                <h3 className="text-sm font-inter-extralight-italic text-gray-900 mb-2">
                  Aucun cours programmé à cette date
                </h3>
              </div>
            ) : shouldShowCourses ? (
              <div
                className={`space-y-4 mb-10 transition-all duration-300 ${
                  isTransitioning
                    ? "opacity-50 scale-[0.98]"
                    : "opacity-100 scale-100"
                }`}
              >
                {displayedCourses.map((course, index) => (
                  <CourseCardAdmin
                    key={course.id || index}
                    course={course}
                    selectedDate={selectedDate}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                  />
                ))}
              </div>
            ) : null}

            {/* Indicateur de transition en overlay */}
            {isTransitioning && displayedCourses.length > 0 && (
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[0.5px] z-10 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                  <Loader size={16} color="var(--color-encoregreen)" />
                  <span className="text-xs text-gray-600 font-medium">
                    Mise à jour...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de création de cours */}
        <CourseFormModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          mode="create"
          selectedDate={selectedDate}
        />

        {/* Modal d'édition de cours */}
        <CourseFormModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          course={selectedCourseForEdit}
          mode="edit"
          selectedDate={selectedDate}
        />

        {/* Modal de suppression de cours */}
        <DeleteCourseModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          course={selectedCourseForDelete}
          selectedDate={selectedDate}
        />
      </div>
    </BackgroundWrapper>
  );
};

export default AdminCoursesPage;
