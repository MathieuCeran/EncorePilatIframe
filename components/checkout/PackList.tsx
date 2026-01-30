import React from "react";
import { PackFilter } from "./PackFilter";
import { PackSection } from "./PackSection";
import { Pack, FilterType, UserPackData } from "@/types/checkout";

interface PackListProps {
  packs: Pack[];
  selectedPack: Pack | null;
  activeFilter: FilterType;
  userPack: UserPackData | null;
  onPackSelect: (pack: Pack) => void;
  onFilterChange: (filter: FilterType) => void;
}

export const PackList: React.FC<PackListProps> = ({
  packs,
  selectedPack,
  activeFilter,
  userPack,
  onPackSelect,
  onFilterChange,
}) => {
  const filteredPacks = packs.filter((pack) => {
    if (activeFilter === "tout") return true;
    return pack.type_pack === activeFilter;
  });

  const typesToShow: Array<"decouverte" | "mono_cours" | "multi_cours"> =
    activeFilter === "tout"
      ? ["decouverte", "mono_cours", "multi_cours"]
      : [activeFilter];

  const anyPacks = filteredPacks.length > 0;

  // If user has a pack, show packs but make them non-clickable
  if (userPack) {
    return (
      <div className="md:col-span-2 space-y-4">
        <PackFilter
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />

        <div className="text-center py-4 mb-6">
          <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            Vous avez un pack actif. Utilisez votre pack pour réserver ce cours.
          </p>
        </div>

        <div className="space-y-10 opacity-50 pointer-events-none">
          {typesToShow.map((type) => {
            const packsForType = filteredPacks.filter(
              (p) => p.type_pack === type
            );

            return (
              <PackSection
                key={type}
                type={type}
                packs={packsForType}
                selectedPack={selectedPack}
                onPackSelect={() => {}} // Empty function to disable selection
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (!anyPacks) {
    return (
      <div className="md:col-span-2 space-y-4">
        <PackFilter
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
        <div className="text-center py-8">
          <p className="text-gray-600">
            Aucun pack disponible pour ce type de cours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2 space-y-4">
      <PackFilter activeFilter={activeFilter} onFilterChange={onFilterChange} />

      <div className="space-y-10">
        {typesToShow.map((type) => {
          const packsForType = filteredPacks.filter(
            (p) => p.type_pack === type
          );

          return (
            <PackSection
              key={type}
              type={type}
              packs={packsForType}
              selectedPack={selectedPack}
              onPackSelect={onPackSelect}
            />
          );
        })}
      </div>
    </div>
  );
};
