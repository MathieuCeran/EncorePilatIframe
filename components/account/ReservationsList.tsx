"use client";
import React, { useState } from "react";
import { User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CancellationModal from "@/components/CancellationModal";
import Button from "../button";

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

type Props = {
  reservations: Reservation[];
  emptyLabel?: string;
  view: string;
  onInvite?: (reservation: Reservation) => void;
};

export default function ReservationsList({
  reservations,
  emptyLabel,
  view,
  onInvite,
}: Props) {
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInviteClick = (reservation: Reservation) => {
    if (onInvite) {
      onInvite(reservation);
      return;
    }

    // Fallback implementation similar to useReservation hook
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/checkout?courseId=${reservation.course.id}`;

    const courseDate = format(
      new Date(reservation.course.date),
      "EEEE, dd MMMM",
      { locale: fr }
    );
    const courseTime = reservation.course.start_time;
    const courseName = reservation.course.course_type.name;

    const message = `Je t'invite à venir au cours de ${courseName} le ${courseDate} à ${courseTime} chez encore studio.
    Pour réserver, clique sur le lien suivant : ${inviteLink}`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        // Toast de succès géré par le composant CancellationModal
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        // Toast d'erreur géré par le composant CancellationModal
      });
  };

  const handleQuitterClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleSuccess = () => {
    // Recharger la page pour mettre à jour l'affichage
    window.location.reload();
  };

  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-2 py-4 text-center">
        {emptyLabel || "Aucune réservation à venir"}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reservations.map((r) => {
          const d = new Date(r.course.date);
          const dateLabel = d.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          });

          // Format times to remove seconds (HH:MM format)
          const formatTime = (time: string) => {
            return time.substring(0, 5); // Take only HH:MM part
          };

          const timeLabel = `${formatTime(r.course.start_time)}/${formatTime(r.course.end_time)} - ${r.course.course_type?.name}`;
          const teacher = r.course.instructor
            ? `${r.course.instructor.first_name || ""} ${r.course.instructor.last_name || ""}`.trim()
            : "Encore Studio";

          return (
            <div
              key={r.id}
              className="rounded-xl bg-encoregreen text-white p-4 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-lg font-semibold mb-1">{timeLabel}</div>
                  <div className="text-sm opacity-90 mb-2">{dateLabel}</div>
                  <div className="space-y-1 text-sm opacity-95">
                    {teacher && (
                      <div className="flex items-center gap-1">
                        <span>
                          <User className="w-4 h-4" />
                        </span>
                        <span>{teacher}</span>
                      </div>
                    )}
                  </div>
                </div>
                {view !== "past" && (
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleInviteClick(r)}
                      variant="filled"
                      bgColor="bg-encoregreen"
                      border={true}
                      textColor="text-white"
                      hoverBgColor="hover:bg-encoregreen/80"
                      shadow={false}
                      size="sm"
                    >
                      Inviter
                    </Button>
                    <Button
                      onClick={() => handleQuitterClick(r)}
                      variant="filled"
                      bgColor="bg-encoregreen"
                      border={true}
                      textColor="text-white"
                      hoverBgColor="hover:bg-encoregreen/80"
                      shadow={false}
                      size="sm"
                    >
                      Annuler la réservation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        reservation={selectedReservation}
      />
    </>
  );
}
