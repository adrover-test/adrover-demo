import type { Lang } from "./i18n";
import type {
  AppNotification,
  Dashboard,
  DriverProfile,
  Earnings,
  IssueDetail,
  IssueSummary,
  NewIssue,
  Payment,
  PlaybackEntry,
  TodayAd,
  Vehicle,
} from "./api";

// Demo mode is on whenever no backend URL is configured.
export const demoOtp = "123456";
const storeKey = "adrover-driver-demo";

const day = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const todayAt = (hour: number, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const dateOnly = (offsetDays: number) =>
  new Date(Date.now() - offsetDays * day).toISOString().slice(0, 10);

const vehicle: Vehicle = {
  id: "veh-1",
  registrationNumber: "TS 09 UB 4821",
  model: "Maruti Dzire",
  type: "Cab",
  tabletStatus: "online",
  approvalStatus: "approved",
  assignmentStatus: "assigned",
  lastSyncAt: ago(12 * 60_000),
};

type DemoState = {
  profile: DriverProfile;
  readIds: string[];
  issues: IssueDetail[];
};

function initialState(mobile = "9876543210"): DemoState {
  return {
    profile: {
      id: "drv-1001",
      name: "Ravi Kumar",
      mobile,
      email: "ravi.kumar@example.com",
      address: "Plot 42, Madhapur, Hyderabad 500081",
      photoUrl: null,
      licenceNumber: "TS0920190012345",
      licenceExpiry: "2030-06-30",
      accountStatus: "active",
      registeredAt: ago(120 * day),
      preferredLanguage: null,
      vehicle,
      documents: [
        { id: "doc-1", name: "Driving licence", status: "verified" },
        { id: "doc-2", name: "Vehicle registration (RC)", status: "verified" },
        { id: "doc-3", name: "Insurance", status: "pending" },
      ],
    },
    readIds: [],
    issues: [
      {
        id: "iss-1",
        ticketId: "DRV-2041",
        category: "tablet_not_working",
        description: "The tablet screen was blank this morning.",
        status: "resolved",
        createdAt: ago(6 * day),
        updatedAt: ago(5 * day),
        adminResponse: "The tablet was restarted remotely. It is working now.",
        language: "en",
        advertisementName: null,
        vehicleRegistration: vehicle.registrationNumber,
        attachmentUrl: null,
        canConfirm: true,
        canReopen: true,
        history: [
          { status: "submitted", note: null, by: "driver", at: ago(6 * day) },
          {
            status: "resolved",
            note: "The tablet was restarted remotely.",
            by: "admin",
            at: ago(5 * day),
          },
        ],
      },
    ],
  };
}

function load(): DemoState {
  try {
    const saved = localStorage.getItem(storeKey);
    if (saved) return JSON.parse(saved) as DemoState;
  } catch {
    // Fall through to a fresh demo state.
  }
  return initialState();
}

let state = load();
const save = () => localStorage.setItem(storeKey, JSON.stringify(state));
const wait = <T>(value: T) =>
  new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 250));

const todayAds: TodayAd[] = [
  {
    id: "ad-1",
    name: "Paradise Biryani – Festive Offer",
    advertiserName: "Paradise Food Court",
    thumbnailUrl: null,
    scheduledAt: todayAt(8),
    durationSeconds: 30,
    status: "completed",
    playsCompleted: 12,
    playsRemaining: 0,
  },
  {
    id: "ad-2",
    name: "Apollo Clinics – Free Health Check",
    advertiserName: "Apollo Clinics",
    thumbnailUrl: null,
    scheduledAt: todayAt(11),
    durationSeconds: 20,
    status: "completed",
    playsCompleted: 10,
    playsRemaining: 0,
  },
  {
    id: "ad-3",
    name: "Hyderabad Metro Smart Card",
    advertiserName: "Hyderabad Metro",
    thumbnailUrl: null,
    scheduledAt: todayAt(14),
    durationSeconds: 15,
    status: "playing",
    playsCompleted: 4,
    playsRemaining: 6,
  },
  {
    id: "ad-4",
    name: "Ratnadeep Super Market Sale",
    advertiserName: "Ratnadeep",
    thumbnailUrl: null,
    scheduledAt: todayAt(17),
    durationSeconds: 30,
    status: "upcoming",
    playsCompleted: 0,
    playsRemaining: 10,
  },
  {
    id: "ad-5",
    name: "Radio Mirchi 98.3",
    advertiserName: "Radio Mirchi",
    thumbnailUrl: null,
    scheduledAt: todayAt(20),
    durationSeconds: 20,
    status: "upcoming",
    playsCompleted: 0,
    playsRemaining: 8,
  },
];

