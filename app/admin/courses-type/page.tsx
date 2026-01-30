"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { CourseType } from "@/types/types";
import {
  DataTable,
  Column,
  Action,
  FilterOption,
} from "@/components/ui/data-table";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { DynamicForm, FormField } from "@/components/ui/dynamic-form";

const CourseTypesPage = () => {
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseTypeToDelete, setCourseTypeToDelete] =
    useState<CourseType | null>(null);
  const [selectedCourseType, setSelectedCourseType] =
    useState<CourseType | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    benefits: [] as string[],
    is_active: true,
  });

  // Charger les types de cours
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/course-type");
      const data = await response.json();

      if (data.success) {
        setCourseTypes(data.data);
      } else {
        toast.error("Erreur lors du chargement des types de cours");
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
      name: "",
      description: "",
      duration_minutes: 60,
      benefits: [],
      is_active: true,
    });
  };

  // Ouvrir le dialogue de création
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Ouvrir le dialogue d'édition
  const openEditDialog = (courseType: CourseType) => {
    setSelectedCourseType(courseType);
    setFormData({
      name: courseType.name,
      description: courseType.description,
      duration_minutes: courseType.duration_minutes,
      benefits: courseType.benefits || [],
      is_active: courseType.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Créer un type de cours
  const createCourseType = async () => {
    try {
      const response = await fetch("/api/course-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Type de cours créé avec succès");
        setIsCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création:", error);
      toast.error("Erreur lors de la création du type de cours");
    }
  };

  // Mettre à jour un type de cours
  const updateCourseType = async () => {
    if (!selectedCourseType) return;

    try {
      const response = await fetch("/api/course-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCourseType.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Type de cours mis à jour avec succès");
        setIsEditDialogOpen(false);
        setSelectedCourseType(null);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du type de cours");
    }
  };

  // Supprimer un type de cours
  const deleteCourseType = async (courseType: CourseType) => {
    setCourseTypeToDelete(courseType);
    setIsDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!courseTypeToDelete) return;

    try {
      const response = await fetch(
        `/api/course-type?id=${courseTypeToDelete.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Type de cours supprimé avec succès");
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression du type de cours");
    }
  };

  // Gérer les changements de formulaire
  const handleFormChange = (
    key: string,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Ajouter un bénéfice
  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  };

  // Supprimer un bénéfice
  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  // Mettre à jour un bénéfice
  const updateBenefit = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) =>
        i === index ? value : benefit
      ),
    }));
  };

  // Configuration des colonnes pour la table
  const columns: Column<CourseType>[] = [
    {
      key: "name",
      header: "Nom",
      render: (courseType) => (
        <div>
          <div className="font-medium">{courseType.name}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {courseType.description}
          </div>
        </div>
      ),
    },
    {
      key: "duration_minutes",
      header: "Durée",
      render: (courseType) => (
        <span className="font-semibold">{courseType.duration_minutes} min</span>
      ),
    },
    {
      key: "benefits",
      header: "Bénéfices",
      render: (courseType) => (
        <div className="flex flex-wrap gap-1">
          {courseType.benefits?.slice(0, 2).map((benefit, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {benefit}
            </Badge>
          ))}
          {courseType.benefits && courseType.benefits.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{courseType.benefits.length - 2} autres
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      render: (courseType) => (
        <Badge
          variant={courseType.is_active ? "default" : "secondary"}
          className={
            courseType.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {courseType.is_active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Créé le",
      render: (courseType) => (
        <span>{new Date(courseType.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  // Configuration des actions
  const actions: Action<CourseType>[] = [
    {
      label: "Modifier",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: openEditDialog,
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: deleteCourseType,
      variant: "destructive",
    },
  ];

  // Configuration des filtres
  const filterOptions: FilterOption[] = [
    { key: "all", label: "Tous les statuts", value: "all" },
    { key: "active", label: "Actif", value: "active" },
    { key: "inactive", label: "Inactif", value: "inactive" },
  ];

  // Configuration des champs du formulaire
  const formFields: FormField[] = [
    {
      key: "name",
      label: "Nom du type de cours",
      type: "text",
      placeholder: "Nom du type de cours",
      required: true,
    },
    {
      key: "duration_minutes",
      label: "Durée (minutes)",
      type: "number",
      placeholder: "60",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Description du type de cours",
    },
    {
      key: "benefits",
      label: "Bénéfices",
      type: "dynamic-list",
      placeholder: "Bénéfice",
    },
    {
      key: "is_active",
      label: "Actif",
      type: "checkbox",
    },
  ];

  // Filtrer les types de cours
  const filteredCourseTypes = courseTypes.filter((courseType) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && courseType.is_active) ||
      (filterStatus === "inactive" && !courseType.is_active);
    return matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mb-10">
      <PageHeader
        title="Gestion des types de cours"
        description="Créez et gérez vos types de cours"
        backHref="/admin"
        actionLabel="Nouveau type de cours"
        onAction={openCreateDialog}
      />

      <DataTable
        data={filteredCourseTypes}
        columns={columns}
        title="Types de cours"
        description="Liste de tous les types de cours disponibles"
        searchFields={["name", "description"]}
        searchPlaceholder="Rechercher par nom ou description..."
        filterOptions={filterOptions}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
        actions={actions}
        loading={loading}
      />

      {/* Dialogue de création */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Créer un nouveau type de cours"
        description="Remplissez les informations pour créer un nouveau type de cours."
        onSubmit={createCourseType}
        submitLabel="Créer le type de cours"
      >
        <DynamicForm
          fields={formFields}
          data={formData}
          onChange={handleFormChange}
          onAddItem={() => addBenefit()}
          onRemoveItem={(key, index) => removeBenefit(index)}
          onUpdateItem={(key, index, value) =>
            updateBenefit(index, value as string)
          }
        />
      </FormDialog>

      {/* Dialogue d'édition */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le type de cours"
        description="Modifiez les informations du type de cours sélectionné."
        onSubmit={updateCourseType}
        submitLabel="Mettre à jour"
      >
        <DynamicForm
          fields={formFields}
          data={formData}
          onChange={handleFormChange}
          onAddItem={() => addBenefit()}
          onRemoveItem={(_key, index) => removeBenefit(index)}
          onUpdateItem={(_key, index, value) =>
            updateBenefit(index, value as string)
          }
        />
      </FormDialog>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirmation de suppression"
        description={`Êtes-vous sûr de vouloir supprimer le type de cours "${courseTypeToDelete?.name}"? Cette action est irréversible.`}
        onConfirm={confirmDelete}
        confirmLabel="Supprimer"
      />
    </div>
  );
};

export default CourseTypesPage;
