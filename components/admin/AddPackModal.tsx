"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Pack {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  nombre_cours_total: number;
  type_pack: string;
}

interface AddPackModalProps {
  userId: string;
  onPackAdded: () => void;
}

export default function AddPackModal({
  userId,
  onPackAdded,
}: AddPackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<Pack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  const [formData, setFormData] = useState({
    pack_id: "",
    cours_restants: 0,
    statut: "active" as "active" | "pending" | "expired" | "cancelled",
    date_expiration: "",
    notes: "",
  });

  // Charger les packs disponibles
  const loadAvailablePacks = async () => {
    try {
      setLoadingPacks(true);
      const response = await fetch("/api/admin/packs");
      const result = await response.json();

      if (result.success) {
        setAvailablePacks(result.data);
      } else {
        throw new Error(
          result.message || "Erreur lors du chargement des packs"
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les packs disponibles");
    } finally {
      setLoadingPacks(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailablePacks();
    }
  }, [isOpen]);

  // Mettre à jour le nombre de cours restants quand un pack est sélectionné
  useEffect(() => {
    const selectedPack = availablePacks.find(
      (pack) => pack.id === formData.pack_id
    );
    if (selectedPack) {
      setFormData((prev) => ({
        ...prev,
        cours_restants: selectedPack.nombre_cours_total,
      }));
    }
  }, [formData.pack_id, availablePacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pack_id) {
      toast.error("Veuillez sélectionner un pack");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/packs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pack_id: formData.pack_id,
          cours_restants: formData.cours_restants,
          statut: formData.statut,
          date_expiration: formData.date_expiration || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Pack ajouté avec succès");
        setIsOpen(false);
        setFormData({
          pack_id: "",
          cours_restants: 0,
          statut: "active",
          date_expiration: "",
          notes: "",
        });
        onPackAdded();
      } else {
        throw new Error(result.message || "Erreur lors de l'ajout du pack");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout du pack"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPack = availablePacks.find(
    (pack) => pack.id === formData.pack_id
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un pack
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un pack manuellement</DialogTitle>
          <DialogDescription>
            Attribuer un pack existant à cet utilisateur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du pack */}
          <div>
            <Label htmlFor="pack_id">Pack *</Label>
            {loadingPacks ? (
              <div className="flex items-center justify-center h-10 border rounded">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.pack_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, pack_id: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un pack..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePacks.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      <div>
                        <div className="font-medium">{pack.nom}</div>
                        <div className="text-sm text-muted-foreground">
                          {pack.prix.toFixed(2)} MAD - {pack.nombre_cours_total}{" "}
                          cours
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Détails du pack sélectionné */}
          {selectedPack && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div>
                  <strong>Type :</strong> {selectedPack.type_pack}
                </div>
                <div>
                  <strong>Prix :</strong> {selectedPack.prix.toFixed(2)} MAD
                </div>
                <div>
                  <strong>Cours total :</strong>{" "}
                  {selectedPack.nombre_cours_total}
                </div>
                {selectedPack.description && (
                  <div>
                    <strong>Description :</strong> {selectedPack.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cours restants */}
          <div>
            <Label htmlFor="cours_restants">Cours restants *</Label>
            <Input
              id="cours_restants"
              type="number"
              min="0"
              max={selectedPack?.nombre_cours_total || 999}
              value={formData.cours_restants}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cours_restants: parseInt(e.target.value) || 0,
                }))
              }
              required
            />
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={formData.statut}
              onValueChange={(
                value: "active" | "pending" | "expired" | "cancelled"
              ) => setFormData((prev) => ({ ...prev, statut: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date d'expiration */}
          <div>
            <Label htmlFor="date_expiration">
              Date d&apos;expiration (optionnel)
            </Label>
            <Input
              id="date_expiration"
              type="date"
              value={formData.date_expiration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_expiration: e.target.value,
                }))
              }
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes administratives..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.pack_id}>
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter le pack
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
