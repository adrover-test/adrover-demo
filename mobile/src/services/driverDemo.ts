export const DEMO_OTP = "123456";

export type DriverLang = "en" | "te" | "hi";

export const LANGUAGES: { code: DriverLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिन्दी" },
];

export const driverText: Record<DriverLang, Record<string, string>> = {
  en: {
    home: "Home",
    ads: "Today's ads",
    earnings: "Earnings",
    profile: "Profile",
    support: "Help",
    hello: "Hello",
    adsToday: "Ads today",
    played: "Played",
    thisMonth: "This month",
    pending: "Pending",
    chart: "Plays, last 14 days",
    adCol: "Ad",
    timeCol: "Time",
    payments: "Payments",
    vehicle: "Vehicle",
    phone: "Phone",
    language: "Language",
    helpText: "Need help? Call 040 4859 2100 or write to support@adrover.in",
    signOut: "Sign out",
    today: "Today",
  },
  te: {
    home: "హోమ్",
    ads: "నేటి ప్రకటనలు",
    earnings: "సంపాదన",
    profile: "ప్రొఫైల్",
    support: "సహాయం",
    hello: "నమస్కారం",
    adsToday: "నేటి ప్రకటనలు",
    played: "ప్లే అయినవి",
    thisMonth: "ఈ నెల",
    pending: "పెండింగ్",
    chart: "ప్లేలు, గత 14 రోజులు",
    adCol: "ప్రకటన",
    timeCol: "సమయం",
    payments: "చెల్లింపులు",
    vehicle: "వాహనం",
    phone: "ఫోన్",
    language: "భాష",
    helpText: "సహాయం కావాలా? 040 4859 2100 కి కాల్ చేయండి",
    signOut: "సైన్ అవుట్",
    today: "నేడు",
  },
  hi: {
    home: "होम",
    ads: "आज के विज्ञापन",
    earnings: "कमाई",
    profile: "प्रोफ़ाइल",
    support: "मदद",
    hello: "नमस्ते",
    adsToday: "आज के विज्ञापन",
    played: "चले",
    thisMonth: "इस महीने",
    pending: "बाकी",
    chart: "प्ले, पिछले 14 दिन",
    adCol: "विज्ञापन",
    timeCol: "समय",
    payments: "भुगतान",
    vehicle: "वाहन",
    phone: "फ़ोन",
    language: "भाषा",
    helpText: "मदद चाहिए? 040 4859 2100 पर कॉल करें",
    signOut: "साइन आउट",
    today: "आज",
  },
};

export const demoDriver = {
  name: "Ravi Kumar",
  vehicle: "TS 09 UB 4821",
  city: "Hyderabad",
};

export const demoAds = [
  { id: "a1", name: "Paradise Biryani Fest", time: "09:00", status: "Played", plays: 12 },
  { id: "a2", name: "HITEC Global AI Summit", time: "11:30", status: "Played", plays: 9 },
  { id: "a3", name: "Apollo Preventive Checkup", time: "14:00", status: "Playing", plays: 4 },
  { id: "a4", name: "Metro Gold Jewellers", time: "16:30", status: "Scheduled", plays: 0 },
  { id: "a5", name: "Charminar Pearls", time: "18:00", status: "Scheduled", plays: 0 },
];

export const demoHistory = [38, 42, 35, 47, 51, 44, 40, 49, 53, 46, 41, 55, 50, 25];

export const demoPayments = [
  { id: "p1", month: "Mar 2026", amount: 18400, status: "Paid" },
  { id: "p2", month: "Apr 2026", amount: 19250, status: "Paid" },
  { id: "p3", month: "May 2026", amount: 17900, status: "Pending" },
];

export const demoEarnings = { month: 17900, pending: 17900, workingDays: 21 };
