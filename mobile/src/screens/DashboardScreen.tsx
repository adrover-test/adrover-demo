import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";
import { HeaderBar } from "../components/HeaderBar";
import { CabScreenPreview } from "../components/CabScreenPreview";
import { Advertisement } from "../types";

interface Props {
  navigation: any;
  showHeader?: boolean;
}

const dailyPlays = [
  { day: "23", plays: 7200 },
  { day: "24", plays: 8400 },
  { day: "25", plays: 9100 },
  { day: "26", plays: 10000 },
  { day: "27", plays: 9600 },
  { day: "28", plays: 11600 },
  { day: "29", plays: 12200 },
  { day: "30", plays: 10800 },
  { day: "31", plays: 13400 },
  { day: "01", plays: 14200 },
  { day: "02", plays: 13800 },
  { day: "03", plays: 15100 },
  { day: "04", plays: 16000 },
  { day: "Today", plays: 14800, today: true },
];

export const DashboardScreen: React.FC<Props> = ({ navigation, showHeader = false }) => {
  const [ads] = useState<Advertisement[]>(() => storageService.getAdvertisements());
  const profile = storageService.getProfile();

  const activeAds = ads.filter((a) => a.status === "Active");
  const pendingCount = ads.filter((a) => a.status === "Pending approval").length;
  const totalPlays = ads.reduce((sum, a) => sum + (a.plays || 0), 0);
  const totalCabs = activeAds.reduce((sum, a) => sum + a.cabs, 0) || 68;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      {showHeader && <HeaderBar businessName={profile.businessName} />}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Dashboard Header matching website Dashboard.tsx */}
        <View style={styles.headingBox}>
          <Text style={styles.eyebrow}>ADVERTISER DASHBOARD</Text>
          <Text style={styles.mainTitle}>Welcome back, Advertiser</Text>
          <Text style={styles.mainSub}>
            Here's a simple overview of how your campaigns could perform across Hyderabad.
          </Text>

          <TouchableOpacity
            style={styles.createBtnHeader}
            onPress={() => navigation.navigate("CreateAd")}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnHeaderText}>+ Create new ad</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sampleNote}>
          <Text style={styles.sampleNoteStrong}>Campaign overview</Text>
          <Text style={styles.sampleNoteText}>
            Review your campaigns, assigned cabs and delivery activity.
          </Text>
        </View>

        {/* 4 Stat Cards with Branded Pills (AD, CB, PL, PR) */}
        <View style={styles.statsGrid}>
          {/* Stat 1: Campaigns */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.sage }]}>
              <Text style={[styles.statIconBadgeText, { color: colors.green }]}>AD</Text>
            </View>
            <Text style={styles.statLabel}>CAMPAIGNS</Text>
            <Text style={styles.statVal}>{ads.length}</Text>
            <Text style={styles.statSub}>{activeAds.length} live • {pendingCount} pending</Text>
          </View>

          {/* Stat 2: Assigned Vehicles */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.yellowLight }]}>
              <Text style={[styles.statIconBadgeText, { color: colors.yellowDark }]}>CB</Text>
            </View>
            <Text style={styles.statLabel}>ASSIGNED CABS</Text>
            <Text style={styles.statVal}>{totalCabs}</Text>
            <Text style={styles.statSub}>10s rooftop slots</Text>
          </View>

          {/* Stat 3: Total Plays */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.sage }]}>
              <Text style={[styles.statIconBadgeText, { color: colors.green }]}>PL</Text>
            </View>
            <Text style={styles.statLabel}>PLAYS DELIVERED</Text>
            <Text style={styles.statVal}>{totalPlays.toLocaleString()}</Text>
            <Text style={[styles.statSub, { color: colors.green }]}>GPS verified</Text>
          </View>

          {/* Stat 4: Total Investment */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: colors.sage }]}>
              <Text style={[styles.statIconBadgeText, { color: colors.green }]}>₹</Text>
            </View>
            <Text style={styles.statLabel}>INVESTED (₹)</Text>
            <Text style={styles.statVal}>₹{(activeAds.length * 2500 || 8500).toLocaleString()}</Text>
            <Text style={styles.statSub}>Across Hyderabad</Text>
          </View>
        </View>

        {/* Daily ad plays matching website Dashboard.tsx */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Daily ad plays</Text>
              <Text style={styles.chartSub}>Campaign activity over the last 14 days</Text>
            </View>
            <View style={styles.chartPill}>
              <Text style={styles.chartPillText}>14-day trend</Text>
            </View>
          </View>

          {/* Bounded Chart Stage with background grid lines */}
          <View style={styles.chartStage}>
            <View style={styles.gridlines}>
              <View style={styles.gridline} />
              <View style={styles.gridline} />
              <View style={styles.gridline} />
            </View>

            <View style={styles.barsContainer}>
              {dailyPlays.map((b, index) => {
                const isFirst = index === 0;
                const isLast = index === dailyPlays.length - 1;
                const pct = Math.min(Math.round((b.plays / 17000) * 100), 92);
                return (
                  <View key={`${b.day}-${index}`} style={styles.barCol}>
                    <View style={styles.barValSlot}>
                      <Text style={styles.barVal}>
                        {isFirst ? "7.2k" : isLast ? "14.8k" : ""}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${pct}%` },
                          b.today && styles.barFillToday,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDay, b.today && styles.barDayToday]}>
                      {b.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterLabel}>Daily plays</Text>
            <Text style={styles.chartFooterVal}>14,800 today</Text>
          </View>
        </View>

        {/* Recent Campaigns Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Campaigns</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Campaigns")}>
            <Text style={styles.sectionLink}>View All ({ads.length}) →</Text>
          </TouchableOpacity>
        </View>

        {/* Campaign Cards */}
        {ads.slice(0, 3).map((ad) => (
          <TouchableOpacity
            key={ad.id}
            style={styles.adCard}
            onPress={() => navigation.navigate("ViewAd", { ad })}
            activeOpacity={0.8}
          >
            <View style={styles.adHeader}>
              <View style={styles.adInitialsBox}>
                <Text style={styles.adInitialsText}>{ad.initials || "AD"}</Text>
              </View>

              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.adTitle} numberOfLines={1}>
                  {ad.name}
                </Text>
                <Text style={styles.adBrand}>{ad.brand}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  ad.status === "Active"
                    ? styles.statusActive
                    : ad.status === "Pending approval"
                      ? styles.statusPending
                      : styles.statusCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    ad.status === "Active"
                      ? styles.statusTextActive
                      : ad.status === "Pending approval"
                        ? styles.statusTextPending
                        : styles.statusTextCompleted,
                  ]}
                >
                  {ad.status}
                </Text>
              </View>
            </View>

            {/* Play Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.round((ad.plays / (ad.target || 1)) * 100))}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {ad.plays.toLocaleString()} plays done
              </Text>
              <Text style={styles.progressText}>
                {Math.min(100, Math.round((ad.plays / (ad.target || 1)) * 100))}% of target
              </Text>
            </View>

            <View style={styles.adFooter}>
              <Text style={styles.footerInfo}>🚕 {ad.cabs} Cabs</Text>
              <Text style={styles.footerInfo}>📍 {ad.area}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  headingBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 4,
  },
  mainSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  createBtnHeader: {
    backgroundColor: colors.yellow,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  createBtnHeaderText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
  sampleNote: {
    backgroundColor: colors.sage,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  sampleNoteStrong: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 2,
  },
  sampleNoteText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    lineHeight: 24,
  },
  statSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginVertical: 10,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  chartSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  chartPill: {
    backgroundColor: colors.sage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chartPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.green,
  },
  chartStage: {
    height: 120,
    position: "relative",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  gridlines: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 14,
    bottom: 20,
    justifyContent: "space-between",
  },
  gridline: {
    height: 1,
    backgroundColor: "#e8ede4",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "space-between",
  },
  barValSlot: {
    height: 12,
    justifyContent: "center",
  },
  barVal: {
    fontSize: 7.5,
    color: colors.muted,
    fontWeight: "700",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 1,
  },
  barFill: {
    width: "80%",
    maxWidth: 16,
    backgroundColor: "#9ecfae",
    borderRadius: 3,
  },
  barFillToday: {
    backgroundColor: colors.yellow,
  },
  barDay: {
    height: 14,
    fontSize: 8,
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
  },
  barDayToday: {
    color: colors.ink,
    fontWeight: "900",
  },
  chartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  chartFooterLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  chartFooterVal: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.greenDark,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
  },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  adInitialsBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
  adInitialsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  adTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  adBrand: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "#d4f4e2",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusCompleted: {
    backgroundColor: "#e5e7eb",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusTextActive: {
    color: "#076d3e",
  },
  statusTextPending: {
    color: "#92400e",
  },
  statusTextCompleted: {
    color: "#4b5563",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.sage,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  adFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  footerInfo: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
});
