import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

type TransactionFilter = "All" | "Successful" | "Pending" | "Refunded";

interface Transaction {
  id: string;
  ad: string;
  reference: string;
  date: string;
  amount: number;
  method: string;
  status: "Successful" | "Pending" | "Refunded";
  kind: "campaign" | "wallet";
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-10431",
    ad: "Apollo Super Speciality Checkup",
    reference: "APL-125-01",
    date: "12 Oct 2026",
    amount: 125000,
    method: "Corporate net banking",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "TXN-10429",
    ad: "Summer Monsoon Mega Offer",
    reference: "SUM-095-02",
    date: "01 Oct 2026",
    amount: 95000,
    method: "UPI",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "TXN-10422",
    ad: "HITEC Tech Fest 2026",
    reference: "HTC-075-03",
    date: "18 Sep 2026",
    amount: 75000,
    method: "Business credit card",
    status: "Successful",
    kind: "campaign",
  },
  {
    id: "TXN-10419",
    ad: "Adrover wallet top-up",
    reference: "WAL-050-04",
    date: "04 Sep 2026",
    amount: 50000,
    method: "UPI",
    status: "Successful",
    kind: "wallet",
  },
  {
    id: "TXN-10414",
    ad: "Weekend Dining Special",
    reference: "DIN-020-05",
    date: "29 Aug 2026",
    amount: 20000,
    method: "Invoice · Awaiting payment",
    status: "Pending",
    kind: "campaign",
  },
  {
    id: "TXN-10402",
    ad: "Campaign credit adjustment",
    reference: "CR-012-06",
    date: "14 Aug 2026",
    amount: 12500,
    method: "Credit note",
    status: "Refunded",
    kind: "campaign",
  },
];

