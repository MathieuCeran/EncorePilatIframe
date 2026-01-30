import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim();
    const packId = searchParams.get("pack_id");
    const supabase = await createClient();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code requis" },
        { status: 400 }
      );
    }
    if (!packId) {
      return NextResponse.json(
        { success: false, message: "Pack requis" },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Optional: resolve current user to check per-user usage limits early for UX
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: pack, error: packError } = await service
      .from("packs")
      .select("id, prix")
      .eq("id", packId)
      .is("deleted_at", null) // Exclure les packs supprimés
      .single();
    if (packError || !pack) {
      return NextResponse.json(
        { success: false, message: "Pack introuvable" },
        { status: 404 }
      );
    }

    const { data: promo, error: promoError } = await service
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (promoError || !promo) {
      return NextResponse.json(
        { success: false, message: "Code promo invalide" },
        { status: 404 }
      );
    }

    const now = new Date();
    const startOk = !promo.start_date || new Date(promo.start_date) <= now;
    const endOk = !promo.end_date || new Date(promo.end_date) >= now;
    if (!startOk || !endOk) {
      return NextResponse.json(
        { success: false, message: "Code promo expiré" },
        { status: 400 }
      );
    }

    const total = Number(pack.prix);
    if (promo.minimum_order_amount && total < promo.minimum_order_amount) {
      return NextResponse.json(
        { success: false, message: "Montant minimum non atteint" },
        { status: 400 }
      );
    }

    // Check global usage limit
    if (promo.usage_limit !== null && promo.usage_limit !== undefined) {
      const { count: totalUsage } = await service
        .from("promo_code_usages")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promo.id);
      if (typeof totalUsage === "number" && totalUsage >= promo.usage_limit) {
        return NextResponse.json(
          { success: false, message: "Limite d'utilisation atteinte" },
          { status: 400 }
        );
      }
    }

    // Check per-user usage limit when logged in
    if (
      user &&
      promo.user_usage_limit !== null &&
      promo.user_usage_limit !== undefined
    ) {
      const { count: userUsage } = await service
        .from("promo_code_usages")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promo.id)
        .eq("user_id", user.id);
      if (
        typeof userUsage === "number" &&
        userUsage >= promo.user_usage_limit
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Limite d'utilisation par utilisateur atteinte",
          },
          { status: 400 }
        );
      }
    }

    let discountAmount = 0;
    if (promo.discount_type === "percentage") {
      discountAmount = (total * promo.discount_value) / 100;
    } else {
      discountAmount = promo.discount_value;
    }
    if (promo.maximum_discount_amount) {
      discountAmount = Math.min(discountAmount, promo.maximum_discount_amount);
    }
    const discountedTotal = Math.max(
      0,
      Number((total - discountAmount).toFixed(2))
    );

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        description: promo.description ?? null,
        discountAmount,
        discountedTotal,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
