"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isBefore,
  startOfDay,
} from "date-fns";
import { CourseType, FormattedCourse } from "@/types/types";

export type UseReservationReturn = {
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
  handleReserverClick: (course: FormattedCourse, selectedDate: Date) => void;
  handleQuitterClick: (course: FormattedCourse) => void;
};

export function useReservation(): UseReservationReturn {
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

  const updateURL = (courseType: string, date: Date) => {
    const params = new URLSearchParams();
    if (courseType !== "all") {
      params.set("courseType", courseType);
    }
    params.set("date", format(date, "yyyy-MM-dd"));

    const newURL = `/reservation?${params.toString()}`;
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

  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedDate) return;

      // Si c'est le premier chargement, on met loading à true
      if (courses.length === 0) {
        setLoading(true);
      }

      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        let url = `/api/calendar?date=${formattedDate}`;

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
    };

    fetchCourses();
  }, [selectedDate, selectedCourseType, courses.length]);

  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const handleReserverClick = (
    course: FormattedCourse,
    _selectedDate: Date
  ) => {
    if (course.isFull) {
      return;
    }
    router.push(`/checkout?courseId=${course.id}`);
  };

  const handleQuitterClick = (_course: FormattedCourse) => {
    // Cette fonction n'est plus utilisée mais gardée pour la compatibilité
    // L'annulation se fait maintenant depuis la page account
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
    handleReserverClick,
    handleQuitterClick,
  };
}
