export type AdvertisementStatus = "Active" | "Pending approval" | "Completed";

export interface Advertisement {
  id: string;
  name: string;
  brand: string;
  initials: string;
  area: string;
  submitted: string;
  dates: string;
  status: AdvertisementStatus;
  plays: number;
  target: number;
  elapsedDays: number;
  totalDays: number;
  cabs: number;
  fleet: string;
  note: string;
  ownerEmail?: string;
}

export interface AdvertiserProfile {
  accountName: string;
  businessName: string;
  email: string;
  phone: string;
  area: string;
  advertiserType: string;
}

export interface CreativePreset {
  id: string;
  name: string;
  brand: string;
  color: string;
  headline: string;
  subtext: string;
  aspect: string;
}

export interface PlanTier {
  id: string;
  title: string;
  plays: number;
  days: number;
  cabs: number;
  price: number;
  badge: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  plays: string;
  status: "PAID" | "PENDING";
}
