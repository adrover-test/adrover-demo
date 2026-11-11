export type AdvertisementStatus =
  "Active" | "Pending approval" | "Approved" | "Completed";

export type Advertisement = {
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
  payment?: {
    id: string;
    amount: number;
    paidAt: string;
  };
  approval?: {
    amount: number;
    plays: number;
    approvedAt: string;
    approvedBy: string;
  };
};

export const advertisementSamples: Advertisement[] = [
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
    note: "Healthcare awareness campaign. Sample delivery figures.",
  },
  {
    id: "monsoon-offer",
    name: "Summer Monsoon Mega Offer",
    brand: "Sample Retail Group",
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
    note: "Seasonal offer campaign. Sample delivery figures.",
  },
  {
    id: "hitec-techfest",
    name: "HITEC Tech Fest 2026",
    brand: "Hyderabad Tech Week",
    initials: "HT",
    area: "Madhapur & Financial District",
    submitted: "2026-10-26",
    dates: "26 Oct – 10 Nov 2026",
    status: "Active",
    plays: 21000,
    target: 25000,
    elapsedDays: 10,
    totalDays: 15,
    cabs: 100,
    fleet: "Live on assigned routes",
    note: "Event awareness campaign. Sample delivery figures.",
  },
  {
    id: "weekend-dining",
    name: "Weekend Dining Special",
    brand: "Sample Dining Collective",
    initials: "WD",
    area: "Secunderabad & Banjara Hills",
    submitted: "2026-10-25",
    dates: "25 Oct – 09 Nov 2026",
    status: "Active",
    plays: 16600,
    target: 28000,
    elapsedDays: 11,
    totalDays: 16,
    cabs: 62,
    fleet: "Live on assigned routes",
    note: "Restaurant discovery campaign. Sample delivery figures.",
  },
  {
    id: "cyberfintech-launch",
    name: "CyberFintech App Launch",
    brand: "Sample Fintech",
    initials: "CF",
    area: "Airport Express Corridor",
    submitted: "2026-11-02",
    dates: "Start date pending approval",
    status: "Pending approval",
    plays: 0,
    target: 50000,
    elapsedDays: 0,
    totalDays: 30,
    cabs: 50,
    fleet: "Fleet reservation is not confirmed",
    note: "Creative and campaign details awaiting review.",
  },
  {
    id: "deccan-living-expo",
    name: "Deccan Living Home Expo",
    brand: "Deccan Living",
    initials: "DL",
    area: "Kukatpally & Miyapur",
    submitted: "2026-08-20",
    dates: "20 Aug – 05 Sep 2026",
    status: "Completed",
    plays: 11000,
    target: 11000,
    elapsedDays: 17,
    totalDays: 17,
    cabs: 0,
    fleet: "Campaign ended",
    note: "Completed sample campaign. Final figures are illustrative.",
  },
];
