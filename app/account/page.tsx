"use client";

import Button from "@/components/button";
import Loader from "@/components/loader";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { UserProfile } from "@/types/types";
import { useAccountDashboard } from "@/hooks/useAccountDashboard";
import PacksCarousel from "@/components/account/PacksCarousel";
import Title from "@/components/title";
import ReservationsList from "@/components/account/ReservationsList";
import { useMediaQuery } from "react-responsive";
import OrdersList from "@/components/account/OrdersList";
import Card from "@/components/card";
import { useGTM } from "@/hooks/useGTM";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

const AccountPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const {
    loading: dashboardLoading,
    packs,
    upcomingReservations,
    pastReservations,
    orders,
    view,
    setView,
    handleInviteClick,
  } = useAccountDashboard();

  // track page view
  usePageViewTracking("account");

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const { trackPageView } = useGTM();

  useEffect(() => {
    trackPageView(window.location.href);
  }, [trackPageView]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/me/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);

          // Fixed admin check - role is an object, not an array
          setIsAdmin(
            data.user.role?.name === "admin" ||
              data.user.role?.name === "hostess"
          );
        } else {
          toast.error("Erreur lors du chargement du profil");
        }
      } catch {
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const disconnect = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecter avec succès", {
      icon: "👋",
      duration: 1500,
    });
    router.push("/");
  };

  // Items per page: 10 desktop, 5 mobile for orders, 3 for others
  const itemsPerPage = view === "orders" ? (isMobile ? 5 : 9) : 3;

  // pagination
  const currentListLength = useMemo(() => {
    if (view === "orders") return orders.length;
    return view === "past"
      ? pastReservations.length
      : upcomingReservations.length;
  }, [
    view,
    orders.length,
    pastReservations.length,
    upcomingReservations.length,
  ]);

  const totalPages = Math.max(1, Math.ceil(currentListLength / itemsPerPage));

  useEffect(() => {
    // Reset page when view or page size changes
    setPage(1);
  }, [view, itemsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * itemsPerPage;

  const displayedOrders = useMemo(() => {
    if (view !== "orders") return [];
    return orders.slice(startIndex, startIndex + itemsPerPage);
  }, [view, orders, startIndex, itemsPerPage]);

  const displayedReservations = useMemo(() => {
    if (view === "orders") return [];
    const list = view === "past" ? pastReservations : upcomingReservations;
    return list.slice(startIndex, startIndex + itemsPerPage);
  }, [view, pastReservations, upcomingReservations, startIndex, itemsPerPage]);

  // Sync right card height with combined left column height (desktop only)
  useEffect(() => {
    if (isMobile) {
      setRightHeight(undefined);
      return;
    }
    const update = () => {
      const h = leftColRef.current?.offsetHeight || 0;
      if (h) setRightHeight(h);
    };
    update();
    let observer: ResizeObserver | undefined;
    if (
      typeof window !== "undefined" &&
      "ResizeObserver" in window &&
      leftColRef.current
    ) {
      observer = new ResizeObserver(() => update());
      observer.observe(leftColRef.current);
    }
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [
    isMobile,
    dashboardLoading,
    packs.length,
    upcomingReservations.length,
    pastReservations.length,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 w-full pt-10 md:pt-20 xl:h-[90vh] xl:justify-center">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:-mt-40">
          <div className="space-y-8" ref={leftColRef}>
            {isMobile ? (
              <div className="p-0">
                <div className="flex items-center justify-between mb-6">
                  {isMobile ? (
                    <Title
                      title="Informations Personnelles"
                      padding="p-0"
                      className="mb-0"
                      noBorder={true}
                    />
                  ) : (
                    <h3 className="font-chillax text-gray-800 text-lg">
                      Informations Personnelles
                    </h3>
                  )}
                  <div className="flex items-center gap-2">
                    {isAdmin && !isMobile && (
                      <Button
                        variant="filled"
                        bgColor="bg-encoregreen"
                        borderColor="border-encoregreen"
                        textColor="text-white"
                        size="sm"
                        className="font-chillax border-1 border-encoregreen"
                        hoverBgColor="hover:bg-encoregreen/80"
                        hoverTextColor="hover:text-white"
                        href="/admin"
                        shadow={false}
                      >
                        Admin
                      </Button>
                    )}
                    {!isMobile && (
                      <Button
                        size="sm"
                        variant="outlined"
                        borderColor="border-marron"
                        textColor="text-marron"
                        hoverBgColor="hover:bg-darkBeige2"
                        className="bg-transparent"
                        shadow={false}
                        onClick={disconnect}
                      >
                        Se déconnecter
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.last_name || ""}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.first_name || ""}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.phone || ""}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <div className="relative">
                      <input
                        type="password"
                        value="••••••••"
                        readOnly
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm pr-12"
                      />
                      <button
                        onClick={() => setIsResetPasswordModalOpen(true)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Modifier le mot de passe"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Card
                padding="p-6"
                bgColor="bg-white/70"
                className="sm:border-none"
              >
                <div className="flex items-center justify-between mb-4">
                  {isMobile ? (
                    <Title
                      title="Informations Personnelles"
                      padding="p-0"
                      className="mb-0"
                      noBorder={true}
                    />
                  ) : (
                    <h3 className="font-chillax text-gray-800 text-lg">
                      Informations Personnelles
                    </h3>
                  )}
                  <div className="flex items-center gap-2">
                    {isAdmin && !isMobile && (
                      <Button
                        variant="filled"
                        bgColor="bg-encoregreen"
                        borderColor="border-encoregreen"
                        textColor="text-white"
                        size="sm"
                        className="font-chillax border-1 border-encoregreen"
                        hoverBgColor="hover:bg-encoregreen/80"
                        hoverTextColor="hover:text-white"
                        href="/admin"
                        shadow={false}
                      >
                        Admin
                      </Button>
                    )}
                    {!isMobile && (
                      <Button
                        size="sm"
                        variant="outlined"
                        borderColor="border-marron"
                        textColor="text-marron"
                        hoverBgColor="hover:bg-darkBeige2"
                        className="bg-transparent"
                        shadow={false}
                        onClick={disconnect}
                      >
                        Se déconnecter
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.last_name || ""}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.first_name || ""}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="text"
                      value={profile?.phone || ""}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="w-full">
                    <div className="relative">
                      <input
                        type="password"
                        value="••••••••"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f0] text-[#9CA3AF] border-none focus:outline-none text-sm pr-12"
                      />
                      <button
                        onClick={() => setIsResetPasswordModalOpen(true)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Modifier le mot de passe"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* My Programs Section */}
            {isMobile ? (
              <div className="p-0">
                {isMobile ? (
                  <Title
                    title="Mes Programmes"
                    padding="p-0"
                    className="mb-6"
                    noBorder={true}
                  />
                ) : (
                  <h3 className="font-chillax text-gray-800 text-lg mb-4">
                    Mes Programmes
                  </h3>
                )}
                {dashboardLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <PacksCarousel packs={packs} />
                )}
              </div>
            ) : (
              <Card
                padding="p-6"
                bgColor="bg-white/70"
                className="sm:border-none"
              >
                {isMobile ? (
                  <Title
                    title="Mes Programmes"
                    padding="p-0"
                    className="mb-4"
                  />
                ) : (
                  <h3 className="font-chillax text-gray-800 text-lg mb-4">
                    Mes Programmes
                  </h3>
                )}
                {dashboardLoading ? (
                  <div className="py-4 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <PacksCarousel packs={packs} />
                )}
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div style={rightHeight ? { height: rightHeight } : undefined}>
            {isMobile ? (
              <div className="p-0">
                <div className="flex items-center justify-between mb-6">
                  {isMobile ? (
                    <Title
                      title="Mes Cours"
                      padding="p-0"
                      className="mb-0"
                      noBorder={true}
                    />
                  ) : (
                    <h3 className="font-chillax text-gray-800 text-lg">
                      Mes Cours
                    </h3>
                  )}
                  <Card
                    padding="p-0"
                    bgColor="bg-white/70"
                    className="sm:border-none"
                  >
                    <details className="relative">
                      <summary className="list-none cursor-pointer text-gray-600 hover:text-gray-800 flex items-center gap-2 select-none">
                        <span className="text-sm">
                          {view === "orders"
                            ? "Commandes"
                            : view === "past"
                              ? "Cours passés"
                              : "Cours à venir"}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </summary>
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-md z-10">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-t-xl"
                          onClick={(e) => {
                            e.preventDefault();
                            setView("upcoming");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Cours à venir
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            setView("past");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Cours passés
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-b-xl"
                          onClick={(e) => {
                            e.preventDefault();
                            setView("orders");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Commandes
                        </button>
                      </div>
                    </details>
                  </Card>
                </div>
                {dashboardLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <>
                    {view === "orders" ? (
                      <OrdersList orders={displayedOrders} />
                    ) : (
                      <ReservationsList
                        reservations={displayedReservations}
                        emptyLabel={
                          view === "past"
                            ? "Aucun cours passé"
                            : "Aucune réservation à venir"
                        }
                        view={view}
                        onInvite={handleInviteClick}
                      />
                    )}
                  </>
                )}
                {/* Pagination */}
                {/* Pagination */}
                {!dashboardLoading && currentListLength > itemsPerPage && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600 px-3">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Card
                padding="p-6"
                bgColor="bg-white/70"
                className="sm:border-none h-full"
              >
                <div className="flex items-center justify-between mb-4 relative">
                  {isMobile ? (
                    <Title
                      title="Mes Cours"
                      padding="p-0"
                      className="mb-0"
                      noBorder={true}
                    />
                  ) : (
                    <h3 className="font-chillax text-gray-800 text-lg">
                      Mes Cours
                    </h3>
                  )}
                  <div className="relative">
                    <details className="relative">
                      <summary className="list-none cursor-pointer text-gray-600 hover:text-gray-800 flex items-center gap-2 select-none bg-white/70 font-chillax">
                        <span className="text-sm">
                          {view === "orders"
                            ? "Commandes"
                            : view === "past"
                              ? "Cours passés"
                              : "Cours à venir"}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </summary>
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 shadow-md z-10 bg-white/70 font-chillax">
                        <button
                          className="w-full text-left px-3 py-2 text-sm rounded-t-xl"
                          onClick={(e) => {
                            e.preventDefault();
                            setView("upcoming");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Cours à venir
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm "
                          onClick={(e) => {
                            e.preventDefault();
                            setView("past");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Cours passés
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-b-xl"
                          onClick={(e) => {
                            e.preventDefault();
                            setView("orders");
                            (
                              e.currentTarget.closest(
                                "details"
                              ) as HTMLDetailsElement
                            )?.removeAttribute("open");
                          }}
                        >
                          Commandes
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
                {dashboardLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <>
                    {view === "orders" ? (
                      <OrdersList orders={displayedOrders} />
                    ) : (
                      <ReservationsList
                        reservations={displayedReservations}
                        emptyLabel={
                          view === "past"
                            ? "Aucun cours passé"
                            : "Aucune réservation à venir"
                        }
                        view={view}
                        onInvite={handleInviteClick}
                      />
                    )}
                  </>
                )}
                {/* Pagination */}
                {!dashboardLoading && currentListLength > itemsPerPage && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>
          <div className="flex items-center justify-center mb-12">
            <div className="flex gap-4 items-center">
              {isMobile && isAdmin && (
                <Button
                  variant="filled"
                  bgColor="bg-encoregreen"
                  borderColor="border-encoregreen"
                  textColor="text-white"
                  size="sm"
                  className="font-chillax border-1 border-encoregreen"
                  hoverBgColor="hover:bg-encoregreen/80"
                  hoverTextColor="hover:text-white"
                  href="/admin"
                  shadow={false}
                >
                  Admin
                </Button>
              )}
              {isMobile && (
                <Button
                  size="sm"
                  variant="outlined"
                  borderColor="border-marron"
                  textColor="text-marron"
                  hoverBgColor="hover:bg-darkBeige2"
                  className="bg-transparent"
                  shadow={false}
                  onClick={disconnect}
                >
                  Se déconnecter
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AccountPage;