const names = todayAds.map((ad) => [ad.name, ad.advertiserName] as const);
const history: PlaybackEntry[] = Array.from({ length: 21 }, (_, index) => {
  const [adName, advertiserName] = names[index % names.length];
  return {
    id: `play-${index}`,
    date: dateOnly(index + 1),
    adName,
    advertiserName,
    plays: 18 + ((index * 7) % 15),
    status: index === 4 ? "failed" : "completed",
  };
});

const payments: Payment[] = [
  ["released", 3, 4200],
  ["released", 10, 3850],
  ["released", 17, 4015],
  ["processing", 0, 3600],
  ["released", 24, 3920],
  ["released", 38, 4400],
].map(([status, offset, amount], index) => ({
  id: `pay-${index + 1}`,
  transactionId: `TXN${202600 + index * 37}`,
  paidAt: status === "released" ? ago(Number(offset) * day) : null,
  amount: Number(amount),
  status: status as Payment["status"],
  reference: status === "released" ? `UTR${4820000 + index * 911}` : null,
  periodStart: dateOnly(Number(offset) + 7),
  periodEnd: dateOnly(Number(offset)),
}));

const dashboard: Dashboard = {
  month: {
    adsPlayed: 486,
    amountEarned: 15870,
    pendingAmount: 3600,
    releasedAmount: 12270,
    workingDays: 19,
    activeCampaigns: 5,
  },
  today: {
    scheduled: 40,
    played: 26,
    remaining: 14,
    next: { name: todayAds[3].name, scheduledAt: todayAds[3].scheduledAt },
  },
  device: { status: "online", lastSyncAt: vehicle.lastSyncAt },
};

const earnings: Earnings = {
  total: 48250,
  thisMonth: 15870,
  pending: 3600,
  processing: 3600,
  released: 44650,
  nextPayout: { date: dateOnly(-3), amount: 3600 },
  perAd: [
    { adId: "ad-1", adName: todayAds[0].name, plays: 150, amount: 4500 },
    { adId: "ad-2", adName: todayAds[1].name, plays: 128, amount: 3840 },
    { adId: "ad-3", adName: todayAds[2].name, plays: 110, amount: 3300 },
    { adId: "ad-4", adName: todayAds[3].name, plays: 98, amount: 2940 },
    { adId: "ad-5", adName: todayAds[4].name, plays: 42, amount: 1290 },
  ],
};

const baseNotifications: AppNotification[] = [
  {
    id: "n-1",
    title: "Payment released",
    message: "₹3,920 has been sent to your bank account.",
    type: "payment",
    createdAt: ago(2 * 3_600_000),
    isRead: false,
  },
  {
    id: "n-2",
    title: "New ad scheduled",
    message: "Ratnadeep Super Market Sale will play from 5 PM today.",
    type: "advertisement",
    createdAt: ago(9 * 3_600_000),
    isRead: false,
  },
  {
    id: "n-3",
    title: "Issue resolved",
    message: "Your ticket DRV-2041 was marked as resolved.",
    type: "issue",
    createdAt: ago(5 * day),
    isRead: true,
  },
];

const ticket = () => `DRV-${2042 + state.issues.length}`;
const toSummary = ({
  id,
  ticketId,
  category,
  description,
  status,
  createdAt,
  updatedAt,
  adminResponse,
}: IssueDetail): IssueSummary => ({
  id,
  ticketId,
  category,
  description,
  status,
  createdAt,
  updatedAt,
  adminResponse,
});

