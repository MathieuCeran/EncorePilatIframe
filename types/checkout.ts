export interface PackCourseType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_utilisations?: number;
}

export interface Pack {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  type_pack: "decouverte" | "mono_cours" | "multi_cours";
  duree_validite_jours?: number | null;
  nombre_cours_total?: number | null;
  course_types?: PackCourseType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPackData {
  purchaseId: string;
  cours_restants: number;
  date_expiration: string | null;
  date_achat: string | null;
  max_utilisations: number | null;
  used_for_type: number;
  restrictions?: {
    course_type_id: string;
    max_utilisations: number | null;
    name?: string;
  }[];
  pack: Pack;
}

export type FilterType = "tout" | "decouverte" | "mono_cours" | "multi_cours";
