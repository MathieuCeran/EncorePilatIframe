"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { FormattedCourse, CourseType } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course?: FormattedCourse | null;
  mode: "create" | "edit";
  selectedDate: Date;
}

interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
}

interface CourseFormData {
  courseTypeId: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  date: string;
  intensity: number;
  status: string;
  name: string;
}

export function CourseFormModal({
  isOpen,
  onClose,
  onSuccess,
  course,
  mode,
  selectedDate,
}: CourseFormModalProps) {
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    courseTypeId: "",
    instructorId: "",
    startTime: "",
    endTime: "",
    maxCapacity: 10,
    date: format(selectedDate, "yyyy-MM-dd"),
    intensity: 1, // Par défaut "Tous niveaux"
    status: "active",
    name: "",
  });

  // Charger les types de cours et instructeurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les types de cours
        const courseTypesResponse = await fetch(
          "/api/course-type?is_active=true"
        );
        const courseTypesData = await courseTypesResponse.json();
        if (courseTypesData.success) {
          setCourseTypes(courseTypesData.data);
        }

        // Charger les instructeurs
        const instructorsResponse = await fetch("/api/admin/profs");
        const instructorsData = await instructorsResponse.json();
        if (instructorsData.success) {
          setInstructors(instructorsData.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Initialiser le formulaire avec les données du cours si en mode édition
  useEffect(() => {
    if (course && mode === "edit") {
      // Mapper l'ancienne intensité (1-4) vers la nouvelle (1-3) si nécessaire
      let mappedIntensity = course.intensity || 1;
      if (mappedIntensity > 3) {
        // Rétrocompatibilité: 4 → 3 (Intense)
        mappedIntensity = 3;
      } else if (mappedIntensity < 1) {
        mappedIntensity = 1;
      }
      
      setFormData({
        courseTypeId: course.courseTypeId || "",
        instructorId: course.instructorId || "",
        startTime: course.startTime || "",
        endTime: course.endTime || "",
        maxCapacity: course.max_capacity || 10,
        date: format(selectedDate, "yyyy-MM-dd"),
        intensity: mappedIntensity,
        status: course.status || "active",
        name: course.name || "",
      });
    } else {
      setFormData({
        courseTypeId: "",
        instructorId: "",
        startTime: "",
        endTime: "",
        maxCapacity: 10,
        date: format(selectedDate, "yyyy-MM-dd"),
        intensity: 1, // Par défaut "Tous niveaux"
        status: "active",
        name: "",
      });
    }
  }, [course, mode, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/admin/courses"
          : `/api/admin/courses/${course?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          mode === "create"
            ? "Cours créé avec succès !"
            : "Cours modifié avec succès !"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CourseFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Vérifier si la date n'est pas dans le passé (sauf pour l'édition)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (mode === "create" && date < today) {
        toast.error("Impossible de créer un cours dans le passé");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        date: format(date, "yyyy-MM-dd"),
      }));
    }
  };

  // Fonction pour désactiver les dates passées lors de la création
  const disabledDates = (date: Date) => {
    if (mode === "create") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    }
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Créer un nouveau cours" : "Modifier le cours"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(new Date(formData.date), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date ? new Date(formData.date) : undefined
                    }
                    onSelect={handleDateSelect}
                    initialFocus
                    className="bg-white"
                    disabled={disabledDates}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Nom du cours */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nom du cours</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Course de Yoga"
                required
              />
            </div>
          </div>

          {/* Type de cours et Instructeur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courseType">Type de cours</Label>
              <Select
                value={formData.courseTypeId}
                onValueChange={(value) =>
                  handleInputChange("courseTypeId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {courseTypes.map((courseType) => (
                    <SelectItem key={courseType.id} value={courseType.id}>
                      {courseType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instructor">Instructeur</Label>
              <Select
                value={formData.instructorId}
                onValueChange={(value) =>
                  handleInputChange("instructorId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un instructeur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Heures de début et fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <TimePicker
                value={formData.startTime}
                onChange={(time) => handleInputChange("startTime", time)}
                placeholder="Heure de début"
              />
            </div>
            <div>
              <Label htmlFor="endTime">Heure de fin</Label>
              <TimePicker
                value={formData.endTime}
                onChange={(time) => handleInputChange("endTime", time)}
                placeholder="Heure de fin"
              />
            </div>
          </div>

          {/* Capacité maximale et Niveau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxCapacity">Capacité maximale</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                max="50"
                value={formData.maxCapacity}
                onChange={(e) =>
                  handleInputChange("maxCapacity", parseInt(e.target.value))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="intensity">Niveau</Label>
              <Select
                value={formData.intensity.toString()}
                onValueChange={(value) =>
                  handleInputChange("intensity", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Niveau du cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tous niveaux</SelectItem>
                  <SelectItem value="2">Intermédiaire</SelectItem>
                  <SelectItem value="3">Intense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut du cours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-encoregreen hover:bg-encoregreen/80"
            >
              {loading
                ? "Sauvegarde..."
                : mode === "create"
                  ? "Créer"
                  : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
