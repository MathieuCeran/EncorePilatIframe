"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import Loader from "@/components/loader";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Shield,
  Calendar,
  ArrowLeft,
  Package,
  ShoppingCart,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserRoleManager from "@/components/admin/UserRoleManager";
import CommandeActions from "@/components/admin/CommandeActions";
import PackActions from "@/components/admin/PackActions";
import ReservationActions from "@/components/admin/ReservationActions";
import AddPackModal from "@/components/admin/AddPackModal";
import {
  UserProfile,
  UserDetailsResponse,
  PackWithDetails,
  BookingWithDetails,
  PaginationInfo,
  CommandeWithPack,
} from "@/types/types";

const AdminUserDetailsPage = () => {
  const params = useParams();
  const userId = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [showRoleManager, setShowRoleManager] = useState<boolean>(false);

  // Packs state
  const [packs, setPacks] = useState<PackWithDetails[]>([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [packsPagination, setPacksPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [packsSearch, setPacksSearch] = useState("");

  // Orders state
  const [orders, setOrders] = useState<CommandeWithPack[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPagination, setOrdersPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [ordersSearch, setOrdersSearch] = useState("");

  // Bookings state
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsPagination, setBookingsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [bookingsSearch, setBookingsSearch] = useState("");

  // Load basic user info
  useEffect(() => {
    if (!userId) return;

    const loadBasicInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${userId}`);
        const json: UserDetailsResponse = await res.json();
        if (!json.success) {
          throw new Error("Échec du chargement des données utilisateur");
        }
        setProfile(json.data.profile);
        const rolesField = json.data.roleData?.roles as
          | { name: string }
          | { name: string }[]
          | undefined;
        const roleFromRoleData = Array.isArray(rolesField)
          ? rolesField?.[0]?.name
          : rolesField?.name;
        // Utiliser 'client' par défaut si aucun rôle n'est trouvé (comportement normal)
        setRole(json.data.role ?? roleFromRoleData ?? "client");
      } catch (e: unknown) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Erreur inconnue");
        toast.error("Impossible de charger l'utilisateur");
      } finally {
        setLoading(false);
      }
    };

    loadBasicInfo();
  }, [userId]);

  // Load packs with pagination and search
  const loadPacks = useCallback(async () => {
    if (!userId) return;

    try {
      setPacksLoading(true);
      const params = new URLSearchParams({
        page: packsPagination.page.toString(),
        limit: packsPagination.limit.toString(),
        search: packsSearch,
      });

      const res = await fetch(`/api/admin/users/${userId}/packs?${params}`);
      const json = await res.json();

      if (json.success) {
        setPacks(json.data.packs);
        setPacksPagination(json.data.pagination);
      } else {
        throw new Error(json.error || "Erreur lors du chargement des packs");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des packs:", error);
      toast.error("Impossible de charger les packs");
    } finally {
      setPacksLoading(false);
    }
  }, [userId, packsPagination.page, packsPagination.limit, packsSearch]);

  // Load orders with pagination and search
  const loadOrders = useCallback(async () => {
    if (!userId) return;

    try {
      setOrdersLoading(true);
      const params = new URLSearchParams({
        page: ordersPagination.page.toString(),
        limit: ordersPagination.limit.toString(),
        search: ordersSearch,
      });

      const res = await fetch(`/api/admin/users/${userId}/orders?${params}`);
      const json = await res.json();

      if (json.success) {
        setOrders(json.data.orders);
        setOrdersPagination(json.data.pagination);
      } else {
        throw new Error(
          json.error || "Erreur lors du chargement des commandes"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
      toast.error("Impossible de charger les commandes");
    } finally {
      setOrdersLoading(false);
    }
  }, [userId, ordersPagination.page, ordersPagination.limit, ordersSearch]);

  // Load bookings with pagination and search
  const loadBookings = useCallback(async () => {
    if (!userId) return;

    try {
      setBookingsLoading(true);
      const params = new URLSearchParams({
        page: bookingsPagination.page.toString(),
        limit: bookingsPagination.limit.toString(),
        search: bookingsSearch,
      });

      const res = await fetch(`/api/admin/users/${userId}/bookings?${params}`);
      const json = await res.json();

      if (json.success) {
        setBookings(json.data.bookings);
        setBookingsPagination(json.data.pagination);
      } else {
        throw new Error(
          json.error || "Erreur lors du chargement des réservations"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error);
      toast.error("Impossible de charger les réservations");
    } finally {
      setBookingsLoading(false);
    }
  }, [
    userId,
    bookingsPagination.page,
    bookingsPagination.limit,
    bookingsSearch,
  ]);

  // Load data when dependencies change
  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return `${profile.first_name} ${profile.last_name}`.trim();
  }, [profile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      active: { label: "Actif", variant: "default" },
      expired: { label: "Expiré", variant: "destructive" },
      consumed: { label: "Consommé", variant: "secondary" },
      pending: { label: "En attente", variant: "outline" },
      paid: { label: "Payé", variant: "default" },
      failed: { label: "Échoué", variant: "destructive" },
      cancelled: { label: "Annulé", variant: "destructive" },
      refunded: { label: "Remboursé", variant: "secondary" },
      confirmed: { label: "Confirmé", variant: "default" },
      no_show: { label: "Absent", variant: "destructive" },
      present: { label: "Présent", variant: "default" },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      variant: "outline",
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPaymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      cash: "Espèces",
      cmi_online: "CMI Online",
    };
    return typeMap[type] || type;
  };

  const formatPackType = (type: string) => {
    const typeMap: Record<string, string> = {
      decouverte: "Découverte",
      mono_cours: "Mono cours",
      multi_cours: "Multi cours",
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6 mb-10">
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateur introuvable</CardTitle>
            <CardDescription>
              Une erreur s&apos;est produite lors du chargement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mb-10 space-y-6">
      <PageHeader
        title={fullName || "Profil utilisateur"}
        description={`ID: ${profile.id}`}
        backHref="/admin/users"
        backLabel="Retour à la liste"
      />

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
          <CardDescription>
            Détails de base de l&apos;utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Nom complet</div>
              <div className="text-base font-medium">{fullName || "—"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </div>
              <div className="text-base font-medium">{profile.email}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" /> Téléphone
              </div>
              <div className="text-base font-medium">
                {profile.phone || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> Rôle
              </div>
              <div className="text-base font-medium flex items-center gap-2">
                {role ? <Badge variant="secondary">{role}</Badge> : "—"}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRoleManager(true)}
                >
                  Gérer les rôles
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Créé le
              </div>
              <div className="text-base font-medium">
                {formatDate(profile.created_at)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Mis à jour le</div>
              <div className="text-base font-medium">
                {formatDate(profile.updated_at)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portefeuille / Abonnements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Formules / Packs achetés
          </CardTitle>
          <CardDescription>
            Aperçu des formules ou packs achetés par l&apos;utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <SearchBar
              placeholder="Rechercher par nom de pack..."
              onSearch={setPacksSearch}
              className="max-w-sm"
            />
            <AddPackModal userId={userId} onPackAdded={loadPacks} />
          </div>

          {packsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {packsSearch
                ? "Aucun pack trouvé pour cette recherche"
                : "Aucun pack acheté"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pack</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Date d&apos;achat</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Cours restants</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {pack.packs?.nom || "Pack inconnu"}
                          </div>
                          {pack.packs?.description && (
                            <div className="text-sm text-muted-foreground">
                              {pack.packs.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pack.packs?.type_pack ? (
                          <Badge variant="outline">
                            {formatPackType(pack.packs.type_pack)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {pack.packs?.prix
                          ? `${pack.packs.prix.toFixed(2)} MAD`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(pack.date_achat)}</TableCell>
                      <TableCell>
                        {pack.date_expiration
                          ? formatDate(pack.date_expiration)
                          : "—"}
                      </TableCell>
                      <TableCell>{pack.cours_restants}</TableCell>
                      <TableCell>{formatStatus(pack.statut)}</TableCell>
                      <TableCell>
                        <PackActions
                          pack={pack}
                          userId={userId}
                          onUpdate={loadPacks}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={packsPagination.page}
                totalPages={packsPagination.totalPages}
                onPageChange={(page) =>
                  setPacksPagination((prev: PaginationInfo) => ({
                    ...prev,
                    page,
                  }))
                }
                totalItems={packsPagination.total}
                itemsPerPage={packsPagination.limit}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Commandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commandes
          </CardTitle>
          <CardDescription>Historique des commandes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar
            placeholder="Rechercher par ID, notes ou nom de pack..."
            onSearch={setOrdersSearch}
            className="max-w-sm"
          />

          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {ordersSearch
                ? "Aucune commande trouvée pour cette recherche"
                : "Aucune commande"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type de paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date commande</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id}
                      </TableCell>
                      <TableCell>
                        {order.pack_id ? (
                          order.packs ? (
                            <div>
                              <div className="font-medium">
                                {order.packs.nom}
                              </div>
                              {order.packs.nombre_cours_total && (
                                <div className="text-sm text-muted-foreground">
                                  ({order.packs.nombre_cours_total} cours)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Pack {order.pack_id}
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">
                            Paiement unitaire
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.montant_total.toFixed(2)} MAD
                      </TableCell>
                      <TableCell>
                        {formatPaymentType(order.type_paiement)}
                      </TableCell>
                      <TableCell>{formatStatus(order.statut)}</TableCell>
                      <TableCell>{formatDate(order.date_commande)}</TableCell>
                      <TableCell>
                        {order.date_paiement
                          ? formatDate(order.date_paiement)
                          : "—"}
                      </TableCell>
                      <TableCell>{order.notes || "—"}</TableCell>
                      <TableCell>
                        <CommandeActions
                          commande={order}
                          onUpdate={loadOrders}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={ordersPagination.page}
                totalPages={ordersPagination.totalPages}
                onPageChange={(page) =>
                  setOrdersPagination((prev: PaginationInfo) => ({
                    ...prev,
                    page,
                  }))
                }
                totalItems={ordersPagination.total}
                itemsPerPage={ordersPagination.limit}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Réservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Réservations
          </CardTitle>
          <CardDescription>Dernières réservations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar
            placeholder="Rechercher par type de cours..."
            onSearch={setBookingsSearch}
            className="max-w-sm"
          />

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {bookingsSearch
                ? "Aucune réservation trouvée pour cette recherche"
                : "Aucune réservation"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type de cours</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Présent</TableHead>
                    <TableHead>Date présence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {booking.courses?.course_types?.name ||
                              "Cours inconnu"}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {booking.course_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.courses?.date
                          ? new Date(booking.courses.date).toLocaleDateString(
                              "fr-FR"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {booking.courses?.start_time &&
                        booking.courses?.end_time
                          ? `${booking.courses.start_time} - ${booking.courses.end_time}`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatStatus(booking.statut)}</TableCell>
                      <TableCell>
                        {booking.presente === null
                          ? "—"
                          : booking.presente
                            ? "Oui"
                            : "Non"}
                      </TableCell>
                      <TableCell>
                        {booking.date_presence
                          ? formatDate(booking.date_presence)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <ReservationActions
                          reservation={booking}
                          onUpdate={loadBookings}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={bookingsPagination.page}
                totalPages={bookingsPagination.totalPages}
                onPageChange={(page) =>
                  setBookingsPagination((prev: PaginationInfo) => ({
                    ...prev,
                    page,
                  }))
                }
                totalItems={bookingsPagination.total}
                itemsPerPage={bookingsPagination.limit}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de gestion des rôles */}
      {showRoleManager && (
        <UserRoleManager
          isOpen={showRoleManager}
          userId={userId}
          currentRole={role || "user"}
          userName={fullName}
          userEmail={profile.email}
          onRoleUpdated={(newRole: string) => {
            setRole(newRole);
            setShowRoleManager(false);
          }}
          onClose={() => setShowRoleManager(false)}
        />
      )}
    </div>
  );
};

export default AdminUserDetailsPage;
