"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import {
  DataTable,
  Column,
  FilterOption,
  Action,
} from "@/components/ui/data-table";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { DynamicForm } from "@/components/ui/dynamic-form";

interface Pack {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  type_pack: "decouverte" | "mono_cours" | "multi_cours";
  duree_validite_jours?: number | null;
  nombre_cours_total?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  limitations?: Array<{
    id: string;
    pack_id: string;
    course_type_id: string;
    max_utilisations: number | null;
  }>;
}

interface CourseType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
}

const PacksPage = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packToDelete, setPackToDelete] = useState<Pack | null>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: 0,
    type_pack: "decouverte" as "decouverte" | "mono_cours" | "multi_cours",
    duree_validite_jours: 0,
    nombre_cours_total: 0,
    is_active: true,
    limitations: [] as Array<{
      course_type_id: string;
      max_utilisations: number | null;
    }>,
  });

  // Handler for form changes
  const handleFormChange = (
    key: string,
    value:
      | string
      | number
      | boolean
      | string[]
      | Array<{ course_type_id: string; max_utilisations: number | null }>
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Charger les packs et types de cours
  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les packs
      const packsResponse = await fetch("/api/admin/packs");
      const packsData = await packsResponse.json();

      if (packsData.success) {
        setPacks(packsData.data);
      }

      // Charger les types de cours
      const courseTypesResponse = await fetch("/api/course-type");
      const courseTypesData = await courseTypesResponse.json();

      if (courseTypesData.success) {
        setCourseTypes(courseTypesData.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      prix: 0,
      type_pack: "decouverte",
      duree_validite_jours: 0,
      nombre_cours_total: 0,
      is_active: true,
      limitations: [{ course_type_id: "", max_utilisations: null }],
    });
  };

  // Ouvrir le dialogue de création
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Ouvrir le dialogue de modification
  const openEditDialog = (pack: Pack) => {
    setSelectedPack(pack);
    setFormData({
      nom: pack.nom,
      description: pack.description || "",
      prix: pack.prix,
      type_pack: pack.type_pack,
      duree_validite_jours: pack.duree_validite_jours || 0,
      nombre_cours_total: pack.nombre_cours_total || 0,
      is_active: pack.is_active,
      limitations: pack.limitations?.map((limitation) => ({
        course_type_id: limitation.course_type_id,
        max_utilisations: limitation.max_utilisations,
      })) || [{ course_type_id: "", max_utilisations: null }],
    });
    setIsEditDialogOpen(true);
  };

  // Ouvrir le dialogue de suppression
  const openDeleteDialog = (pack: Pack) => {
    setPackToDelete(pack);
    setIsDeleteDialogOpen(true);
  };

  // Ajouter un type de cours au formulaire
  const addCourseType = () => {
    setFormData((prev) => ({
      ...prev,
      limitations: [
        ...prev.limitations,
        { course_type_id: "", max_utilisations: null },
      ],
    }));
  };

  // Supprimer un type de cours du formulaire
  const removeCourseType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      limitations: prev.limitations.filter((_, i) => i !== index),
    }));
  };

  // Mettre à jour un type de cours dans le formulaire
  const updateCourseType = (
    index: number,
    field: "course_type_id" | "max_utilisations",
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      limitations: prev.limitations.map((ct, i) =>
        i === index ? { ...ct, [field]: value } : ct
      ),
    }));
  };

  // Créer un pack
  const createPack = async () => {
    try {
      const response = await fetch("/api/admin/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Pack créé avec succès");
        setIsCreateDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création");
    }
  };

  // Modifier un pack
  const updatePack = async () => {
    if (!selectedPack) return;

    try {
      const response = await fetch("/api/admin/packs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: selectedPack.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Pack modifié avec succès");
        setIsEditDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  // Supprimer un pack
  const deletePack = async () => {
    if (!packToDelete) return;

    try {
      const response = await fetch(`/api/admin/packs?id=${packToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        if (data.soft_deleted) {
          toast.success(
            "Pack supprimé avec succès (données utilisateurs préservées)"
          );
        } else {
          toast.success("Pack supprimé définitivement");
        }
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Colonnes pour le tableau
  const columns: Column<Pack>[] = [
    {
      key: "nom",
      header: "Nom",
      render: (pack) => pack.nom,
    },
    {
      key: "type_pack",
      header: "Type",
      render: (pack) => (
        <Badge
          variant={
            pack.type_pack === "decouverte"
              ? "default"
              : pack.type_pack === "mono_cours"
                ? "secondary"
                : "outline"
          }
        >
          {pack.type_pack === "decouverte"
            ? "Découverte"
            : pack.type_pack === "mono_cours"
              ? "Mono-cours"
              : "Multi-cours"}
        </Badge>
      ),
    },
    {
      key: "prix",
      header: "Prix",
      render: (pack) => `${pack.prix} MAD`,
    },
    {
      key: "duree_validite_jours",
      header: "Validité",
      render: (pack) =>
        pack.duree_validite_jours
          ? `${pack.duree_validite_jours} jours`
          : "Illimitée",
    },
    {
      key: "nombre_cours_total",
      header: "Cours totaux",
      render: (pack) =>
        pack.nombre_cours_total ? pack.nombre_cours_total.toString() : "N/A",
    },
    {
      key: "is_active",
      header: "Statut",
      render: (pack) => (
        <Badge variant={pack.is_active ? "default" : "secondary"}>
          {pack.is_active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  // Actions pour le tableau
  const actions: Action<Pack>[] = [
    {
      label: "Modifier",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: openEditDialog,
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: openDeleteDialog,
      variant: "destructive",
    },
  ];

  // Filtres
  const filters: FilterOption[] = [
    { key: "all", label: "Tous", value: "all" },
    { key: "decouverte", label: "Découverte", value: "decouverte" },
    { key: "mono_cours", label: "Mono-cours", value: "mono_cours" },
    { key: "multi_cours", label: "Multi-cours", value: "multi_cours" },
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Gestion des Packs"
        description="Créez et gérez les packs de cours"
        backHref="/admin"
        actionLabel="Nouveau Pack"
        onAction={openCreateDialog}
      />

      <DataTable
        data={packs}
        columns={columns}
        title="Packs"
        description="Liste de tous les packs"
        searchFields={["nom", "description"] as (keyof Pack)[]}
        searchPlaceholder="Rechercher par nom ou description..."
        filterOptions={filters}
        filterValue={filterType}
        onFilterChange={setFilterType}
        actions={actions}
        loading={loading}
      />

      {/* Dialogue de création */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Créer un nouveau pack"
        description="Remplissez les informations pour créer un nouveau pack"
        onSubmit={createPack}
        submitLabel="Créer"
      >
        <DynamicForm
          fields={[
            {
              key: "nom",
              label: "Nom du pack",
              type: "text",
              required: true,
            },
            {
              key: "description",
              label: "Description",
              type: "textarea",
            },
            {
              key: "prix",
              label: "Prix (MAD)",
              type: "number",
              required: true,
            },
            {
              key: "type_pack",
              label: "Type de pack",
              type: "select",
              required: true,
              options: [
                { label: "Découverte", value: "decouverte" },
                { label: "Mono-cours", value: "mono_cours" },
                { label: "Multi-cours", value: "multi_cours" },
              ],
            },
            {
              key: "duree_validite_jours",
              label: "Durée de validité (jours)",
              type: "number",
            },
            {
              key: "nombre_cours_total",
              label: "Nombre total de cours",
              type: "number",
            },
            {
              key: "is_active",
              label: "Actif",
              type: "checkbox",
            },
          ]}
          data={{
            nom: formData.nom,
            description: formData.description,
            prix: formData.prix,
            type_pack: formData.type_pack,
            duree_validite_jours: formData.duree_validite_jours,
            nombre_cours_total: formData.nombre_cours_total,
            is_active: formData.is_active,
          }}
          onChange={handleFormChange}
        />

        {/* Section des limitations par type de cours */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              Limitations par type de cours
            </label>
            <button
              type="button"
              onClick={addCourseType}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Ajouter une limitation
            </button>
          </div>
          {formData.limitations.map((limitation, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                value={limitation.course_type_id}
                onChange={(e) =>
                  updateCourseType(index, "course_type_id", e.target.value)
                }
                className="flex-1 p-2 border rounded"
              >
                <option value="">Sélectionner un type</option>
                {courseTypes.map((courseType) => (
                  <option key={courseType.id} value={courseType.id}>
                    {courseType.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={limitation.max_utilisations || ""}
                onChange={(e) =>
                  updateCourseType(
                    index,
                    "max_utilisations",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Max utilisations (vide = illimité)"
                className="w-48 p-2 border rounded"
              />
              {formData.limitations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCourseType(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </FormDialog>

      {/* Dialogue de modification */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le pack"
        description="Modifiez les informations du pack"
        onSubmit={updatePack}
        submitLabel="Modifier"
      >
        <DynamicForm
          fields={[
            {
              key: "nom",
              label: "Nom du pack",
              type: "text",
              required: true,
            },
            {
              key: "description",
              label: "Description",
              type: "textarea",
            },
            {
              key: "prix",
              label: "Prix (MAD)",
              type: "number",
              required: true,
            },
            {
              key: "type_pack",
              label: "Type de pack",
              type: "select",
              required: true,
              options: [
                { label: "Découverte", value: "decouverte" },
                { label: "Mono-cours", value: "mono_cours" },
                { label: "Multi-cours", value: "multi_cours" },
              ],
            },
            {
              key: "duree_validite_jours",
              label: "Durée de validité (jours)",
              type: "number",
            },
            {
              key: "nombre_cours_total",
              label: "Nombre total de cours",
              type: "number",
            },
            {
              key: "is_active",
              label: "Actif",
              type: "checkbox",
            },
          ]}
          data={{
            nom: formData.nom,
            description: formData.description,
            prix: formData.prix,
            type_pack: formData.type_pack,
            duree_validite_jours: formData.duree_validite_jours,
            nombre_cours_total: formData.nombre_cours_total,
            is_active: formData.is_active,
          }}
          onChange={handleFormChange}
        />

        {/* Section des limitations par type de cours */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              Limitations par type de cours
            </label>
            <button
              type="button"
              onClick={addCourseType}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Ajouter une limitation
            </button>
          </div>
          {formData.limitations.map((limitation, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                value={limitation.course_type_id}
                onChange={(e) =>
                  updateCourseType(index, "course_type_id", e.target.value)
                }
                className="flex-1 p-2 border rounded"
              >
                <option value="">Sélectionner un type</option>
                {courseTypes.map((courseType) => (
                  <option key={courseType.id} value={courseType.id}>
                    {courseType.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={limitation.max_utilisations || ""}
                onChange={(e) =>
                  updateCourseType(
                    index,
                    "max_utilisations",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Max utilisations (vide = illimité)"
                className="w-48 p-2 border rounded"
              />
              {formData.limitations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCourseType(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </FormDialog>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Supprimer le pack"
        description={`Êtes-vous sûr de vouloir supprimer le pack "${packToDelete?.nom}" ? 

⚠️ Si des utilisateurs ont acheté ce pack, il sera marqué comme supprimé mais les données seront préservées pour protéger l'historique des achats.

Si aucun utilisateur n'a acheté ce pack, il sera supprimé définitivement.`}
        onConfirm={deletePack}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
      />
    </div>
  );
};

export default PacksPage;
