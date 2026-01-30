import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Card from "@/components/card";
import CheckIcon from "@/components/ui/CheckIcon";
import { Pack } from "@/types/checkout";

interface PackCardProps {
  pack: Pack;
  isSelected: boolean;
  onSelect: (pack: Pack) => void;
}

export const PackCard: React.FC<PackCardProps> = ({
  pack,
  isSelected,
  onSelect,
}) => {
  const formatExpirationDate = (days: number) => {
    const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const formatted = format(expirationDate, "d MMMM yyyy", { locale: fr });
    const months = Math.round(days / 30);
    const suffix = months >= 1 ? ` (${months} mois)` : ` (${days} jours)`;
    return `Expire le ${formatted}${suffix}`;
  };

  return (
    <div
      className={`rounded-[24px] cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-marron/40 shadow-lg" : "hover:shadow-md"
      }`}
      onClick={() => onSelect(pack)}
    >
      <Card padding="p-6 md:p-8" className="rounded-[24px]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base md:text-lg font-chillax mb-1 text-marron tracking-wide">
              {pack.nom}
              {pack.nombre_cours_total
                ? ` (${pack.nombre_cours_total} cours)`
                : ""}
            </h3>

            {pack.description && (
              <p className="text-gray-600 text-sm font-chillax leading-relaxed mb-5">
                {pack.description}
              </p>
            )}

            {pack.course_types && pack.course_types.length > 0 && (
              <ul className="space-y-2 text-[13px] text-marron/80 font-chillax mb-6 ml-1">
                {pack.course_types.map((ct) => (
                  <li key={ct.id} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-darkGold flex-shrink-0">
                      <CheckIcon width={12} height={12} />
                    </span>
                    <span className="flex-1">
                      {ct.name}
                      {ct.max_utilisations
                        ? pack.type_pack === "multi_cours"
                          ? `(${ct.max_utilisations} max)`
                          : ``
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="text-marron font-chillax text-lg">
              {`DHS ${pack.prix.toFixed(2)}`}
            </div>

            {typeof pack.duree_validite_jours === "number" &&
              pack.duree_validite_jours > 0 && (
                <div className="text-[12px] text-gray-500 font-chillax">
                  {formatExpirationDate(pack.duree_validite_jours)}
                </div>
              )}
          </div>
        </div>
      </Card>
    </div>
  );
};
