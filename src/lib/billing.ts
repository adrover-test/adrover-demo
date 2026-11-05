import { aggregateChartRecords, type ChartRange } from "./chartPeriods";

export const transactions = [
  {
    id: "DEMO-TXN-10431",
    ad: "Apollo Super Speciality Checkup",
    reference: "Sample ref: APL-125-01",
    date: "2026-10-12",
    amount: 125000,
    method: "Corporate net banking",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "DEMO-TXN-10429",
    ad: "Summer Monsoon Mega Offer",
    reference: "Sample ref: SUM-095-02",
    date: "2026-10-01",
    amount: 95000,
    method: "UPI · Sample payment",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "DEMO-TXN-10422",
    ad: "HITEC Tech Fest 2026",
    reference: "Sample ref: HTC-075-03",
    date: "2026-09-18",
    amount: 75000,
    method: "Business credit card",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "DEMO-TXN-10419",
    ad: "Adrover wallet top-up",
    reference: "Sample ref: WAL-050-04",
    date: "2026-09-04",
    amount: 50000,
    method: "UPI · Sample payment",
    status: "Successful",
    kind: "wallet",
  },
  {
    id: "DEMO-TXN-10414",
    ad: "Weekend Dining Special",
    reference: "Sample ref: DIN-020-05",
    date: "2026-08-29",
    amount: 20000,
    method: "Invoice · Awaiting payment",
    status: "Pending",
    kind: "campaign",
  },
  {
    id: "DEMO-TXN-10402",
    ad: "Sample campaign credit adjustment",
    reference: "Sample ref: CR-012-06",
    date: "2026-08-14",
    amount: 12500,
    method: "Credit note",
    status: "Refunded",
    kind: "campaign",
  },
] as const;

/** Net campaign collections, excluding wallet deposits and pending payments. */
export function getCampaignRevenueByPeriod(
  range: ChartRange,
  asOf = new Date(),
) {
  return aggregateChartRecords(
    transactions
      .filter(
        (record) => record.kind === "campaign" && record.status !== "Pending",
      )
      .map((record) => ({
        date: record.date,
        value: record.status === "Refunded" ? -record.amount : record.amount,
      })),
    range,
    asOf,
  );
}

export function getCollectedCampaignRevenue(asOf = new Date()) {
  const cutoff = asOf.toISOString().slice(0, 10);
  return transactions.reduce((total, transaction) => {
    if (transaction.kind !== "campaign" || transaction.date > cutoff)
      return total;
    if (transaction.status === "Successful") return total + transaction.amount;
    if (transaction.status === "Refunded") return total - transaction.amount;
    return total;
  }, 0);
}

export function getMonthlyCampaignRevenue(asOf = new Date()) {
  const cutoff = asOf.toISOString().slice(0, 10);
  const format = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 5 + index, 1),
    );
    const key = date.toISOString().slice(0, 7);
    const amount = transactions.reduce((total, transaction) => {
      if (
        transaction.kind !== "campaign" ||
        transaction.date > cutoff ||
        !transaction.date.startsWith(key)
      )
        return total;
      return transaction.status === "Successful"
        ? total + transaction.amount
        : transaction.status === "Refunded"
          ? total - transaction.amount
          : total;
    }, 0);
    return { key, label: format.format(date), amount };
  });
}
