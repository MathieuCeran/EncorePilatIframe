"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { FormDialog } from "@/components/ui/form-dialog";
import { toast } from "sonner";

type DiscountType = "percentage" | "fixed_amount";

interface PromoFormData {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_amount?: number | null;
  maximum_discount_amount?: number | null;
  usage_limit?: number | null;
  user_usage_limit?: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  user_usage_limit: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminPromoPage() {
  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [promos, setPromos] = React.useState<PromoCode[]>([]);
  const [form, setForm] = React.useState<PromoFormData>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_amount: 0,
    maximum_discount_amount: null,
    usage_limit: null,
    user_usage_limit: 1,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    is_active: true,
  });

  const handleChange = <K extends keyof PromoFormData>(
    key: K,
    value: PromoFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadPromos = async () => {
    try {
      setListLoading(true);
      const res = await fetch("/api/admin/promo");
      const data = await res.json();
      if (data.success) {
        setPromos(data.data as PromoCode[]);
      } else {
        toast.error(data.message || "Erreur lors du chargement");
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setListLoading(false);
    }
  };

  React.useEffect(() => {
    loadPromos();
  }, []);

  const createPromo = async () => {
    setLoading(true);
    try {
      const toNullableNumber = (v: unknown): number | null =>
        v === null || v === undefined || v === "" ? null : Number(v);

      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        minimum_order_amount: toNullableNumber(form.minimum_order_amount),
        maximum_discount_amount: toNullableNumber(form.maximum_discount_amount),
        usage_limit: toNullableNumber(form.usage_limit),
        user_usage_limit: toNullableNumber(form.user_usage_limit),
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
      };

      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de la création");
      }
      toast.success("Code promo créé avec succès");
      setCreateOpen(false);
      loadPromos();
      setForm((prev) => ({
        ...prev,
        code: "",
        description: "",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<PromoCode>[] = React.useMemo(
    () => [
      { key: "code", header: "Code", render: (r) => r.code },
      {
        key: "discount_type",
        header: "Type",
        render: (r) =>
          r.discount_type === "percentage" ? "Pourcentage" : "Montant",
      },
      {
        key: "discount_value",
        header: "Valeur",
        render: (r) =>
          r.discount_type === "percentage"
            ? `${r.discount_value}%`
            : `${r.discount_value} MAD`,
      },
      {
        key: "usage_count",
        header: "Utilisations",
        render: (r) =>
          `${r.usage_count}${r.usage_limit ? `/${r.usage_limit}` : ""}`,
      },
      {
        key: "user_usage_limit",
        header: "Par utilisateur",
        render: (r) => r.user_usage_limit ?? "-",
      },
      {
        key: "is_active",
        header: "Actif",
        render: (r) => (r.is_active ? "Oui" : "Non"),
      },
    ],
    []
  );

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Codes promo"
        description="Gérez vos codes promotionnels"
        backHref="/admin"
        actionLabel="Nouveau code"
        onAction={() => setCreateOpen(true)}
      />

      <DataTable
        data={promos}
        columns={columns}
        title="Codes promo"
        description="Liste des codes promotionnels"
        searchFields={["code", "description"] as (keyof PromoCode)[]}
        searchPlaceholder="Rechercher par code ou description..."
        loading={listLoading}
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Créer un code promo"
        description="Définissez les paramètres du code promo"
        onSubmit={createPromo}
        submitLabel="Créer"
        loading={loading}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) =>
                  handleChange("code", e.target.value.toUpperCase())
                }
                placeholder="EX: WELCOME10"
                required
              />
            </div>
            <div>
              <Label>Type de remise</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm">Montant</span>
                <Switch
                  checked={form.discount_type === "percentage"}
                  onCheckedChange={(checked) =>
                    handleChange(
                      "discount_type",
                      checked ? "percentage" : "fixed_amount"
                    )
                  }
                />
                <span className="text-sm">Pourcentage</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_value">
                {form.discount_type === "percentage"
                  ? "Pourcentage (%)"
                  : "Montant (MAD)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min={form.discount_type === "percentage" ? 1 : 0.01}
                step={form.discount_type === "percentage" ? 1 : 0.01}
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) =>
                  handleChange("discount_value", Number(e.target.value))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="minimum_order_amount">
                Montant minimum commande (optionnel)
              </Label>
              <Input
                id="minimum_order_amount"
                type="number"
                min={0}
                step={0.01}
                value={form.minimum_order_amount ?? ""}
                onChange={(e) =>
                  handleChange(
                    "minimum_order_amount",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maximum_discount_amount">Remise max (si %)</Label>
              <Input
                id="maximum_discount_amount"
                type="number"
                min={0}
                step={0.01}
                value={form.maximum_discount_amount ?? ""}
                onChange={(e) =>
                  handleChange(
                    "maximum_discount_amount",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="usage_limit">
                Limite d&#39;utilisation totale
              </Label>
              <Input
                id="usage_limit"
                type="number"
                min={0}
                step={1}
                value={form.usage_limit ?? ""}
                onChange={(e) =>
                  handleChange(
                    "usage_limit",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user_usage_limit">Limite par utilisateur</Label>
              <Input
                id="user_usage_limit"
                type="number"
                min={1}
                step={1}
                value={form.user_usage_limit ?? 1}
                onChange={(e) =>
                  handleChange("user_usage_limit", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label>Actif</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    handleChange("is_active", checked)
                  }
                />
                <span>{form.is_active ? "Oui" : "Non"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Début</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Fin</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optionnel"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
