"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormattedCourse } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course: FormattedCourse | null;
  selectedDate: Date;
}

export function DeleteCourseModal({
  isOpen,
  onClose,
  onSuccess,
  course,
  selectedDate,
}: DeleteCourseModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!course) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Cours supprimé avec succès !");
        onSuccess();
        onClose();
      } else {
        toast.error(
          data.message || "Une erreur est survenue lors de la suppression"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Annuler le cours</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir annuler ce cours ? Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du cours */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Cours :</span> {course.name}
              </div>
              <div>
                <span className="font-medium">Date :</span>{" "}
                {format(selectedDate, "EEEE, dd MMMM", { locale: fr })}
              </div>
              <div>
                <span className="font-medium">Horaire :</span>{" "}
                {course.startTime} - {course.endTime}
              </div>
              <div>
                <span className="font-medium">Instructeur :</span>{" "}
                {course.instructor}
              </div>
              <div>
                <span className="font-medium">Réservations :</span>{" "}
                {course.current_bookings}/{course.max_capacity}
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ Attention : Ce cours a {course.current_bookings}{" "}
              réservation(s). La suppression annulera toutes les réservations
              existantes.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              color="encorered"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Annulation..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
