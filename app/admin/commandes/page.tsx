"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, Clock, CreditCard, Search, X } from "lucide-react";
import Loader from "@/components/loader";
import EmailStatus from "@/components/admin/EmailStatus";
interface Commande {
  id: string;
  user_id: string;
  pack_id: string;
  montant_total: number;
  type_paiement: "cash" | "cmi_online";
  statut: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  date_commande: string;
  date_paiement?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  email_confirmation_sent?: boolean | null;
  email_confirmation_sent_at?: string | null;
  email_confirmation_error?: string | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  packs: {
    id: string;
    nom: string;
    prix: number;
    type_pack: string;
    nombre_cours_total: number;
  };
}

const CommandesPage = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadCommandes = useMemo(() => {
    return async (page = 1, status?: string) => {
      const currentStatus = status || statusFilter;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (currentStatus !== "all") {
          params.append("status", currentStatus);
        }

        const response = await fetch(`/api/admin/commandes?${params}`);
        const data = await response.json();

        if (data.success) {
          setCommandes(data.data);
          setPagination(data.pagination);
        } else {
          toast.error("Erreur lors du chargement des commandes");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };
  }, [statusFilter, pagination.limit]);

  useEffect(() => {
    loadCommandes();
  }, [loadCommandes]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadCommandes(1, value);
  };

  const handlePaymentTypeFilterChange = (value: string) => {
    setPaymentTypeFilter(value);
  };

  const handleValidatePayment = async (commandeId: string) => {
    try {
      setValidating(commandeId);

      const response = await fetch(`/api/admin/commandes/${commandeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirm_payment",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Paiement confirmé avec succès");
        loadCommandes(pagination.page, statusFilter);
      } else {
        toast.error(data.message || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setValidating(null);
    }
  };

  const handleCancelOrder = async (commandeId: string) => {
    try {
      setValidating(commandeId);

      const response = await fetch(`/api/admin/commandes/${commandeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Commande annulée avec succès");
        loadCommandes(pagination.page, statusFilter);
      } else {
        toast.error(data.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setValidating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "En attente",
        variant: "secondary" as const,
        icon: Clock,
      },
      paid: { label: "Payée", variant: "default" as const, icon: CheckCircle },
      failed: {
        label: "Échouée",
        variant: "destructive" as const,
        icon: Clock,
      },
      cancelled: {
        label: "Annulée",
        variant: "destructive" as const,
        icon: Clock,
      },
      refunded: {
        label: "Remboursée",
        variant: "outline" as const,
        icon: Clock,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtrage des commandes
  const filteredCommandes = useMemo(() => {
    return commandes.filter((commande) => {
      const matchesSearch =
        searchTerm === "" ||
        commande.profiles.first_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commande.profiles.last_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commande.profiles.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commande.packs.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || commande.statut === statusFilter;
      const matchesPaymentType =
        paymentTypeFilter === "all" ||
        commande.type_paiement === paymentTypeFilter;

      return matchesSearch && matchesStatus && matchesPaymentType;
    });
  }, [commandes, searchTerm, statusFilter, paymentTypeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 h-screen">
        <Loader size={32} color="var(--color-encoregreen)" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      {/* Bouton de retour vers /admin */}
      <div className="mb-6 flex-shrink-0">
        <Link href="/admin">
          <Button variant="outline" className="flex items-center gap-2">
            ← Retour au dashboard
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-playfair font-bold">
            Gestion des commandes
          </h1>
          <p className="text-gray-600">Gérez et validez les commandes</p>
        </div>

        <div className="text-sm text-gray-500">
          {pagination.total} commande{pagination.total > 1 ? "s" : ""} au total
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher par nom, email, pack ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payées</SelectItem>
              <SelectItem value="failed">Échouées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentTypeFilter}
            onValueChange={handlePaymentTypeFilterChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type de paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cmi_online">En ligne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau des commandes */}
      <div className="border rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-48">Client</TableHead>
                <TableHead className="w-48">Pack</TableHead>
                <TableHead className="w-32">Montant</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="w-40">Date</TableHead>
                <TableHead className="w-40">Email</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommandes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommandes.map((commande) => (
                  <TableRow key={commande.id}>
                    <TableCell className="font-mono text-sm">
                      {commande.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {commande.profiles.first_name}{" "}
                          {commande.profiles.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commande.profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{commande.packs.nom}</div>
                        <div className="text-sm text-gray-500">
                          {commande.packs.nombre_cours_total} cours
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-encoregreen">
                      {commande.montant_total} MAD
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">
                          {commande.type_paiement === "cash"
                            ? "Cash"
                            : "En ligne"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(commande.statut)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(commande.date_commande)}</div>
                        {commande.date_paiement && (
                          <div className="text-gray-500">
                            Payé: {formatDate(commande.date_paiement)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <EmailStatus
                        commandeId={commande.id}
                        emailSent={commande.email_confirmation_sent ?? null}
                        emailSentAt={commande.email_confirmation_sent_at ?? null}
                        emailError={commande.email_confirmation_error ?? null}
                        onEmailResent={() => loadCommandes(pagination.page)}
                      />
                    </TableCell>
                    <TableCell>
                      {commande.statut === "pending" &&
                        commande.type_paiement === "cash" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleValidatePayment(commande.id)}
                              disabled={validating === commande.id}
                              size="sm"
                              className="bg-encoregreen hover:bg-encoregreen/80"
                            >
                              {validating === commande.id ? (
                                <Loader size={16} color="white" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Valider
                            </Button>
                            <Button
                              onClick={() => handleCancelOrder(commande.id)}
                              disabled={validating === commande.id}
                              size="sm"
                              variant="destructive"
                            >
                              {validating === commande.id ? (
                                <Loader size={16} color="white" />
                              ) : (
                                <X className="w-4 h-4 mr-2" />
                              )}
                              Annuler
                            </Button>
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 flex-shrink-0 border-t pt-4">
          <div className="text-sm text-gray-500">
            Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
            {pagination.total} commandes
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCommandes(pagination.page - 1, statusFilter)}
              disabled={pagination.page <= 1}
            >
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pagination.page === pageNum ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => loadCommandes(pageNum, statusFilter)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCommandes(pagination.page + 1, statusFilter)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandesPage;
