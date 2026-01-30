import React from "react";
import Button from "@/components/button";
import { FilterType } from "@/types/checkout";

interface PackFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const PackFilter: React.FC<PackFilterProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "decouverte":
        return "Découverte";
      case "mono_cours":
        return "Formules";
      case "multi_cours":
        return "Packs";
      default:
        return type;
    }
  };

  const filters: FilterType[] = [
    "tout",
    "decouverte",
    "mono_cours",
    "multi_cours",
  ];

  return (
    <div className="mb-2">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            size="sm"
            variant="filled"
            bgColor={
              activeFilter === filter
                ? "bg-[var(--color-encoregreen)] text-white"
                : "bg-[var(--color-darkBeige2)]  text-marron"
            }
            hoverBgColor={
              activeFilter === filter
                ? "hover:bg-encoregreen/80"
                : "hover:bg-darkBeige2/80"
            }
            textColor="text-[var(--color-marron)]"
            onClick={() => onFilterChange(filter)}
            shadow={false}
            className="flex-shrink-0"
          >
            {filter === "tout" ? "Tout" : getTypeLabel(filter)}
          </Button>
        ))}
      </div>
    </div>
  );
};
