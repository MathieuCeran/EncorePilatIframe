import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CommandeRow = {
  id: string;
  user_id: string;
  pack_id: string | null;
  montant_total: number | null;
  type_paiement: string | null;
  date_paiement: string | null;
  notes: string | null;
  statut: string | null;
  date_commande: string | null;
  created_at: string;
  updated_at: string;
  packs:
    | {
        id: string;
        nom: string;
        prix: number;
        type_pack: string;
        nombre_cours_total: number | null;
      }[]
    | null;
};

type OrderResponse = {
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
    nombre_cours_total: number | null;
  } | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // Fetch commandes for the current user, with optional pack info
    const { data, error } = await supabase
      .from("commandes")
      .select(
        `id, user_id, pack_id, montant_total, type_paiement:type_paiement, date_paiement:date_paiement, notes, statut, date_commande, created_at, updated_at,
         packs:packs ( id, nom, prix, type_pack, nombre_cours_total )`
      )
      .eq("user_id", user.id)
      .order("date_commande", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération des commandes",
        },
        { status: 500 }
      );
    }

    const orders = (data || []).map(
      (row: CommandeRow): OrderResponse => ({
        id: row.id,
        montant_total: row.montant_total,
        statut: row.statut,
        date_commande: row.date_commande,
        date_paiement: row.date_paiement,
        type_paiement: row.type_paiement,
        notes: row.notes,
        pack: row.packs?.[0] || null,
      })
    );

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
