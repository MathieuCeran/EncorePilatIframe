"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type Reservation = {
  id: string;
  status: string;
  created_at: string;
  course: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    course_type: { id: string; name: string };
    instructor?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  };
};

type FormattedCourse = {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string;
};

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reservation?: Reservation | null;
  course?: FormattedCourse | null;
}

export default function CancellationModal({
  isOpen,
  onClose,
  onSuccess,
  reservation,
  course,
}: CancellationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || (!reservation && !course)) return null;

  // Déterminer les données du cours
  let courseDate: string;
  let courseTime: string;
  let courseName: string;
  let instructor: string;

  if (reservation) {
    courseDate = format(new Date(reservation.course.date), "EEEE, dd MMMM", {
      locale: fr,
    });
    courseTime = `${reservation.course.start_time} - ${reservation.course.end_time}`;
    courseName = reservation.course.course_type.name;
    instructor = reservation.course.instructor
      ? `${reservation.course.instructor.first_name || ""} ${reservation.course.instructor.last_name || ""}`.trim()
      : "Encore Studio";
  } else if (course) {
    // course.date is now in YYYY-MM-DD format, so we can safely create a Date object
    courseDate = format(new Date(course.date + "T00:00:00"), "EEEE, dd MMMM", {
      locale: fr,
    });
    courseTime = `${course.startTime} - ${course.endTime}`;
    courseName = course.name;
    instructor = course.instructor;
  } else {
    return null;
  }

  const handleConfirmCancellation = async () => {
    setIsLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté
      const response = await fetch("/api/me/profile");
      if (!response.ok) {
        toast.error("Vous devez être connecté pour annuler une réservation", {
          icon: "🔒",
          duration: 3000,
        });
        return;
      }

      let bookingId: string;

      if (reservation) {
        // Si on a une reservation, utiliser son ID directement
        bookingId = reservation.id;
      } else if (course) {
        // Si on a un course, chercher la réservation correspondante
        const bookingsResponse = await fetch("/api/my-bookings");
        if (!bookingsResponse.ok) {
          toast.error("Erreur lors de la récupération de vos réservations", {
            icon: "⚠️",
            duration: 3000,
          });
          return;
        }

        const bookingsData = await bookingsResponse.json();
        const userBooking = bookingsData.data?.find(
          (booking: { course: { id: string }; status: string }) =>
            booking.course.id === course.id && booking.status === "confirmed"
        );

        if (!userBooking) {
          toast.error("Aucune réservation trouvée pour ce cours", {
            icon: "⚠️",
            duration: 3000,
          });
          return;
        }

        bookingId = userBooking.id;
      } else {
        toast.error("Données de cours manquantes", {
          icon: "❌",
          duration: 3000,
        });
        return;
      }

      // Vérifier le délai de 12h minimum
      const courseDateTime = reservation
        ? new Date(
            `${reservation.course.date} ${reservation.course.start_time}`
          )
        : new Date(`${course!.date} ${course!.startTime}`);

      const now = new Date();
      const hoursUntilCourse =
        (courseDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCourse < 12) {
        toast.error("Annulation impossible : moins de 12h avant le cours", {
          icon: "⏰",
          duration: 4000,
        });
        return;
      }

      // Appeler l'API d'annulation
      const cancelResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        toast.error(errorData.error || "Erreur lors de l'annulation", {
          icon: "❌",
          duration: 4000,
        });
        return;
      }

      toast.success("Réservation annulée avec succès", {
        icon: "✅",
        duration: 3000,
      });

      // Fermer la modal et appeler le callback de succès
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      toast.error("Erreur lors de l'annulation de la réservation", {
        icon: "❌",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Annuler la réservation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir annuler votre réservation ? Cette action ne
            peut pas être annulée.
          </p>

          {/* Course Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">{courseName}</h4>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{courseDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{courseTime}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{instructor}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Important :</strong> L&apos;annulation doit être
                effectuée au moins 12h avant le début du cours.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmCancellation}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-encorerouge rounded-lg hover:bg-encorerouge/80 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Annulation...
              </div>
            ) : (
              "Confirmer l'annulation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
