"use client";

import React, { useState } from "react";
import Card from "@/components/card";

type PackPurchase = {
  id: string;
  cours_restants: number;
  date_expiration: string | null;
  restrictions?: Array<{
    course_type_id: string;
    max_utilisations: number | null;
    used?: number;
    name?: string;
  }>;
  pack: {
    id: string;
    nom: string;
    prix: number;
    type_pack: string;
    nombre_cours_total?: number | null;
  };
};

type Props = {
  packs: PackPurchase[];
};

export default function PacksCarousel({ packs }: Props) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(packs.length / itemsPerPage));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  if (!packs || packs.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-2 py-4">
        Aucun programme actif
      </div>
    );
  }

  const startIndex = (page - 1) * itemsPerPage;
  const displayedPacks = packs.slice(startIndex, startIndex + itemsPerPage);

  // Reset page if data shrinks

  function typePackFormatter(typePack: string) {
    switch (typePack) {
      case "decouverte":
        return "Découverte";
      case "mono_cours":
        return "Formule";
      case "multi_cours":
        return "Pack";
      default:
        return typePack;
    }
  }

  return (
    <div>
      <div className="overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-4 pr-2">
          {displayedPacks.map((p) => {
            const total = p.pack.nombre_cours_total ?? undefined;
            const remaining = p.cours_restants;
            const exp = p.date_expiration
              ? new Date(p.date_expiration).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : null;

            return (
              <Card
                key={p.id}
                className="w-full rounded-[24px] border border-gray-200 px-4 py-3"
                bgColor="bg-[#f5f5f0]"
                shadow={false}
              >
                <div className="font-aboreto text-lg text-gray-800 mb-1">
                  {p.pack.nom}
                </div>
                <div className="text-xs text-gray-600 mb-2 capitalize">
                  Type: {typePackFormatter(p.pack.type_pack)}
                </div>
                <div className="text-sm text-gray-700">
                  {typeof total === "number" ? (
                    <>
                      Cours restants:{" "}
                      <span className="font-semibold">{remaining}</span>
                      <span className="text-gray-400"> / {total}</span>
                    </>
                  ) : (
                    <>
                      Cours restants:{" "}
                      <span className="font-semibold">{remaining}</span>
                    </>
                  )}
                </div>
                {exp && (
                  <div className="text-[11px] text-gray-500 mt-2 text-right">
                    Expire le {exp}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {packs.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-center gap-3">
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
