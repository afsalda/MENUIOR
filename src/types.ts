import type { Settings } from "./config/restaurant.config";
export type Language = "en" | "ml" | "hi" | "ar";
export type Diet = "veg" | "nonveg" | "egg" | "vegan" | "jain";
export interface Option {
  name: string;
  price: number;
}
export interface MenuItem {
  id: string;
  category: string;
  name_en: string;
  name_ml: string;
  name_hi: string;
  name_ar: string;
  desc_en: string;
  desc_ml: string;
  desc_hi: string;
  desc_ar: string;
  price: number;
  half_price?: number;
  variants: Option[];
  addons: Option[];
  image: string;
  veg_type: Diet;
  spice: number;
  tags: string[];
  allergens: string[];
  calories?: number;
  available: boolean;
  sold_out: boolean;
  available_from: string;
  available_to: string;
  recommended_with: string[];
  serves: string;
}
export interface MenuData {
  items: MenuItem[];
  settings: Settings;
  updatedAt: number;
}
export interface OrderLine {
  key: string;
  itemId: string;
  name: string;
  variant: string;
  addons: string[];
  price: number;
  qty: number;
}
