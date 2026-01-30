"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { CourseType, FormattedCourse } from "@/types/types";

export type UseAdminCoursesReturn = {
  selectedCourseType: string;
  selectedDate: Date;
  courseTypes: CourseType[];
  courses: FormattedCourse[];
  loading: boolean;
  weekDays: Date[];
  handleCourseTypeChange: (courseType: string) => void;
  handleDateChange: (date: Date | undefined) => void;
  handleDayClick: (date: Date) => void;
  handleWeekNavigation: (direction: "prev" | "next") => void;
  handleDayNavigation: (direction: "prev" | "next") => void;
  isPastDate: (date: Date) => boolean;
  handleEditCourse: (course: FormattedCourse) => void;
  handleCreateCourse: () => void;
  handleDeleteCourse: (course: FormattedCourse) => void;
  handleCloseModal: () => void;
  selectedCourseForEdit: FormattedCourse | null;
  selectedCourseForDelete: FormattedCourse | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  refreshCourses: () => void;
};

export function useAdminCourses(): UseAdminCoursesReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCourseType = searchParams.get("courseType") || "all";
  const urlDate = searchParams.get("date");

  const [selectedCourseType, setSelectedCourseType] =
    useState<string>(urlCourseType);
  const [selectedDate, setSelectedDate] = useState<Date>(
    urlDate ? new Date(urlDate) : new Date()
  );
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [courses, setCourses] = useState<FormattedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForEdit, setSelectedCourseForEdit] =
    useState<FormattedCourse | null>(null);
  const [selectedCourseForDelete, setSelectedCourseForDelete] =
    useState<FormattedCourse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const updateURL = (courseType: string, date: Date) => {
    const params = new URLSearchParams();
    if (courseType !== "all") {
      params.set("courseType", courseType);
    }
    params.set("date", format(date, "yyyy-MM-dd"));

    const newURL = `/admin/cours?${params.toString()}`;
    router.replace(newURL, { scroll: false });
  };

  const handleCourseTypeChange = (courseType: string) => {
    setSelectedCourseType(courseType);
    updateURL(courseType, selectedDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateURL(selectedCourseType, date);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    updateURL(selectedCourseType, date);
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    const newDate =
      direction === "prev"
        ? subDays(selectedDate, 1)
        : addDays(selectedDate, 1);
    setSelectedDate(newDate);
    updateURL(selectedCourseType, newDate);
  };

  const handleDayNavigation = (direction: "prev" | "next") => {
    const newDate =
      direction === "prev"
        ? subDays(selectedDate, 1)
        : addDays(selectedDate, 1);
    setSelectedDate(newDate);
    updateURL(selectedCourseType, newDate);
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  useEffect(() => {
    const currentUrlCourseType = searchParams.get("courseType") || "all";
    const currentUrlDate = searchParams.get("date");

    if (currentUrlCourseType !== selectedCourseType) {
      setSelectedCourseType(currentUrlCourseType);
    }

    if (
      currentUrlDate &&
      new Date(currentUrlDate).getTime() !== selectedDate.getTime()
    ) {
      setSelectedDate(new Date(currentUrlDate));
    }
  }, [searchParams, selectedCourseType, selectedDate]);

  useEffect(() => {
    const fetchCourseTypes = async () => {
      try {
        const response = await fetch("/api/course-type?is_active=true");
        const data = await response.json();
        if (data.success) {
          setCourseTypes(data.data);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des types de cours:",
          error
        );
      }
    };

    fetchCourseTypes();
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!selectedDate) return;

    // Si c'est le premier chargement, on met loading à true
    if (courses.length === 0) {
      setLoading(true);
    }

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      let url = `/api/calendar?date=${formattedDate}&admin=true`;

      if (selectedCourseType !== "all") {
        url += `&courseType=${selectedCourseType}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des cours:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedCourseType, courses.length]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isPastDate = (_date: Date) => {
    // Pour l'admin, on permet de naviguer vers les dates passées
    // mais on peut garder une indication visuelle si nécessaire
    return false; // Désactive le blocage des dates passées pour l'admin
  };

  const handleEditCourse = (course: FormattedCourse) => {
    setSelectedCourseForEdit(course);
    setIsEditModalOpen(true);
  };

  const handleCreateCourse = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteCourse = (course: FormattedCourse) => {
    setSelectedCourseForDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedCourseForEdit(null);
    setSelectedCourseForDelete(null);
  };

  const refreshCourses = () => {
    fetchCourses();
  };

  return {
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
    isPastDate,
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
  };
}
