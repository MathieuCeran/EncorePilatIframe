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
import { MoreHorizontal, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CommandeWithPack } from "@/types/types";

interface CommandeActionsProps {
  commande: CommandeWithPack;
  onUpdate: () => void;
}

export default function CommandeActions({
  commande,
  onUpdate,
}: CommandeActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | null>(
    null
  );

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/commandes/${commande.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: "paid",
          date_paiement: new Date().toISOString(),
          notes: "Paiement confirmé par admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Paiement confirmé avec succès");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de la confirmation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la confirmation"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/commandes/${commande.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Commande annulée avec succès");
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

  const handleAction = (type: "confirm" | "cancel") => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    if (actionType === "confirm") {
      handleConfirmPayment();
    } else if (actionType === "cancel") {
      handleCancelOrder();
    }
  };

  const canConfirm = commande.statut === "pending";
  const canCancel = commande.statut === "pending";

  if (!canConfirm && !canCancel) {
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
          {canConfirm && (
            <DropdownMenuItem
              onClick={() => handleAction("confirm")}
              className="cursor-pointer"
            >
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Confirmer le paiement
            </DropdownMenuItem>
          )}
          {canCancel && (
            <>
              {canConfirm && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleAction("cancel")}
                className="cursor-pointer text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Annuler la commande
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "confirm"
                ? "Confirmer le paiement"
                : "Annuler la commande"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "confirm" ? (
                <>
                  Êtes-vous sûr de vouloir confirmer le paiement de cette
                  commande ?
                  <br />
                  <strong>Montant :</strong> {commande.montant_total.toFixed(2)}{" "}
                  MAD
                  <br />
                  <strong>Pack :</strong>{" "}
                  {commande.packs?.nom || "Pack inconnu"}
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir annuler cette commande ?
                  <br />
                  Cette action annulera également toutes les réservations
                  associées et libérera les places dans les cours.
                  <br />
                  <strong>Commande :</strong> {commande.id}
                  <br />
                  <strong>Pack :</strong>{" "}
                  {commande.packs?.nom || "Pack inconnu"}
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
              ) : actionType === "confirm" ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {actionType === "confirm" ? "Confirmer" : "Annuler la commande"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
