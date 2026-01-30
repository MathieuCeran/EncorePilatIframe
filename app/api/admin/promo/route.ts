import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreatePromoCodeRequest {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  minimum_order_amount?: number | null;
  maximum_discount_amount?: number | null;
  usage_limit?: number | null;
  user_usage_limit?: number | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_active?: boolean;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: "Erreur lors du chargement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreatePromoCodeRequest = await request.json();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    // Role check (admin)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .single();

    const roleName = Array.isArray(roleData?.roles)
      ? (roleData?.roles?.[0]?.name ?? null)
      : ((roleData as { roles?: { name?: string } })?.roles?.name ?? null);

    if (!roleName || roleName !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Validate
    const required = [
      body.code?.trim(),
      body.discount_type,
      body.discount_value,
      body.start_date,
      body.end_date,
    ];
    if (required.some((v) => v === undefined || v === null || v === "")) {
      return NextResponse.json(
        { success: false, message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed_amount"].includes(body.discount_type)) {
      return NextResponse.json(
        { success: false, message: "Type de remise invalide" },
        { status: 400 }
      );
    }

    if (body.discount_type === "percentage") {
      if (body.discount_value <= 0 || body.discount_value > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Le pourcentage doit être entre 1 et 100",
          },
          { status: 400 }
        );
      }
    } else {
      if (body.discount_value <= 0) {
        return NextResponse.json(
          { success: false, message: "Le montant fixe doit être positif" },
          { status: 400 }
        );
      }
    }

    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(
        { success: false, message: "Période invalide" },
        { status: 400 }
      );
    }

    // Insert
    const insertData = {
      code: body.code.trim(),
      description: body.description ?? null,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      minimum_order_amount: body.minimum_order_amount ?? 0,
      maximum_discount_amount: body.maximum_discount_amount ?? null,
      usage_limit: body.usage_limit ?? null,
      user_usage_limit: body.user_usage_limit ?? 1,
      start_date: body.start_date,
      end_date: body.end_date,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("promo_codes")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la création",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: "Code promo créé avec succès" },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
