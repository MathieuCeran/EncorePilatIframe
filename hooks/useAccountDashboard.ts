"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PackPurchase = {
  id: string;
  cours_restants: number;
  statut: string;
  date_expiration: string | null;
  date_achat: string | null;
  restrictions?: Array<{
    course_type_id: string;
    max_utilisations: number | null;
    used?: number;
    name?: string;
  }>;
  pack: {
    id: string;
    nom: string;
    description?: string | null;
    prix: number;
    type_pack: string;
    nombre_cours_total?: number | null;
  };
};

type Reservation = {
  id: string;
  status: string;
  created_at: string;
  course: {
    id: string;
    date: string; // ISO Date string
    start_time: string; // HH:mm
    end_time: string; // HH:mm
    course_type: { id: string; name: string };
    instructor?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  };
};

export type AccountView = "upcoming" | "past" | "orders";

type Order = {
  id: string;
  montant_total: number | null;
  statut: string | null;
  date_commande: string | null;
  date_paiement: string | null;
  type_paiement: string | null;
  notes: string | null;
  pack: {
    id: string;
    nom: string;
    prix: number;
    type_pack: string;
    nombre_cours_total?: number | null;
  } | null;
};

export function useAccountDashboard() {
  const [packs, setPacks] = useState<PackPurchase[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AccountView>("upcoming");

  const loadData = async () => {
    try {
      setLoading(true);

      const [packsRes, resasRes, ordersRes] = await Promise.all([
        fetch("/api/me/packs"),
        fetch("/api/my-bookings"),
        fetch("/api/me/orders"),
      ]);

      if (packsRes.ok) {
        const json = await packsRes.json();
        setPacks(json.active || []);
      }
      if (resasRes.ok) {
        const json = await resasRes.json();
        setReservations(json.data || []);
      }
      if (ordersRes.ok) {
        const json = await ordersRes.json();
        setOrders(json.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcomingReservations = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return reservations.filter((r) => {
      const d = new Date(r.course.date);
      return d >= today;
    });
  }, [reservations]);

  const pastReservations = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return reservations.filter((r) => {
      const d = new Date(r.course.date);
      return d < today;
    });
  }, [reservations]);

  const handleInviteClick = (reservation: Reservation) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/checkout?courseId=${reservation.course.id}`;

    const courseDate = format(
      new Date(reservation.course.date),
      "EEEE, dd MMMM",
      { locale: fr }
    );
    const courseTime = reservation.course.start_time;
    const courseName = reservation.course.course_type.name;

    const message = `Je t'invite à venir au cours de ${courseName} le ${courseDate} à ${courseTime} chez encore studio.
    Pour réserver, clique sur le lien suivant : ${inviteLink}`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        toast.success("Lien d'invitation copié !", {
          icon: "📋",
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        toast.error("Erreur lors de la copie du lien", {
          description: "Veuillez copier manuellement le lien",
          icon: "⚠️",
          duration: 3000,
        });
      });
  };

  const handleQuitterClick = async (reservation: Reservation) => {
    try {
      // Vérifier si l'utilisateur est connecté
      const response = await fetch("/api/me/profile");
      if (!response.ok) {
        toast.error("Vous devez être connecté pour annuler une réservation", {
          icon: "🔒",
          duration: 3000,
        });
        return;
      }

      // Vérifier le délai de 12h minimum
      const courseDateTime = new Date(
        `${reservation.course.date} ${reservation.course.start_time}`
      );
      const now = new Date();
      const hoursUntilCourse =
        (courseDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCourse < 12) {
        toast.error("Annulation impossible : moins de 12h avant le cours", {
          icon: "⏰",
          duration: 4000,
        });
        return;
      }

      // Demander confirmation
      if (!confirm("Êtes-vous sûr de vouloir annuler votre réservation ?")) {
        return;
      }

      // Appeler l'API d'annulation
      const cancelResponse = await fetch(`/api/bookings/${reservation.id}`, {
        method: "DELETE",
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        toast.error(errorData.error || "Erreur lors de l'annulation", {
          icon: "❌",
          duration: 4000,
        });
        return;
      }

      toast.success("Réservation annulée avec succès", {
        icon: "✅",
        duration: 3000,
      });

      // Recharger les données pour mettre à jour l'affichage
      await loadData();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      toast.error("Erreur lors de l'annulation de la réservation", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  return {
    loading,
    packs,
    orders,
    reservations,
    view,
    setView,
    upcomingReservations,
    pastReservations,
    handleInviteClick,
    handleQuitterClick,
  };
}
