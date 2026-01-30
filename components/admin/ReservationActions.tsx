"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, X, UserCheck, UserX, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BookingWithDetails } from "@/types/types";

interface ReservationActionsProps {
  reservation: BookingWithDetails;
  onUpdate: () => void;
}

export default function ReservationActions({
  reservation,
  onUpdate,
}: ReservationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "cancel" | "present" | "absent" | null
  >(null);

  const handleCancelReservation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/${reservation.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Réservation annulée avec succès");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'annulation"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleMarkPresence = async (presente: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/reservations/${reservation.id}/presence`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            presente,
            date_presence: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(presente ? "Présence confirmée" : "Absence marquée");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleAction = (type: "cancel" | "present" | "absent") => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    if (actionType === "cancel") {
      handleCancelReservation();
    } else if (actionType === "present") {
      handleMarkPresence(true);
    } else if (actionType === "absent") {
      handleMarkPresence(false);
    }
  };

  const canCancel = reservation.statut === "confirmed";
  const canMarkPresence = reservation.statut === "confirmed";
  const courseDate = reservation.courses?.date
    ? new Date(reservation.courses.date)
    : null;
  const isPastCourse = courseDate && courseDate < new Date();

  if (!canCancel && !canMarkPresence) {
    return <span className="text-muted-foreground text-sm">Aucune action</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canMarkPresence && isPastCourse && (
            <>
              <DropdownMenuItem
                onClick={() => handleAction("present")}
                className="cursor-pointer text-green-600"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Marquer présent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAction("absent")}
                className="cursor-pointer text-orange-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Marquer absent
              </DropdownMenuItem>
              {canCancel && <DropdownMenuSeparator />}
            </>
          )}

          {canCancel && (
            <DropdownMenuItem
              onClick={() => handleAction("cancel")}
              className="cursor-pointer text-red-600"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler la réservation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "cancel" && "Annuler la réservation"}
              {actionType === "present" && "Marquer comme présent"}
              {actionType === "absent" && "Marquer comme absent"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "cancel" && (
                <>
                  Êtes-vous sûr de vouloir annuler cette réservation ?
                  <br />
                  Cette action libérera la place dans le cours.
                  <br />
                  <strong>Cours :</strong>{" "}
                  {reservation.courses?.course_types?.name || "Cours inconnu"}
                  <br />
                  <strong>Date :</strong>{" "}
                  {courseDate
                    ? courseDate.toLocaleDateString("fr-FR")
                    : "Date inconnue"}
                </>
              )}
              {actionType === "present" && (
                <>
                  Confirmer la présence de l&apos;utilisateur à ce cours ?
                  <br />
                  <strong>Cours :</strong>{" "}
                  {reservation.courses?.course_types?.name || "Cours inconnu"}
                  <br />
                  <strong>Date :</strong>{" "}
                  {courseDate
                    ? courseDate.toLocaleDateString("fr-FR")
                    : "Date inconnue"}
                </>
              )}
              {actionType === "absent" && (
                <>
                  Marquer l&apos;utilisateur comme absent à ce cours ?
                  <br />
                  <strong>Cours :</strong>{" "}
                  {reservation.courses?.course_types?.name || "Cours inconnu"}
                  <br />
                  <strong>Date :</strong>{" "}
                  {courseDate
                    ? courseDate.toLocaleDateString("fr-FR")
                    : "Date inconnue"}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={isLoading}
              className={
                actionType === "cancel" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : actionType === "cancel" ? (
                <X className="mr-2 h-4 w-4" />
              ) : actionType === "present" ? (
                <UserCheck className="mr-2 h-4 w-4" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              {actionType === "cancel" && "Annuler la réservation"}
              {actionType === "present" && "Confirmer présence"}
              {actionType === "absent" && "Marquer absent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
