import React from "react";
import Title from "@/components/title";
import { PackCard } from "./PackCard";
import { Pack } from "@/types/checkout";

interface PackSectionProps {
  type: "decouverte" | "mono_cours" | "multi_cours";
  packs: Pack[];
  selectedPack: Pack | null;
  onPackSelect: (pack: Pack) => void;
}

export const PackSection: React.FC<PackSectionProps> = ({
  type,
  packs,
  selectedPack,
  onPackSelect,
}) => {
  const getSectionTitle = (type: string) => {
    switch (type) {
      case "decouverte":
        return "Tarif Découverte";
      case "mono_cours":
        return "Tarif Formule";
      case "multi_cours":
        return "Tarif Packs";
      default:
        return type;
    }
  };

  const getSectionDescription = (type: string) => {
    switch (type) {
      case "decouverte":
        return "Un premier cours à prix doux pour explorer notre méthode en toute simplicité.";
      case "mono_cours":
        return "Nos formules vous permettent de réserver plusieurs séances d'un même cours à tarif dégressif. Idéal si vous souhaitez participer régulièrement à la même activité.";
      case "multi_cours":
        return "Nos packs vous permettent d'accéder à tous les cours au choix, avec des tarifs dégressifs. Idéal si vous venez régulièrement ou souhaitez varier les séances.";
      default:
        return undefined;
    }
  };

  if (packs.length === 0) return null;

  return (
    <div>
      <Title
        title={getSectionTitle(type)}
        description={getSectionDescription(type)}
        padding="p-0"
        className="mt-4 mb-2"
      />
      <div className="space-y-4">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            isSelected={selectedPack?.id === pack.id}
            onSelect={onPackSelect}
          />
        ))}
      </div>
    </div>
  );
};
