"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column, Action } from "@/components/ui/data-table";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { Eye } from "lucide-react";

interface AdminUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminUsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const json = await response.json();
      if (json.success) {
        setUsers(json.data ?? []);
      } else {
        toast.error("Erreur lors du chargement des utilisateurs");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<AdminUserProfile>[] = [
    {
      key: "first_name",
      header: "Utilisateur",
      render: (user) => (
        <div>
          <div className="font-medium">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      render: (user) => <span>{user.phone || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Inscrit le",
      render: (user) => (
        <span>{new Date(user.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const actions: Action<AdminUserProfile>[] = [
    {
      label: "Voir",
      icon: <Eye className="mr-2 h-4 w-4" />,
      onClick: (user) => router.push(`/admin/users/${user.id}`),
    },
  ];

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
        title="Gestion des utilisateurs"
        description="Recherchez et consultez les profils utilisateurs"
        backHref="/admin"
      />

      <DataTable
        data={users}
        columns={columns}
        title="Utilisateurs"
        description="Liste des utilisateurs enregistrés"
        searchFields={
          ["first_name", "last_name", "email"] as (keyof AdminUserProfile)[]
        }
        searchPlaceholder="Rechercher par prénom, nom ou email..."
        actions={actions}
        loading={loading}
      />
    </div>
  );
};

export default AdminUsersPage;
