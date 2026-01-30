"use client";

import React from "react";

type Order = {
  id: string;
  montant_total: number | null;
  statut: string | null;
  date_commande: string | null;
  date_paiement: string | null;
  type_paiement: string | null;
  notes: string | null;
  pack: {
    id: string;
    nom: string;
    prix: number;
    type_pack: string;
    nombre_cours_total?: number | null;
  } | null;
};

type Props = {
  orders: Order[];
};

export default function OrdersList({ orders }: Props) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-2 py-2 text-center min-h-[60px] flex items-center justify-center">
        Aucune commande
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white/70">
      {orders.map((o) => {
        const orderedAt = o.date_commande
          ? new Date(o.date_commande).toLocaleDateString("fr-FR")
          : "-";
        const amount =
          typeof o.montant_total === "number"
            ? `${o.montant_total.toFixed(2)} €`
            : "-";
        return (
          <div key={o.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">
                {o.pack?.nom || "Commande"}
              </div>
              <div className="text-xs text-gray-500">
                Commandé le {orderedAt}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700">{amount}</div>
              <div className="text-[11px] text-gray-500">{o.statut || "-"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
