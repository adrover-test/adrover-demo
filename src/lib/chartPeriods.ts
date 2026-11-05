export const chartRanges = [
  { value: "yearly", label: "Yearly", count: 10, description: "Last 10 years" },
  {
    value: "monthly",
    label: "Monthly",
    count: 12,
    description: "Last 12 months",
  },
  {
    value: "weekly",
    label: "Weekly",
    count: 4,
    description: "Last 4 weeks · Monday start",
  },
  { value: "daily", label: "Daily", count: 30, description: "Last 30 days" },
] as const;

export type ChartRange = (typeof chartRanges)[number]["value"];

/** Calendar buckets in UTC, including the current partial period. */
export function aggregateChartRecords(
  records: readonly { date: string; value: number }[],
  range: ChartRange,
  asOf = new Date(),
) {
  const { count } = chartRanges.find((entry) => entry.value === range)!;
  const year = asOf.getUTCFullYear();
  const month = asOf.getUTCMonth();
  const day = asOf.getUTCDate();
  const cutoff = asOf.toISOString().slice(0, 10);
  const format = new Intl.DateTimeFormat("en-IN", {
    ...(range === "monthly"
      ? { month: "short", year: "2-digit" }
      : { day: "numeric", month: "short" }),
    timeZone: "UTC",
  });
  return Array.from({ length: count }, (_, index) => {
    const offset = index - count + 1;
    const start =
      range === "yearly"
        ? new Date(Date.UTC(year + offset, 0, 1))
        : range === "monthly"
          ? new Date(Date.UTC(year, month + offset, 1))
          : new Date(
              Date.UTC(
                year,
                month,
                day +
                  (range === "weekly"
                    ? -((asOf.getUTCDay() + 6) % 7) + offset * 7
                    : offset),
              ),
            );
    const end = new Date(start);
    if (range === "yearly") end.setUTCFullYear(end.getUTCFullYear() + 1);
    else if (range === "monthly") end.setUTCMonth(end.getUTCMonth() + 1);
    else end.setUTCDate(end.getUTCDate() + (range === "weekly" ? 7 : 1));
    const key = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);
    const lastDay = new Date(end);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
    const label =
      range === "yearly"
        ? String(start.getUTCFullYear())
        : range === "weekly"
          ? `${format.format(start)} – ${format.format(lastDay)}`
          : format.format(start);
    return {
      key,
      label,
      value: records.reduce(
        (total, record) =>
          record.date >= key && record.date < endKey && record.date <= cutoff
            ? total + record.value
            : total,
        0,
      ),
    };
  });
}
