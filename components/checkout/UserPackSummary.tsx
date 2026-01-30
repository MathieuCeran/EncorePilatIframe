import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserPackData } from "@/types/checkout";

interface UserPackSummaryProps {
  userPack: UserPackData;
  isMobile?: boolean;
}

export const UserPackSummary: React.FC<UserPackSummaryProps> = ({
  userPack,
  isMobile = false,
}) => {
  const containerClass = isMobile
    ? "p-4 rounded-xl space-y-3"
    : "text-[12px] text-gray-600 space-y-1";

  const titleClass = isMobile
    ? "font-medium text-marron text-sm"
    : "font-medium text-marron";

  const gridClass = isMobile ? "grid grid-cols-2 gap-4 text-sm" : "";

  const valueClass = isMobile ? "font-semibold text-marron" : "";

  const typePackFormatter = (typePack: string) => {
    if (typePack === "decouverte") return "Découverte";
    if (typePack === "mono_cours") return "Formule";
    if (typePack === "multi_cours") return "Pack";
    return typePack;
  };

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-encoregreen rounded-full"></div>
        <span className={titleClass}>
          {typePackFormatter(userPack.pack.type_pack)} - {userPack.pack.nom}
        </span>
      </div>

      <div className={gridClass}>
        <div>
          <span className="text-gray-600">Cours restants :</span>
          <div className={valueClass}>{userPack.cours_restants}</div>
        </div>

        {userPack.date_expiration && (
          <div>
            <span className="text-gray-600">Expire le :</span>
            <div className={valueClass}>
              {format(new Date(userPack.date_expiration), "d MMM yyyy", {
                locale: fr,
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
