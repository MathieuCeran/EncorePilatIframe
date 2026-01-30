"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";
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

interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const InstructorsPage = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] =
    useState<Instructor | null>(null);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/profs");
      const data = await response.json();

      if (data.success) {
        setInstructors(data.data);
      } else {
        toast.error("Erreur lors du chargement des professeurs");
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

  const resetForm = () => {
    setFormData({ first_name: "", last_name: "", is_active: true });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setFormData({
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      is_active: instructor.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const createInstructor = async () => {
    try {
      const response = await fetch("/api/admin/profs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Professeur créé avec succès");
        setIsCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création:", error);
      toast.error("Erreur lors de la création du professeur");
    }
  };

  const updateInstructor = async () => {
    if (!selectedInstructor) return;
    try {
      const response = await fetch("/api/admin/profs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedInstructor.id, ...formData }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Professeur mis à jour avec succès");
        setIsEditDialogOpen(false);
        setSelectedInstructor(null);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du professeur");
    }
  };

  const deleteInstructor = (instructor: Instructor) => {
    setInstructorToDelete(instructor);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!instructorToDelete) return;
    try {
      const response = await fetch(
        `/api/admin/profs?id=${instructorToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Professeur supprimé avec succès");
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression du professeur");
    }
  };

  const handleFormChange = (
    key: string,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const columns: Column<Instructor>[] = [
    {
      key: "first_name",
      header: "Nom complet",
      render: (instructor) => (
        <div>
          <div className="font-medium">
            {instructor.first_name} {instructor.last_name}
          </div>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      render: (instructor) => (
        <Badge
          variant={instructor.is_active ? "default" : "secondary"}
          className={
            instructor.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {instructor.is_active ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Créé le",
      render: (instructor) => (
        <span>{new Date(instructor.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const actions: Action<Instructor>[] = [
    {
      label: "Modifier",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: openEditDialog,
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: deleteInstructor,
      variant: "destructive",
    },
  ];

  const filterOptions: FilterOption[] = [
    { key: "all", label: "Tous les statuts", value: "all" },
    { key: "active", label: "Actif", value: "active" },
    { key: "inactive", label: "Inactif", value: "inactive" },
  ];

  const formFields: FormField[] = [
    {
      key: "first_name",
      label: "Prénom",
      type: "text",
      placeholder: "Prénom",
      required: true,
    },
    {
      key: "last_name",
      label: "Nom",
      type: "text",
      placeholder: "Nom",
      required: true,
    },
    {
      key: "is_active",
      label: "Actif",
      type: "checkbox",
    },
  ];

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && instructor.is_active) ||
      (filterStatus === "inactive" && !instructor.is_active);
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
        title="Gestion des professeurs"
        description="Créez et gérez vos professeurs"
        backHref="/admin"
        actionLabel="Nouveau professeur"
        onAction={openCreateDialog}
      />

      <DataTable
        data={filteredInstructors}
        columns={columns}
        title="Professeurs"
        description="Liste de tous les professeurs"
        searchFields={["first_name", "last_name"] as (keyof Instructor)[]}
        searchPlaceholder="Rechercher par prénom ou nom..."
        filterOptions={filterOptions}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
        actions={actions}
        loading={loading}
      />

      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Créer un nouveau professeur"
        description="Remplissez les informations pour créer un nouveau professeur."
        onSubmit={createInstructor}
        submitLabel="Créer le professeur"
      >
        <DynamicForm
          fields={formFields}
          data={formData}
          onChange={handleFormChange}
        />
      </FormDialog>

      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le professeur"
        description="Modifiez les informations du professeur sélectionné."
        onSubmit={updateInstructor}
        submitLabel="Mettre à jour"
      >
        <DynamicForm
          fields={formFields}
          data={formData}
          onChange={handleFormChange}
        />
      </FormDialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirmation de suppression"
        description={`Êtes-vous sûr de vouloir supprimer le professeur "${instructorToDelete?.first_name} ${instructorToDelete?.last_name}" ? Cette action est irréversible.`}
        onConfirm={confirmDelete}
        confirmLabel="Supprimer"
      />
    </div>
  );
};

export default InstructorsPage;
