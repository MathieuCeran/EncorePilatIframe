"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/card";
import Button from "@/components/button";
import CheckIcon from "@/components/ui/CheckIcon";
import Loader from "@/components/loader";
import MapComponent from "@/components/MapComponent";
import Confetti from "@/components/Confetti";
import { generateGoogleCalendarLink } from "@/lib/calendar-utils";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface SuccessData {
  booking: {
    id: string;
    courses: {
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      course_types: {
        name: string;
      };
    };
  };
  order: {
    id: string;
    montant_total: number;
    type_paiement: string;
    statut: string;
  };
  promo?: {
    code: string;
    discount?: number;
  };
  message: string;
}

const SuccessCashContent = () => {
  const searchParams = useSearchParams();
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const fetchSuccessData = async () => {
      try {
        const bookingId = searchParams.get("booking_id");
        const orderId = searchParams.get("order_id");

        if (!bookingId || !orderId) {
          setError("Paramètres manquants");
          setLoading(false);
          return;
        }

        // Récupérer les données de la réservation
        const response = await fetch(`/api/bookings/${bookingId}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", response.status, errorData);

          if (response.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
          } else if (response.status === 404) {
            setError("Réservation introuvable");
          } else {
            throw new Error(
              errorData.error ||
                "Impossible de récupérer les informations de réservation"
            );
          }
          return;
        }

        const data = await response.json();

        // Ajouter les informations de la commande
        const orderData = {
          id: orderId,
          montant_total: parseFloat(searchParams.get("amount") || "0"),
          type_paiement: "cash",
          statut: "pending",
        };

        const promo = searchParams.get("promo_code");
        const discount = searchParams.get("discount");

        setSuccessData({
          ...data,
          order: orderData,
          promo: promo
            ? {
                code: promo,
                discount: discount ? parseFloat(discount) : undefined,
              }
            : undefined,
          message:
            "Votre réservation a été créée avec succès. Paiement en attente.",
        });

        // Tracker l'achat avec Meta Pixel (une seule fois)
        if (!hasTracked.current && typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Purchase', {
            value: orderData.montant_total,
            currency: 'MAD',
            content_ids: [orderId]
          });
          hasTracked.current = true;
        }
        
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des informations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessData();
  }, [searchParams]); // Retirer trackPurchase des dépendances

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error || !successData) {
    return (
      <div className="min-h-screen">
        <BackgroundWrapper>
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Card className="text-center p-8">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-playfair text-marron mb-4">Erreur</h1>
              <p className="text-gray-600 mb-6">
                {error ||
                  "Impossible de charger les informations de réservation"}
              </p>
              <Button
                href="/account"
                variant="filled"
                bgColor="bg-marron"
                textColor="text-white"
              >
                Retour à mon compte
              </Button>
            </Card>
          </div>
        </BackgroundWrapper>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Générer le lien Google Calendar
  const googleCalendarLink = successData
    ? generateGoogleCalendarLink({
        title: `Cours Encore Pilates - ${successData.booking.courses.course_types.name}`,
        description: `Votre cours de ${successData.booking.courses.course_types.name}\n\nN'oubliez pas:\n- Arrivez 10 minutes avant\n- Apportez une bouteille d'eau et une serviette\n- Portez des vêtements confortables\n\nNuméro de commande: ${successData.order.id}`,
        location:
          "Angle Rue N1 et 3, Quartier de l'Aviation, Residence magnolia, Bureau B5, RDC, Casablanca, Maroc",
        startDate: successData.booking.courses.date,
        startTime: formatTime(successData.booking.courses.start_time),
        endTime: formatTime(successData.booking.courses.end_time),
      })
    : "";

  return (
    <div className="min-h-screen">
      <Confetti />
      <BackgroundWrapper>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <Card className="text-center p-8">
              {/* Icône de succès */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-encoregreen rounded-full flex items-center justify-center">
                  <CheckIcon width={40} height={40} className="text-white" />
                </div>
              </div>

              {/* Titre */}
              <h1 className="text-3xl font-playfair text-marron mb-2">
                Réservation créée !
              </h1>
              <p className="text-gray-600 mb-8">
                Votre réservation a été créée avec succès. Paiement en attente.
              </p>

              {/* Informations du cours */}
              <Card className="mb-6 text-left" padding="p-6">
                <h2 className="text-xl font-playfair text-marron mb-4">
                  Détails du cours
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cours :</span>
                    <span className="font-medium">
                      {successData.booking.courses.course_types.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date :</span>
                    <span className="font-medium">
                      {formatDate(successData.booking.courses.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heure :</span>
                    <span className="font-medium">
                      {formatTime(successData.booking.courses.start_time)} -{" "}
                      {formatTime(successData.booking.courses.end_time)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Informations de la commande */}
              <Card className="mb-8 text-left" padding="p-6">
                <h2 className="text-xl font-playfair text-marron mb-4">
                  Détails de la commande
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de commande :</span>
                    <span className="font-medium">#{successData.order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant :</span>
                    <span className="font-medium">
                      {successData.order.montant_total} MAD
                    </span>
                  </div>
                  {successData.promo ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code promo :</span>
                        <span className="font-medium">
                          {successData.promo.code}
                        </span>
                      </div>
                      {typeof successData.promo.discount === "number" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Réduction :</span>
                          <span className="font-medium text-green-700">
                            -{successData.promo.discount} MAD
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode de paiement :</span>
                    <span className="font-medium">Paiement en espèces</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut :</span>
                    <span className="font-medium text-orange-600">
                      En attente de paiement
                    </span>
                  </div>
                </div>
              </Card>

              {/* Instructions importantes */}
              <Card className="mb-6" padding="p-6" bgColor="bg-encoregreen/30">
                <h3 className="font-semibold text-marron mb-2">
                  Instructions importantes :
                </h3>
                <ul className="text-marron text-sm space-y-1">
                  <li>• Arrivez 10 minutes avant le début du cours</li>

                  <li>
                    • Présentez votre nom et prénom lors de votre arrivée au
                    studio.
                  </li>
                  <li>• Le paiement sera confirmé par notre équipe</li>
                </ul>
              </Card>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={googleCalendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-3 text-xl rounded-full font-medium transition bg-white/20 backdrop-blur-[7.9px] border border-encoregreen text-encoregreen hover:bg-white/30 font-chillax text-[13px] shadow-[4px_4px_16px_0_rgba(0,0,0,0.08)]"
                >
                  📅 Ajouter au calendrier
                </a>
                <Button
                  href="/account"
                  variant="filled"
                  bgColor="bg-marron"
                  textColor="text-white"
                  size="lg"
                >
                  Voir mes réservations
                </Button>
                <Button
                  href="/cours"
                  variant="outlined"
                  borderColor="border-marron"
                  textColor="text-marron"
                  size="lg"
                >
                  Réserver un autre cours
                </Button>
              </div>

              {/* Informations supplémentaires */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Un email de confirmation vous a été envoyé avec tous les
                  détails.
                </p>
              </div>
            </Card>

            {/* Composant de carte */}
            <MapComponent />
          </div>
        </div>
      </BackgroundWrapper>
    </div>
  );
};

const SuccessCashPage = () => {
  return (
    <Suspense fallback={<Loader />}>
      <SuccessCashContent />
    </Suspense>
  );
};

export default SuccessCashPage;
