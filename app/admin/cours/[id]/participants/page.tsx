"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  User,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Check,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import Loader from "@/components/loader";

interface Participant {
  id: string;
  statut: "confirmed" | "cancelled";
  presente: boolean | null;
  date_presence: string | null;
  date_annulation: string | null;
  raison_annulation: string | null;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface CourseDetails {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  course_types: {
    id: string;
    name: string;
    description: string;
  };
  instructors: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const ParticipantsPage: React.FC = () => {
  const params = useParams();
  const courseId = params.id as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour la pagination et les filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPresence, setFilterPresence] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // États pour les filtres temporaires (non appliqués)
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all");
  const [tempFilterPresence, setTempFilterPresence] = useState<string>("all");

  // Fonction pour charger les participants avec pagination et filtres
  const fetchParticipants = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        // Construire les paramètres de requête
        const params = new URLSearchParams({
          course_id: courseId,
          limit: itemsPerPage.toString(),
          offset: ((page - 1) * itemsPerPage).toString(),
        });

        if (filterStatus !== "all") {
          params.append("status", filterStatus);
        }

        if (filterPresence !== "all") {
          params.append("presente", filterPresence);
        }

        // Récupérer les participants
        const participantsResponse = await fetch(
          `/api/bookings?${params.toString()}`
        );
        const participantsData = await participantsResponse.json();

        if (participantsData.bookings) {
          setParticipants(participantsData.bookings);
          setTotalParticipants(participantsData.total || 0);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur lors du chargement des participants");
      } finally {
        setLoading(false);
      }
    },
    [courseId, filterStatus, filterPresence, itemsPerPage]
  );

  // Charger les données du cours et des participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les détails du cours
        const courseResponse = await fetch(
          `/api/calendar?courseId=${courseId}&admin=true`
        );
        const courseData = await courseResponse.json();

        if (!courseData.success) {
          throw new Error("Erreur lors de la récupération du cours");
        }

        const course = courseData.data[0];
        setCourseDetails({
          id: course.id,
          date: course.date,
          start_time: course.startTime,
          end_time: course.endTime,
          max_capacity: course.max_capacity,
          current_bookings: course.current_bookings,
          course_types: {
            id: course.courseTypeId,
            name: course.courseType,
            description: "",
          },
          instructors: {
            id: course.instructorId,
            first_name: course.instructor.split(" ")[0] || "",
            last_name: course.instructor.split(" ").slice(1).join(" ") || "",
          },
        });

        // Charger les participants
        await fetchParticipants(1);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, fetchParticipants]);

  // Recharger les participants quand les filtres changent
  useEffect(() => {
    if (courseId) {
      setCurrentPage(1);
      fetchParticipants(1);
    }
  }, [courseId, filterStatus, filterPresence, fetchParticipants]);

  // Initialiser les filtres temporaires quand les filtres réels changent
  useEffect(() => {
    setTempFilterStatus(filterStatus);
    setTempFilterPresence(filterPresence);
  }, [filterStatus, filterPresence]);

  // Fonction pour changer de page
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchParticipants(page);
    },
    [fetchParticipants]
  );

  // Fonction pour appliquer les filtres
  const applyFilters = useCallback(() => {
    setFilterStatus(tempFilterStatus);
    setFilterPresence(tempFilterPresence);
  }, [tempFilterStatus, tempFilterPresence]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setTempFilterStatus("all");
    setTempFilterPresence("all");
    setFilterStatus("all");
    setFilterPresence("all");
  }, []);

  // Marquer un participant comme présent
  const markAsPresent = useCallback(async (participantId: string) => {
    try {
      setUpdating(participantId);

      const response = await fetch(`/api/admin/bookings/${participantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          presente: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? {
                    ...p,
                    presente: true,
                    date_presence: new Date().toISOString(),
                  }
                : p
            )
          );
        } else {
          throw new Error(result.message || "Erreur lors de la mise à jour");
        }
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(null);
    }
  }, []);

  // Marquer un participant comme absent
  const markAsAbsent = useCallback(async (participantId: string) => {
    try {
      setUpdating(participantId);

      const response = await fetch(`/api/admin/bookings/${participantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          presente: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? {
                    ...p,
                    presente: false,
                    date_presence: new Date().toISOString(),
                  }
                : p
            )
          );
        } else {
          throw new Error(result.message || "Erreur lors de la mise à jour");
        }
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(null);
    }
  }, []);

  // Expulser un participant du cours
  const removeParticipant = useCallback(async (participantId: string) => {
    try {
      setUpdating(participantId);

      const response = await fetch(`/api/admin/bookings/${participantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: "cancelled",
          raison_annulation: "Expulsé par l'administrateur",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? {
                    ...p,
                    statut: "cancelled",
                    date_annulation: new Date().toISOString(),
                    raison_annulation: "Expulsé par l'administrateur",
                  }
                : p
            )
          );
        } else {
          throw new Error(result.message || "Erreur lors de l'expulsion");
        }
      } else {
        throw new Error("Erreur lors de l'expulsion");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du retrait du participant");
    } finally {
      setUpdating(null);
    }
  }, []);

  // Obtenir le statut d'affichage
  const getStatusDisplay = useCallback((participant: Participant) => {
    if (participant.statut === "cancelled") {
      return { text: "Annulé", color: "bg-red-100 text-red-800" };
    }
    if (participant.presente === true) {
      return { text: "Présent", color: "bg-green-100 text-green-800" };
    }
    if (participant.presente === false) {
      return { text: "Absent", color: "bg-orange-100 text-orange-800" };
    }
    return { text: "Confirmé", color: "bg-blue-100 text-blue-800" };
  }, []);

  if (loading) {
    return (
      <BackgroundWrapper>
        <div className="min-h-screen pt-10 md:pt-0 flex items-center justify-center">
          <Loader size={32} color="var(--color-encoregreen)" />
        </div>
      </BackgroundWrapper>
    );
  }

  if (error) {
    return (
      <BackgroundWrapper>
        <div className="min-h-screen pt-10 md:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-playfair font-semibold text-gray-900 mb-2">
                Erreur
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/admin/cours">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux cours
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <div className="min-h-screen pt-10 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/admin/cours">
              <Button
                variant="outline"
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux cours
              </Button>
            </Link>

            <div className="mb-6">
              <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
                Participants du cours
              </h1>
              {courseDetails && (
                <div className="bg-white/50 rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-playfair font-semibold text-gray-900 mb-2">
                    {courseDetails.course_types.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date :</span>{" "}
                      {format(
                        new Date(courseDetails.date),
                        "EEEE d MMMM yyyy",
                        { locale: fr }
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Heure :</span>{" "}
                      {courseDetails.start_time} - {courseDetails.end_time}
                    </div>
                    <div>
                      <span className="font-medium">Instructeur :</span>{" "}
                      {courseDetails.instructors.first_name}{" "}
                      {courseDetails.instructors.last_name}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Participants :</span>{" "}
                    {courseDetails.current_bookings} /{" "}
                    {courseDetails.max_capacity}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-semibold text-gray-900">
                  Filtres
                  {(tempFilterStatus !== filterStatus ||
                    tempFilterPresence !== filterPresence) && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Modifications non appliquées
                    </span>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? "Masquer" : "Afficher"} les filtres
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtre par statut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={tempFilterStatus}
                      onChange={(e) => setTempFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>

                  {/* Filtre par présence */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Présence
                    </label>
                    <select
                      value={tempFilterPresence}
                      onChange={(e) => setTempFilterPresence(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous</option>
                      <option value="true">Présent</option>
                      <option value="false">Absent</option>
                      <option value="null">Non défini</option>
                    </select>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={applyFilters}
                      size="sm"
                      className={`${
                        tempFilterStatus !== filterStatus ||
                        tempFilterPresence !== filterPresence
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-400 text-white cursor-not-allowed"
                      }`}
                      disabled={
                        tempFilterStatus === filterStatus &&
                        tempFilterPresence === filterPresence
                      }
                    >
                      Appliquer
                    </Button>
                    <Button onClick={resetFilters} variant="outline" size="sm">
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium">
              {totalParticipants} participant{totalParticipants > 1 ? "s" : ""}{" "}
              trouvé{totalParticipants > 1 ? "s" : ""}
            </span>
            {filterStatus !== "all" || filterPresence !== "all" ? (
              <span className="ml-2 text-gray-500">(filtres appliqués)</span>
            ) : null}
          </div>

          {/* Liste des participants */}
          <div className="space-y-4">
            {participants.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun participant
                  </h3>
                  <p className="text-gray-600">
                    Aucun participant n&apos;est inscrit à ce cours.
                  </p>
                </CardContent>
              </Card>
            ) : (
              participants.map((participant) => {
                const status = getStatusDisplay(participant);
                const isUpdating = updating === participant.id;

                return (
                  <Card key={participant.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {participant.profiles.first_name}{" "}
                              {participant.profiles.last_name}
                            </h3>
                            <Badge className={status.color}>
                              {status.text}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">
                            {participant.profiles.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            S&apos;est inscrit le{" "}
                            {format(
                              new Date(participant.created_at),
                              "dd/MM/yyyy à HH:mm",
                              { locale: fr }
                            )}
                          </p>
                          {participant.date_presence && (
                            <p className="text-sm text-gray-500">
                              Présence enregistrée le{" "}
                              {format(
                                new Date(participant.date_presence),
                                "dd/MM/yyyy à HH:mm",
                                { locale: fr }
                              )}
                            </p>
                          )}
                          {participant.date_annulation && (
                            <p className="text-sm text-red-600">
                              Annulé le{" "}
                              {format(
                                new Date(participant.date_annulation),
                                "dd/MM/yyyy à HH:mm",
                                { locale: fr }
                              )}
                              {participant.raison_annulation &&
                                ` - ${participant.raison_annulation}`}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Actions selon le statut */}
                          {participant.statut !== "cancelled" && (
                            <>
                              {/* Boutons de présence */}
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => markAsPresent(participant.id)}
                                  disabled={isUpdating}
                                  size="sm"
                                  className={`${
                                    participant.presente === true
                                      ? "bg-green-700 text-white"
                                      : "bg-green-600 hover:bg-green-700 text-white"
                                  }`}
                                  title="Marquer comme présent"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4" />
                                      <span className="hidden sm:inline ml-1">
                                        Présent
                                      </span>
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => markAsAbsent(participant.id)}
                                  disabled={isUpdating}
                                  size="sm"
                                  className={`${
                                    participant.presente === false
                                      ? "bg-orange-700 text-white"
                                      : "bg-orange-600 hover:bg-orange-700 text-white"
                                  }`}
                                  title="Marquer comme absent"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="w-4 h-4" />
                                      <span className="hidden sm:inline ml-1">
                                        Absent
                                      </span>
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Bouton d'expulsion - plus explicite */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50 flex items-center gap-1"
                                    title="Expulser du cours"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                      Expulser
                                    </span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Expulser le participant du cours
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir expulser{" "}
                                      {participant.profiles.first_name}{" "}
                                      {participant.profiles.last_name} de ce
                                      cours ?
                                      <br />
                                      <br />
                                      <strong>Cette action va :</strong>
                                      <br />• Marquer la réservation comme
                                      annulée
                                      <br />• Recréditer le cours dans son pack
                                      (si applicable)
                                      <br />• Libérer une place dans le cours
                                      <br />
                                      <br />
                                      Cette action ne peut pas être annulée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        removeParticipant(participant.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Expulser du cours
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          {/* Bouton profil - déplacé à la fin */}
                          <Link
                            href={`/admin/users/${participant.profiles.id}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Profil
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Pagination */}
            {totalParticipants > itemsPerPage && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    size="sm"
                  >
                    Précédent
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(totalParticipants / itemsPerPage) },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        const totalPages = Math.ceil(
                          totalParticipants / itemsPerPage
                        );
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (page >= currentPage - 1 && page <= currentPage + 1)
                          return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore =
                          index > 0 && page - array[index - 1] > 1;
                        const showEllipsisAfter =
                          index < array.length - 1 &&
                          array[index + 1] - page > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <Button
                              onClick={() => handlePageChange(page)}
                              disabled={loading}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                            {showEllipsisAfter && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage >=
                        Math.ceil(totalParticipants / itemsPerPage) || loading
                    }
                    variant="outline"
                    size="sm"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}

            {/* Informations de pagination */}
            {totalParticipants > 0 && (
              <div className="text-center py-4 text-gray-500">
                Page {currentPage} sur{" "}
                {Math.ceil(totalParticipants / itemsPerPage)} •
                {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, totalParticipants)} sur{" "}
                {totalParticipants} participants
              </div>
            )}
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default ParticipantsPage;
