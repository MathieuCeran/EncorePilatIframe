"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Retour au dashboard",
  actionLabel,
  onAction,
  actionIcon = <Plus className="h-4 w-4" />,
}: PageHeaderProps) {
  return (
    <>
      {/* Bouton de retour */}
      {backHref && (
        <div className="mb-6">
          <Link href={backHref}>
            <Button variant="outline" className="flex items-center gap-2">
              ← {backLabel}
            </Button>
          </Link>
        </div>
      )}

      {/* En-tête principal */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="flex items-center gap-2">
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </div>
    </>
  );
}
