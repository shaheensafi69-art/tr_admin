export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled' | 'cancellation_requested';
export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded';
export type BookingType = 'daily' | 'hourly';
export type RoomType = 'single' | 'double' | 'twin' | 'triple' | 'suite';
export type NationalityType = 'iranian' | 'foreigner';

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  stars: number;
  rating: number;
  review_count: number;
  short_description: string;
  description: string;
  address: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  google_maps_url?: string;
  cover_image: string;
  images: string[];
  check_in_time: string;
  check_out_time: string;
  hourly_start_time?: string;
  hourly_end_time?: string;
  min_hourly_duration?: number;
  max_hourly_duration?: number;
  rules: string[];
  faq: { question: string; answer: string }[];
  is_published: boolean;
  is_featured: boolean;
  province_id?: string;
  city_id?: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  name: string;
  room_number: string;
  room_type: RoomType;
  bed_type: string;
  standard_capacity: number;
  max_capacity: number;
  size_sqm: number;
  cover_image: string;
  images: string[];
  description: string;
  status: 'available' | 'maintenance' | 'occupied';
  breakfast_type: 'included' | 'optional' | 'none';
  breakfast_price: number;
  is_hourly_available: boolean;
  is_published: boolean;
  display_order: number;
  check_in_time?: string;
  check_out_time?: string;
  pricing?: RoomPricing;
}

export interface RoomPricing {
  id: string;
  room_id: string;
  currency: string;
  daily_price: number;
  hourly_price: number;
  special_price?: number;
  discount_percentage?: number;
  breakfast_price?: number;
  hourly_min_hours?: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  nationality_type?: NationalityType;
  nationality_country?: string;
  country_code: string;
  notes?: string;
  is_repeat_customer?: boolean;
  total_bookings?: number;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  hotel_id: string;
  room_id: string;
  customer_id: string;
  booking_type: BookingType;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  duration_hours?: number;
  adults_count: number;
  children_count: number;
  total_amount?: number;
  total_amount_toman: number;
  total_amount_currency?: number;
  commission_rate?: number;
  commission_amount?: number;
  hotel_net_amount?: number;
  breakfast_included?: boolean;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  receipt_url?: string;
  bank_tracking_number?: string;
  payments?: any[];
  special_requests?: string;
  nationality_type?: NationalityType;
  nationality_country?: string;
  national_id?: string;
  refund_amount?: number;
  refund_card_number?: string;
  refund_account_holder?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  hotel?: Hotel;
  room?: Room;
  customer?: Customer;
}

export interface Province {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  province?: Province;
  hotels_count?: number;
  villas_count?: number;
}
