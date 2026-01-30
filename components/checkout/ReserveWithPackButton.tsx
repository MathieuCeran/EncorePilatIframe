import React, { useState } from "react";
import Button from "@/components/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormattedCourse } from "@/types/types";
import { UserPackData } from "@/types/checkout";
import { toast } from "sonner";

interface ReserveWithPackButtonProps {
  course: FormattedCourse;
  userPack: UserPackData;
  size?: "sm" | "md" | "lg";
  isMobile?: boolean;
}

export const ReserveWithPackButton: React.FC<ReserveWithPackButtonProps> = ({
  course,
  userPack,
  size = "md",
  isMobile = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleReserve = async () => {
    if (!course || !userPack?.pack?.id) {
      toast.error("Données manquantes pour la réservation");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/bookings/with-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          pack_id: userPack.pack.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Impossible d'effectuer la réservation", {
          description: data.error || "Une erreur s'est produite",
        });
      } else {
        const remainingText =
          data.pack_remaining > 0
            ? `Il vous reste ${data.pack_remaining} cours dans votre pack.`
            : "Vous avez utilisé tous vos cours de ce pack.";

        toast.success("Réservation confirmée avec votre pack !", {
          description: `Vous êtes inscrit au cours du ${format(new Date(course.date + "T00:00:00"), "EEEE, dd MMMM", { locale: fr })} à ${course.startTime}. ${remainingText}`,
        });

        // Rediriger vers la page de succès avec l'ID de la réservation
        setTimeout(() => {
          window.location.href = `/checkout/success-pack?booking_id=${data.booking_id}`;
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error("Erreur réseau lors de la réservation", {
        description: "Vérifiez votre connexion et réessayez.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = isMobile ? "sm" : size;
  const containerClass = isMobile
    ? "space-y-4 text-center"
    : "mb-4 text-center";

  return (
    <div className={containerClass}>
      <Button
        size={buttonSize}
        variant="filled"
        bgColor="bg-encoregreen"
        textColor="text-white"
        hoverBgColor="hover:bg-encoregreen/80"
        shadow={false}
        className={isMobile ? "font-chillax" : "font-chillax"}
        onClick={handleReserve}
        disabled={isLoading}
      >
        {isLoading ? "Réservation en cours..." : "Réserver avec mon Pack"}
      </Button>
    </div>
  );
};
