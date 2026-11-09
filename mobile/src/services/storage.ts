import { Advertisement, AdvertiserProfile, CreativePreset, PlanTier, Invoice } from "../types";

export const HYDERABAD_CORRIDORS = [
  "Hitec City & Madhapur",
  "Jubilee Hills & Banjara Hills",
  "Gachibowli & Financial District",
  "Secunderabad & Begumpet",
  "Charminar & Old City",
  "Kukatpally & Miyapur",
  "Greater Hyderabad (All Corridors)",
];

export const CREATIVE_PRESETS: CreativePreset[] = [
  {
    id: "biryani",
    name: "Paradise Biryani Fest",
    brand: "Paradise Food Court",
    color: "#ff8c00",
    headline: "Hyderabad's Royal Biryani Festival",
    subtext: "Flat 25% Off Across All 18 Dine-In Outlets!",
    aspect: "16:9 Digital LED",
  },
  {
    id: "tech",
    name: "HITEC Global AI Summit",
    brand: "Cyberabad Tech Council",
    color: "#0284c7",
    headline: "Asia's Premier AI Conference 2026",
    subtext: "Nov 20-22 at HICC Novotel. Register Today!",
    aspect: "16:9 Digital LED",
  },
  {
    id: "health",
    name: "Apollo Preventive Checkup",
    brand: "Apollo Healthcare",
    color: "#087a45",
    headline: "Comprehensive Health Checkups",
    subtext: "Complete body screening at ₹999 across Hyderabad.",
    aspect: "16:9 Digital LED",
  },
  {
    id: "retail",
    name: "Deccan Gold & Silk Mega Sale",
    brand: "Deccan Heritage Retail",
    color: "#7c3aed",
    headline: "Festive Silk & Jewellery Carnival",
    subtext: "Jubilee Hills Rd 36 Flagship Store Opening.",
    aspect: "16:9 Digital LED",
  },
];

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "starter",
    title: "Starter Corridor",
    plays: 10000,
    days: 7,
    cabs: 15,
    price: 1000,
    badge: "Trial",
  },
  {
    id: "growth",
    title: "City Growth Pack",
    plays: 25000,
    days: 14,
    cabs: 35,
    price: 2500,
    badge: "Popular",
  },
  {
    id: "metro",
    title: "Metro Dominance",
    plays: 60000,
    days: 30,
    cabs: 80,
    price: 6000,
    badge: "Best Value",
  },
];

export const SAMPLE_ADS: Advertisement[] = [
  {
    id: "apollo-checkup",
    name: "Apollo Super Speciality Checkup",
    brand: "Apollo Diagnostics",
    initials: "AP",
    area: "Hitec City & Gachibowli",
    submitted: "2026-10-15",
    dates: "15 Oct – 10 Nov 2026",
    status: "Active",
    plays: 68400,
    target: 100000,
    elapsedDays: 15,
    totalDays: 30,
    cabs: 100,
    fleet: "Live on assigned routes",
    note: "Healthcare awareness campaign. Real-time GPS telemetry.",
  },
  {
    id: "monsoon-offer",
    name: "Summer Monsoon Mega Offer",
    brand: "Deccan Retail",
    initials: "SM",
    area: "Jubilee Hills & Banjara Hills",
    submitted: "2026-10-20",
    dates: "20 Oct – 14 Nov 2026",
    status: "Active",
    plays: 31250,
    target: 50000,
    elapsedDays: 12,
    totalDays: 25,
    cabs: 80,
    fleet: "Live on assigned routes",
    note: "Seasonal offer campaign across premium corridors.",
  },
  {
    id: "hitec-techfest",
    name: "HITEC Tech Fest 2026",
    brand: "Hyderabad Tech Week",
    initials: "HT",
    area: "Madhapur & Financial District",
    submitted: "2026-10-26",
    dates: "Starts next Monday (14 days)",
    status: "Pending approval",
    plays: 0,
    target: 40000,
    elapsedDays: 0,
    totalDays: 14,
    cabs: 60,
    fleet: "Pending fleet allocation",
    note: "Tech fest launch campaign pending queue review.",
  },
];

let inMemoryAds: Advertisement[] = [...SAMPLE_ADS];
let inMemoryProfile: AdvertiserProfile = {
  accountName: "Aditya Rao",
  businessName: "Paradise Food Court",
  email: "advertiser@example.com",
  phone: "+91 98490 12345",
  area: "Hitec City & Madhapur",
  advertiserType: "Direct Business",
};
let inMemoryLoggedIn = false;

export const storageService = {
  getAdvertisements: (): Advertisement[] => {
    return inMemoryAds;
  },
  addAdvertisement: (ad: Advertisement): void => {
    inMemoryAds = [ad, ...inMemoryAds];
  },
  getProfile: (): AdvertiserProfile => {
    return inMemoryProfile;
  },
  saveProfile: (profile: Partial<AdvertiserProfile>): void => {
    inMemoryProfile = { ...inMemoryProfile, ...profile };
  },
  isLoggedIn: (): boolean => inMemoryLoggedIn,
  setLoggedIn: (val: boolean): void => {
    inMemoryLoggedIn = val;
  },
};