export function demoSignIn(mobile: string) {
  state = initialState(mobile);
  save();
}

export const demoApi = {
  requestOtp: async (_mobile: string) => wait(undefined),
  verifyOtp: async (mobile: string, otp: string) => {
    await wait(undefined);
    if (otp !== demoOtp) throw new Error("Incorrect OTP");
    if (state.profile.mobile !== mobile) demoSignIn(mobile);
    return { accessToken: "demo-driver-token" };
  },
  getProfile: () => wait(structuredClone(state.profile)),
  updateProfile: async (update: {
    name: string;
    email: string | null;
    address: string | null;
  }) => {
    state.profile = { ...state.profile, ...update };
    save();
    return wait(structuredClone(state.profile));
  },
  uploadPhoto: async (file: File) => {
    const photoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    state.profile.photoUrl = photoUrl;
    try {
      save();
    } catch {
      // A large photo may not fit in storage; it stays for this session only.
    }
    return { photoUrl };
  },
  saveLanguage: async (preferredLanguage: Lang) => {
    state.profile.preferredLanguage = preferredLanguage;
    save();
    return wait(undefined);
  },
  getDashboard: () => wait(dashboard),
  getTodayAds: () => wait({ items: todayAds }),
  getPlaybackHistory: (from: string, to: string) =>
    wait({
      items: history.filter((entry) => entry.date >= from && entry.date <= to),
    }),
  getEarnings: (period: "weekly" | "monthly") =>
    wait(period === "weekly" ? { ...earnings, thisMonth: 4015 } : earnings),
  getPayments: (period: "weekly" | "monthly") =>
    wait({ items: period === "weekly" ? payments.slice(0, 3) : payments }),
  getPayment: async (id: string) => {
    const payment = payments.find((item) => item.id === id);
    if (!payment) throw new Error("Not found");
    return wait(payment);
  },
  getVehicle: () => wait(vehicle),
  getNotifications: () => {
    const items = baseNotifications.map((item) => ({
      ...item,
      isRead: item.isRead || state.readIds.includes(item.id),
    }));
    return wait({
      items,
      unreadCount: items.filter((item) => !item.isRead).length,
    });
  },
  markNotificationRead: async (id: string) => {
    state.readIds.push(id);
    save();
    return wait(undefined);
  },
  getIssues: () => wait({ items: state.issues.map(toSummary) }),
  getIssue: async (id: string) => {
    const issue = state.issues.find((item) => item.id === id);
    if (!issue) throw new Error("Not found");
    return wait(structuredClone(issue));
  },
  submitIssue: async (issue: NewIssue, _requestId: string) => {
    const now = new Date().toISOString();
    const created: IssueDetail = {
      id: `iss-${Date.now()}`,
      ticketId: ticket(),
      category: issue.category,
      description: issue.description,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      adminResponse: null,
      language: issue.language,
      advertisementName:
        todayAds.find((ad) => ad.id === issue.advertisementId)?.name ?? null,
      vehicleRegistration: vehicle.registrationNumber,
      attachmentUrl: null,
      canConfirm: false,
      canReopen: false,
      history: [{ status: "submitted", note: null, by: "driver", at: now }],
    };
    state.issues.unshift(created);
    save();
    return wait({ id: created.id, ticketId: created.ticketId });
  },
  confirmIssue: async (id: string) => {
    const issue = state.issues.find((item) => item.id === id);
    if (issue) {
      issue.canConfirm = false;
      issue.canReopen = false;
      save();
    }
    return wait(undefined);
  },
  reopenIssue: async (id: string, reason: string) => {
    const issue = state.issues.find((item) => item.id === id);
    if (issue) {
      const now = new Date().toISOString();
      issue.status = "under_review";
      issue.updatedAt = now;
      issue.canConfirm = false;
      issue.canReopen = false;
      issue.history.push({
        status: "under_review",
        note: reason,
        by: "driver",
        at: now,
      });
      save();
    }
    return wait(undefined);
  },
};
