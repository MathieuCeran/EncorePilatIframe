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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Edit, Trash2, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { PackWithDetails } from "@/types/types";

interface PackActionsProps {
  pack: PackWithDetails;
  userId: string;
  onUpdate: () => void;
}

export default function PackActions({
  pack,
  userId,
  onUpdate,
}: PackActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "delete" | "expire" | "activate" | null
  >(null);

  // États pour l'édition
  const [editForm, setEditForm] = useState({
    cours_restants: pack.cours_restants,
    statut: pack.statut,
    date_expiration: pack.date_expiration
      ? new Date(pack.date_expiration).toISOString().split("T")[0]
      : "",
  });

  const handleDeletePack = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/users/${userId}/packs/${pack.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Pack supprimé avec succès");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleExpirePack = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/users/${userId}/packs/${pack.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statut: "expired",
            date_expiration: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Pack expiré avec succès");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de l'expiration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'expiration"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleActivatePack = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/users/${userId}/packs/${pack.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statut: "active",
            date_expiration: null,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Pack réactivé avec succès");
        onUpdate();
      } else {
        throw new Error(result.message || "Erreur lors de la réactivation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réactivation"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const handleEditPack = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/users/${userId}/packs/${pack.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cours_restants: parseInt(editForm.cours_restants.toString()),
            statut: editForm.statut,
            date_expiration: editForm.date_expiration || null,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Pack modifié avec succès");
        onUpdate();
        setShowEditDialog(false);
      } else {
        throw new Error(result.message || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (type: "delete" | "expire" | "activate") => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    if (actionType === "delete") {
      handleDeletePack();
    } else if (actionType === "expire") {
      handleExpirePack();
    } else if (actionType === "activate") {
      handleActivatePack();
    }
  };

  const canEdit = ["active", "pending", "expired"].includes(pack.statut);
  const canDelete = true; // Peut toujours supprimer
  const canExpire = pack.statut === "active";
  const canActivate = ["expired", "cancelled"].includes(pack.statut);

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
          {canEdit && (
            <DropdownMenuItem
              onClick={() => setShowEditDialog(true)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          )}

          {canActivate && (
            <DropdownMenuItem
              onClick={() => handleAction("activate")}
              className="cursor-pointer text-green-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réactiver
            </DropdownMenuItem>
          )}

          {canExpire && (
            <DropdownMenuItem
              onClick={() => handleAction("expire")}
              className="cursor-pointer text-orange-600"
            >
              <Clock className="mr-2 h-4 w-4" />
              Expirer
            </DropdownMenuItem>
          )}

          {(canEdit || canActivate || canExpire) && canDelete && (
            <DropdownMenuSeparator />
          )}

          {canDelete && (
            <DropdownMenuItem
              onClick={() => handleAction("delete")}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le pack</DialogTitle>
            <DialogDescription>
              {pack.packs?.nom || "Pack inconnu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cours_restants">Cours restants</Label>
              <Input
                id="cours_restants"
                type="number"
                min="0"
                value={editForm.cours_restants}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    cours_restants: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={editForm.statut}
                onValueChange={(
                  value:
                    | "active"
                    | "expired"
                    | "consumed"
                    | "pending"
                    | "cancelled"
                ) => setEditForm((prev) => ({ ...prev, statut: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="consumed">Consommé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_expiration">Date d&apos;expiration</Label>
              <Input
                id="date_expiration"
                type="date"
                value={editForm.date_expiration}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    date_expiration: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleEditPack} disabled={isLoading}>
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete" && "Supprimer le pack"}
              {actionType === "expire" && "Expirer le pack"}
              {actionType === "activate" && "Réactiver le pack"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete" && (
                <>
                  Êtes-vous sûr de vouloir supprimer ce pack ? Cette action est
                  irréversible.
                  <br />
                  <strong>Pack :</strong> {pack.packs?.nom || "Pack inconnu"}
                  <br />
                  <strong>Cours restants :</strong> {pack.cours_restants}
                </>
              )}
              {actionType === "expire" && (
                <>
                  Êtes-vous sûr de vouloir expirer ce pack ?
                  <br />
                  <strong>Pack :</strong> {pack.packs?.nom || "Pack inconnu"}
                  <br />
                  <strong>Cours restants :</strong> {pack.cours_restants}
                </>
              )}
              {actionType === "activate" && (
                <>
                  Êtes-vous sûr de vouloir réactiver ce pack ?
                  <br />
                  <strong>Pack :</strong> {pack.packs?.nom || "Pack inconnu"}
                  <br />
                  <strong>Statut actuel :</strong> {pack.statut}
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
                actionType === "delete" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "delete" && "Supprimer"}
              {actionType === "expire" && "Expirer"}
              {actionType === "activate" && "Réactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
