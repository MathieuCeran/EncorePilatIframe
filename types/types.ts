// Types

// CourseType
export interface CourseType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  is_active: boolean;
  benefits: string[];
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  course_type_id: string;
  instructor_id?: string;
  intensity: 1 | 2 | 3; // 1: Tous niveaux, 2: Intermédiaire, 3: Intense
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  waitlist_count: number;
  status: "active" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CalendarCourse {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor_name?: string;
  intensity: 1 | 2 | 3; // 1: Tous niveaux, 2: Intermédiaire, 3: Intense
  max_capacity: number;
  current_bookings: number;
  waitlist_count: number;
  status: "active" | "cancelled" | "completed";
  course_type: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    duration_minutes?: number;
  };
  availability: {
    available_spots: number;
    is_full: boolean;
    can_book: boolean;
    can_join_waitlist: boolean;
  };
  user_status?: {
    is_booked: boolean;
    is_on_waitlist: boolean;
    waitlist_position?: number;
    booking_id?: string;
    waitlist_id?: string;
  };
}

export interface CalendarFilters {
  course_type_ids?: string[];
  instructor_ids?: string[];
  intensity_levels?: number[];
  availability_only?: boolean;
  my_bookings_only?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface CalendarResponse {
  courses: CalendarCourse[];
  total: number;
}

export interface FormattedCourse {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
  date: string;
  instructor: string;
  instructorId: string;
  intensity: number;
  current_capacity: number;
  current_bookings: number;
  max_capacity: number;
  isFull: boolean;
  isUserBooked: boolean;
  courseType: string;
  courseTypeId: string;
  status: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

// Nouvelles interfaces pour le système de packs
export interface PackLimitations {
  id: string;
  pack_id: string;
  course_type_id: string;
  max_utilisations: number | null; // null = illimité
  created_at: string;
}

export interface UserPackPurchase {
  id: string;
  user_id: string;
  pack_id: string;
  date_achat: string;
  date_expiration: string | null;
  cours_restants: number;
  statut: "active" | "expired" | "consumed" | "pending" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface UserPackUsage {
  id: string;
  user_pack_purchase_id: string;
  course_type_id: string;
  utilisations_consommees: number;
  created_at: string;
  updated_at: string;
}

export interface PackCourseType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_utilisations?: number; // Depuis pack_limitations
}

// Packs
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

export interface CreatePackRequest {
  nom: string;
  description?: string;
  prix: number;
  type_pack: "decouverte" | "mono_cours" | "multi_cours";
  duree_validite_jours?: number | null;
  nombre_cours_total?: number | null;
  is_active?: boolean;
  limitations?: Array<{
    course_type_id: string;
    max_utilisations: number | null;
  }>;
}

export interface UpdatePackRequest extends Partial<CreatePackRequest> {
  id: string;
}

// Commandes
export interface Commande {
  id: string;
  user_id: string;
  pack_id?: string; // NULL pour paiement unitaire cash
  montant_total: number;
  type_paiement: "cash" | "cmi_online";
  statut: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  date_commande: string;
  date_paiement?: string; // Quand le paiement est effectif
  notes?: string; // Pour commentaires admin (ex: "paiement cash reçu")
  created_at: string;
  updated_at: string;
}

export interface CreateCommandeRequest {
  user_id: string;
  pack_id?: string;
  montant_total: number;
  type_paiement: "cash" | "cmi_online";
  notes?: string;
}

export interface UpdateCommandeRequest {
  id: string;
  statut?: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  date_paiement?: string;
  notes?: string;
}

// Réservations
export interface Reservation {
  id: string;
  user_id: string;
  course_id: string;
  commande_id?: string | null; // Maintenant référence user_pack_purchases.id
  user_pack_purchase_id?: string | null; // Référence directe vers user_pack_purchases.id
  statut: string;
  presente?: boolean | null;
  date_presence?: string | null;
  date_annulation?: string | null;
  raison_annulation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDetailsResponse {
  success: boolean;
  data: {
    profile: UserProfile;
    role?: string | null;
    roleData?: {
      roles?: { name: string } | { name: string }[];
    };
  };
}

export interface UserPackDetails {
  purchase: UserPackPurchase;
  usage: UserPackUsage[];
  limitations: PackLimitations[];
}

// Types for my-bookings API
export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ReservationWithCourse {
  id: string;
  user_id: string;
  course_id: string;
  commande_id?: string | null;
  user_pack_purchase_id?: string | null;
  statut: string;
  presente?: boolean | null;
  date_presence?: string | null;
  date_annulation?: string | null;
  raison_annulation?: string | null;
  created_at: string;
  updated_at: string;
  courses: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    current_bookings: number;
    course_types: CourseType;
    instructors: Instructor;
  };
}

export interface FormattedReservation {
  id: string;
  course: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    current_bookings: number;
    course_type: CourseType;
    instructor: Instructor;
  };
  status: string;
  presente?: boolean | null;
  date_presence?: string | null;
  date_annulation?: string | null;
  raison_annulation?: string | null;
  created_at: string;
  pack_info: null;
}

// Types pour les APIs de pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PackWithDetails extends UserPackPurchase {
  packs?: {
    id: string;
    nom: string;
    description?: string;
    prix: number;
    type_pack: string;
  };
  usage?: Array<{
    id: string;
    course_type_id: string;
    utilisations_consommees: number;
    course_types?: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

export interface BookingWithDetails extends Reservation {
  courses?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    course_types?: {
      id: string;
      name: string;
    };
  };
}

export interface PacksResponse {
  success: boolean;
  data: {
    packs: PackWithDetails[];
    pagination: PaginationInfo;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: CommandeWithPack[];
    pagination: PaginationInfo;
  };
}

export interface BookingsResponse {
  success: boolean;
  data: {
    bookings: BookingWithDetails[];
    pagination: PaginationInfo;
  };
}

export interface CommandeWithPack extends Commande {
  packs?: {
    id: string;
    nom: string;
    description?: string;
    prix: number;
    type_pack: string;
    nombre_cours_total?: number;
  };
}