export const BillingScreen: React.FC = () => {
  const [filter, setFilter] = useState<TransactionFilter>("All");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TRANSACTIONS.filter((t) => {
      const matchFilter = filter === "All" || t.status === filter;
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.ad.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [filter, search]);

  const counts = {
    All: TRANSACTIONS.length,
    Successful: TRANSACTIONS.filter((t) => t.status === "Successful").length,
    Pending: TRANSACTIONS.filter((t) => t.status === "Pending").length,
    Refunded: TRANSACTIONS.filter((t) => t.status === "Refunded").length,
  };

  const handleDownloadStatement = () => {
    const statement = [
      "ADROVER / BILLING STATEMENT",
      "",
      "Amount paid: INR 3,45,000",
      "Campaign spending: INR 2,82,500",
      "Available balance: INR 62,500",
      "",
      ...TRANSACTIONS.map(
        (t) => `${t.id},${t.date},${t.ad},${t.status},INR ${t.amount},${t.method}`
      ),
      "",
      "GSTIN: 36AABCA9123F1Z2 (Telangana, State Code 36)",
      "Adrover Transit Media Private Limited, Jubilee Hills Rd 36, Hyderabad.",
    ].join("\n");

    Alert.alert(
      "Statement Exported",
      `Saved: Adrover-billing-statement.txt\n\n${statement.slice(0, 230)}...`,
      [{ text: "OK" }]
    );
  };

  const showReceipt = (t: Transaction) => {
    Alert.alert(
      `Tax Receipt · ${t.id}`,
      `Campaign: ${t.ad}\nDate: ${t.date}\nMethod: ${t.method}\nAmount: ₹${t.amount.toLocaleString("en-IN")}\nStatus: ${t.status}\n\nGSTIN: 36AABCA9123F1Z2\nPlace of Supply: Telangana (36)\nRegistered Office: Road No. 36, Jubilee Hills, Hyderabad 500033.`,
      [{ text: "Close" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Heading */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.eyebrow}>ADVERTISER PORTAL</Text>
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadStatement}>
              <Text style={styles.downloadBtnText}>Download statement</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>Payments &amp; billing</Text>
          <Text style={styles.sub}>
            Review your account totals and transaction history.
          </Text>
        </View>

        {/* Sample Note */}
        <View style={styles.sampleNote}>
          <Text style={styles.noteTitle}>Billing information</Text>
          <Text style={styles.noteText}>
            Review payments, campaign spending and available account balance.
          </Text>
        </View>

        {/* 3 Metric Cards matching Payments.tsx */}
        <View style={styles.statsCol}>
          {/* Total Paid */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.greenLight }]}>
                <Text style={[styles.statIconText, { color: colors.greenDark }]}>₹</Text>
              </View>
              <Text style={styles.statLabel}>Total amount paid</Text>
            </View>
            <Text style={styles.statAmount}>₹3,45,000</Text>
            <Text style={styles.statFoot}>All-time payments</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: "100%", backgroundColor: colors.green }]} />
            </View>
          </View>

          {/* Campaign Spending */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.yellowLight }]}>
                <Text style={[styles.statIconText, { color: colors.yellowDark }]}>◷</Text>
              </View>
              <Text style={styles.statLabel}>Total campaign spending</Text>
            </View>
            <Text style={styles.statAmount}>₹2,82,500</Text>
            <Text style={styles.statFoot}>Campaign allocation</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: "82%", backgroundColor: colors.yellowDark }]} />
            </View>
          </View>

          {/* Available Balance */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.sage }]}>
                <Text style={[styles.statIconText, { color: colors.ink }]}>₹</Text>
              </View>
              <Text style={styles.statLabel}>Available balance</Text>
            </View>
            <Text style={styles.statAmount}>₹62,500</Text>
            <Text style={styles.statFoot}>Example unallocated amount</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Adrover Billing Desk", "Contact Jubilee Hills desk at billing@adrover.in or +91 40 4821 7700.")}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.askBillingLink}>Ask about billing →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Billing transactions</Text>
            <Text style={styles.panelSub}>All records for this account</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, campaign or method..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(["All", "Successful", "Pending", "Refunded"] as TransactionFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, filter === f && styles.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                  {f === "All" ? "All transactions" : f} ({counts[f]})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Transaction items */}
          <View style={styles.txnList}>
            {filteredTransactions.map((t) => {
              const isSuccess = t.status === "Successful";
              const isPending = t.status === "Pending";
              const isRefunded = t.status === "Refunded";

              const badgeBg = isSuccess
                ? colors.greenLight
                : isPending
                ? colors.yellowLight
                : "#f1f3f5";
              const badgeColor = isSuccess
                ? colors.greenDark
                : isPending
                ? colors.yellowDark
                : colors.muted;

              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.txnItem}
                  onPress={() => showReceipt(t)}
                  activeOpacity={0.7}
                >
                  <View style={styles.txnLeft}>
                    <View style={styles.txnMetaRow}>
                      <Text style={styles.txnId}>{t.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusText, { color: badgeColor }]}>
                          {t.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.txnAd}>{t.ad}</Text>
                    <Text style={styles.txnMethod}>
                      {t.date} · {t.method}
                    </Text>
                  </View>

                  <View style={styles.txnRight}>
                    <Text
                      style={[
                        styles.txnAmount,
                        isRefunded && { color: colors.danger },
                      ]}
                    >
                      {isRefunded ? "-" : ""}₹{t.amount.toLocaleString("en-IN")}
                    </Text>
                    <Text style={styles.receiptHint}>Receipt →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredTransactions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions matching "{search}"</Text>
              </View>
            )}
          </View>
        </View>

        {/* GST Entity Note */}
        <View style={styles.gstBox}>
          <Text style={styles.gstTitle}>Registered GST Entity</Text>
          <Text style={styles.gstText}>
            Adrover Smart Transit Media Pvt Ltd • GSTIN: 36AABCA9123F1Z2 • State: Telangana (36) • Jubilee Hills Rd 36, Hyderabad 500033
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    padding: 16,
    paddingBottom: 70,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
  },
  downloadBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },
  heading: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  sampleNote: {
    backgroundColor: colors.sage,
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },
  statsCol: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconText: {
    fontSize: 13,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  statFoot: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  barContainer: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  askBillingLink: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  panelHeader: {
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  panelSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  searchRow: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.ink,
  },
  filterScroll: {
    marginHorizontal: -4,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  filterPillTextActive: {
    color: colors.surface,
    fontWeight: "800",
  },
  txnList: {
    gap: 10,
  },
  txnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
  },
  txnLeft: {
    flex: 1,
    marginRight: 10,
  },
  txnMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  txnId: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  txnAd: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 2,
  },
  txnMethod: {
    fontSize: 11,
    color: colors.muted,
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
  },
  receiptHint: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.green,
    marginTop: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.muted,
  },
  gstBox: {
    backgroundColor: colors.sage,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  gstTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 2,
  },
  gstText: {
    fontSize: 10,
    color: colors.ink,
    lineHeight: 15,
  },
});
