import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormattedCourse } from "@/types/types";
import { Pack, UserPackData, FilterType } from "@/types/checkout";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const useCheckout = () => {
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [course, setCourse] = useState<FormattedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tout");
  const [autoSelectedFromUserPack, setAutoSelectedFromUserPack] =
    useState<UserPackData | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<null | {
    code: string;
    discountAmount: number;
    discountedTotal: number;
    description?: string | null;
  }>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const packId = searchParams.get("packId");
        let courseTypeId = searchParams.get("courseTypeId");
        const courseId = searchParams.get("courseId");

        // Fetch course first if courseId is provided
        if (courseId) {
          const courseRes = await fetch(`/api/calendar?courseId=${courseId}`);
          const courseData = await courseRes.json();
          if (courseData.success) {
            const coursesArr: FormattedCourse[] = Array.isArray(courseData.data)
              ? courseData.data
              : [courseData.data];
            const selectedCourse = coursesArr[0] || null;
            if (selectedCourse) {
              setCourse(selectedCourse);
              // Use course type id to fetch relevant packs if not already provided
              if (!courseTypeId && selectedCourse.courseTypeId) {
                courseTypeId = selectedCourse.courseTypeId;
              }
            }
          }
        }

        // Fetch packs
        let url = "/api/packs";
        const params = new URLSearchParams();
        if (packId) {
          params.append("id", packId);
        } else if (courseTypeId) {
          // Handle both single courseTypeId and arrays
          const courseTypeIds = courseTypeId
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);
          if (courseTypeIds.length === 1) {
            params.append("course_type_id", courseTypeIds[0]);
          } else if (courseTypeIds.length > 1) {
            courseTypeIds.forEach((id) => params.append("course_type_ids", id));
          }
        }
        if (params.toString()) url += `?${params.toString()}`;

        const packsRes = await fetch(url);
        const packsData = await packsRes.json();
        if (packsData.success) {
          const packsArr = Array.isArray(packsData.data)
            ? packsData.data
            : [packsData.data];
          setPacks(packsArr);

          // Auto-select pack if only one is available
          if (packsArr.length === 1) {
            setSelectedPack(packsArr[0]);
          }
        }

        // Check if the current user has any active pack
        try {
          const typeId = courseTypeId || undefined;
          if (typeId) {
            // Handle both single courseTypeId and arrays
            const courseTypeIds = typeId
              .split(",")
              .map((id) => id.trim())
              .filter((id) => id);
            if (courseTypeIds.length === 1) {
              const res = await fetch(
                `/api/me/active-pack?courseTypeId=${courseTypeIds[0]}`
              );
              if (res.ok) {
                const json = await res.json();
                if (json?.selected?.pack) {
                  setAutoSelectedFromUserPack(json.selected);
                  setSelectedPack(json.selected.pack);
                }
              }
            } else if (courseTypeIds.length > 1) {
              // For multiple course types, try to find a pack that works for any of them
              const params = new URLSearchParams();
              courseTypeIds.forEach((id) => params.append("courseTypeIds", id));
              const res = await fetch(
                `/api/me/active-pack?${params.toString()}`
              );
              if (res.ok) {
                const json = await res.json();
                if (json?.selected?.pack) {
                  setAutoSelectedFromUserPack(json.selected);
                  setSelectedPack(json.selected.pack);
                }
              }
            }
          } else {
            const res = await fetch("/api/me/active-pack");
            if (res.ok) {
              const json = await res.json();
              if (json?.selected?.pack) {
                setAutoSelectedFromUserPack(json.selected);
                setSelectedPack(json.selected.pack);
              }
            }
          }
        } catch {}
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const handlePackSelection = (pack: Pack) => {
    setSelectedPack(pack);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const applyPromo = async (code: string) => {
    if (!selectedPack) {
      toast.error("Veuillez sélectionner un pack d'abord");
      return;
    }
    // If decouverte pack, pre-check eligibility for this course type
    if (selectedPack.type_pack === "decouverte") {
      const typeId = course?.courseTypeId;
      if (typeId) {
        try {
          const res = await fetch(
            `/api/me/discovery-eligibility?courseTypeId=${encodeURIComponent(typeId)}`
          );
          const json = await res.json();
          if (!res.ok || !json.success || json.discoveryEligible === false) {
            toast.error(
              json?.message ||
                "Vous avez déjà utilisé une offre Découverte pour ce type de cours"
            );
            return;
          }
        } catch {}
      }
    }
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Veuillez saisir un code promo");
      return;
    }
    try {
      const res = await fetch(
        `/api/promo/validate?code=${encodeURIComponent(trimmed)}&pack_id=${encodeURIComponent(String(selectedPack.id))}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Code promo invalide");
        setAppliedPromo(null);
        return;
      }
      setPromoCode(trimmed);
      setAppliedPromo({
        code: trimmed,
        discountAmount: json.data.discountAmount,
        discountedTotal: json.data.discountedTotal,
        description: json.data.description ?? null,
      });
      toast.success("Code promo appliqué");
    } catch (e) {
      console.error("Error applying promo:", e);
      toast.error("Impossible de valider le code promo");
    }
  };

  const clearPromo = () => {
    setPromoCode("");
    setAppliedPromo(null);
  };
  const updatePromoCode = (text: string) => {
    setPromoCode(text);
  };

  const handleSitePayment = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Veuillez vous connecter pour payer");
      window.location.href = "/signin";
      return;
    }

    if (!selectedPack || !course) {
      toast.error("Veuillez sélectionner un pack et un cours");
      return;
    }

    // Tracker le début du checkout avec Meta Pixel
    const amount = appliedPromo
      ? appliedPromo.discountedTotal
      : selectedPack.prix;
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        value: amount,
        currency: "MAD",
      });
    }

    // If decouverte pack, pre-check eligibility before attempting booking
    if (selectedPack.type_pack === "decouverte") {
      try {
        const res = await fetch(
          `/api/me/discovery-eligibility?courseTypeId=${encodeURIComponent(course.courseTypeId)}`
        );
        const json = await res.json();
        if (!res.ok || !json.success || json.discoveryEligible === false) {
          toast.error(
            json?.message ||
              "Vous avez déjà utilisé une offre Découverte pour ce type de cours"
          );
          return;
        }
      } catch {}
    }

    try {
      const response = await fetch("/api/bookings/cash-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_id: course.id,
          pack_id: selectedPack.id,
          promo_code: appliedPromo?.code ?? undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Réservation créée avec succès", {
          description:
            "Votre réservation est en attente de paiement cash. Vous recevrez une confirmation par email.",
          duration: 5000,
        });

        // Rediriger vers la page de succès
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          window.location.href = "/account";
        }
      } else {
        toast.error("Erreur lors de la création de la réservation", {
          description: data.error || "Une erreur est survenue",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error creating cash payment booking:", error);
      toast.error("Erreur de connexion", {
        description: "Impossible de se connecter au serveur",
        duration: 5000,
      });
    }
  };

  return {
    packs,
    course,
    loading,
    error,
    selectedPack,
    activeFilter,
    autoSelectedFromUserPack,
    promoCode,
    appliedPromo,
    updatePromoCode,
    handlePackSelection,
    handleFilterChange,
    handleSitePayment,
    applyPromo,
    clearPromo,
  };
};
