import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";
import { Advertisement } from "../types";
import { CabScreenPreview } from "../components/CabScreenPreview";

interface Props {
  navigation?: any;
}

type StatusFilter = "All ads" | "Active" | "Pending approval" | "Completed";
type SortOrder = "recent" | "plays" | "name";

export const CampaignsScreen: React.FC<Props> = ({ navigation }) => {
  const [ads] = useState<Advertisement[]>(() => storageService.getAdvertisements());
  const [filter, setFilter] = useState<StatusFilter>("All ads");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  const counts = {
    "All ads": ads.length,
    Active: ads.filter((a) => a.status === "Active").length,
    "Pending approval": ads.filter((a) => a.status === "Pending approval").length,
    Completed: ads.filter((a) => a.status === "Completed").length,
  };

  const filteredAds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ads
      .filter((ad) => {
        const matchFilter = filter === "All ads" || ad.status === filter;
        const matchSearch =
          !q ||
          ad.name.toLowerCase().includes(q) ||
          ad.brand.toLowerCase().includes(q) ||
          ad.area.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      })
      .sort((a, b) => {
        if (sortOrder === "plays") return b.plays - a.plays;
        if (sortOrder === "name") return a.name.localeCompare(b.name);
        return b.submitted.localeCompare(a.submitted);
      });
  }, [ads, filter, search, sortOrder]);

  const totalDelivered = ads.reduce((sum, a) => sum + (a.plays || 0), 0);
  const totalCabs = ads.filter((a) => a.status === "Active").reduce((sum, a) => sum + a.cabs, 0) || 180;

  const getArtColor = (index: number) => {
    const palette = [
      colors.green,
      "#0284c7",
      "#7c3aed",
      "#ea580c",
      "#059669",
      "#d97706",
    ];
    return palette[index % palette.length];
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header matching Advertisements.tsx */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>ADVERTISER PORTAL</Text>
              <Text style={styles.heading}>My advertisements</Text>
              <Text style={styles.sub}>
                Keep track of campaign status and delivery at a glance.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation?.navigate("CreateAd")}
              activeOpacity={0.8}
            >
              <Text style={styles.createBtnText}>+ Create new ad</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 Summary Stat Cards matching website ad-list-summary */}
        <View style={styles.summaryStats}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statBadge, { backgroundColor: colors.greenLight }]}>
                <Text style={[styles.statBadgeText, { color: colors.greenDark }]}>AD</Text>
              </View>
              <Text style={styles.statLabel}>Total advertisements</Text>
            </View>
            <Text style={styles.statVal}>{ads.length} campaigns</Text>
            <Text style={styles.statFoot}>
              {counts.Active} active · {counts["Pending approval"]} pending
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statBadge, { backgroundColor: colors.yellowLight }]}>
                <Text style={[styles.statBadgeText, { color: colors.yellowDark }]}>↗</Text>
              </View>
              <Text style={styles.statLabel}>Plays delivered</Text>
            </View>
            <Text style={styles.statVal}>{totalDelivered.toLocaleString("en-IN")}</Text>
            <Text style={styles.statFoot}>Across active campaigns</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statBadge, { backgroundColor: colors.sage }]}>
                <Text style={[styles.statBadgeText, { color: colors.ink }]}>CAB</Text>
              </View>
              <Text style={styles.statLabel}>Active cab coverage</Text>
            </View>
            <Text style={styles.statVal}>{totalCabs} cabs</Text>
            <Text style={styles.statFoot}>Hyderabad assigned routes</Text>
          </View>
        </View>

        {/* Filter Controls & Search matching ad-list-controls */}
        <View style={styles.controlsPanel}>
          {/* Status Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(["All ads", "Active", "Pending approval", "Completed"] as StatusFilter[]).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, filter === st && styles.filterPillActive]}
                onPress={() => setFilter(st)}
              >
                <Text style={[styles.filterPillText, filter === st && styles.filterPillTextActive]}>
                  {st}
                </Text>
                <View style={[styles.countBadge, filter === st && styles.countBadgeActive]}>
                  <Text style={[styles.countText, filter === st && styles.countTextActive]}>
                    {counts[st]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Bar & Sort Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search campaigns or brands..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sortPills}>
              <TouchableOpacity
                style={[styles.sortBtn, sortOrder === "recent" && styles.sortBtnActive]}
                onPress={() => setSortOrder("recent")}
              >
                <Text style={[styles.sortText, sortOrder === "recent" && styles.sortTextActive]}>
                  Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortOrder === "plays" && styles.sortBtnActive]}
                onPress={() => setSortOrder("plays")}
              >
                <Text style={[styles.sortText, sortOrder === "plays" && styles.sortTextActive]}>
                  Plays
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Campaign List matching ad-list */}
        <View style={styles.listSection}>
          {filteredAds.map((ad, idx) => {
            const progress = Math.min(100, Math.round((ad.plays / (ad.target || 1)) * 100));
            const isActive = ad.status === "Active";
            const isPending = ad.status === "Pending approval";

            return (
              <TouchableOpacity
                key={ad.id}
                style={styles.adCard}
                onPress={() =>
                  navigation?.navigate
                    ? navigation.navigate("ViewAd", { ad })
                    : setSelectedAd(ad)
                }
                activeOpacity={0.8}
              >
                <View style={styles.cardMainRow}>
                  {/* Artwork Box with initials */}
                  <View style={[styles.artBox, { backgroundColor: getArtColor(idx) }]}>
                    <Text style={styles.artText}>{ad.initials || "AD"}</Text>
                  </View>

                  {/* Campaign Information */}
                  <View style={styles.adInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.adTitle} numberOfLines={1}>
                        {ad.name}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive
                            ? styles.statusActive
                            : isPending
                            ? styles.statusPending
                            : styles.statusCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isActive
                              ? styles.statusTextActive
                              : isPending
                              ? styles.statusTextPending
                              : styles.statusTextCompleted,
                          ]}
                        >
                          {ad.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.adBrand}>{ad.brand}</Text>
                    <Text style={styles.adArea}>{ad.area}</Text>
                    <Text style={styles.adSubmitted}>Submitted {ad.submitted}</Text>
                  </View>
                </View>

                {/* Delivery Progress Bar */}
                <View style={styles.deliverySection}>
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.deliveryLabel}>Plays delivered</Text>
                    <Text style={styles.deliveryPct}>{progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: isActive ? colors.green : colors.yellowDark,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.playCountRow}>
                    <Text style={styles.playCountText}>
                      <Text style={{ fontWeight: "900", color: colors.ink }}>
                        {ad.plays.toLocaleString("en-IN")}
                      </Text>{" "}
                      / {ad.target.toLocaleString("en-IN")} target plays
                    </Text>
                    <Text style={styles.playCaption}>
                      {isActive
                        ? "Delivery in progress"
                        : isPending
                        ? "Starts after review"
                        : "Final delivery"}
                    </Text>
                  </View>
                </View>

                {/* Run Details & Fleet */}
                <View style={styles.runDetailRow}>
                  <Text style={styles.runDetailText}>
                    🚕 {isActive ? `${ad.cabs} cabs · ${ad.fleet}` : `${ad.cabs} cabs requested`}
                  </Text>
                  <Text style={styles.viewDetailLink}>View details →</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredAds.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No advertisements found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your status filter or search keyword.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ad Detail Modal matching website view-ad.html */}
      <Modal visible={!!selectedAd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>CAMPAIGN INSPECTION</Text>
                <Text style={styles.modalTitle}>{selectedAd?.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedAd(null)}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAd && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <CabScreenPreview
                  brand={selectedAd.brand}
                  headline={selectedAd.name}
                  subtext={`Assigned territory: ${selectedAd.area}`}
                />

                <View style={styles.detailBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand</Text>
                    <Text style={styles.detailVal}>{selectedAd.brand}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned Corridor</Text>
                    <Text style={styles.detailVal}>{selectedAd.area}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Target Plays</Text>
                    <Text style={styles.detailVal}>{selectedAd.target.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed Plays</Text>
                    <Text style={[styles.detailVal, { color: colors.green, fontWeight: "900" }]}>
                      {selectedAd.plays.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned Fleet</Text>
                    <Text style={styles.detailVal}>{selectedAd.cabs} Smart Cabs</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailVal, { color: colors.greenDark, fontWeight: "800" }]}>
                      {selectedAd.status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Schedule</Text>
                    <Text style={styles.detailVal}>{selectedAd.dates}</Text>
                  </View>
                </View>

                {selectedAd.note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>Campaign Note</Text>
                    <Text style={styles.noteBody}>{selectedAd.note}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={() => {
                    Alert.alert(
                      "GPS Telemetry Exported",
                      `Downloaded playback report for: ${selectedAd.name}\nFleet: ${selectedAd.cabs} vehicles active across ${selectedAd.area}.`
                    );
                    setSelectedAd(null);
                  }}
                >
                  <Text style={styles.exportBtnText}>📥 Export GPS Telemetry Report</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
    maxWidth: 240,
  },
  createBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  summaryStats: {
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
  },
  statFoot: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  controlsPanel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 16,
  },
  filterScroll: {
    marginHorizontal: -4,
    marginBottom: 12,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  countBadge: {
    backgroundColor: colors.sage,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: colors.greenDark,
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.greenDark,
  },
  countTextActive: {
    color: colors.surface,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 14,
    color: colors.muted,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.ink,
  },
  sortPills: {
    flexDirection: "row",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortBtnActive: {
    backgroundColor: colors.surface,
  },
  sortText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
  },
  sortTextActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  listSection: {
    gap: 12,
  },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  artBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  artText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  adInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: colors.greenLight,
  },
  statusPending: {
    backgroundColor: colors.yellowLight,
  },
  statusCompleted: {
    backgroundColor: "#f1f3f5",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  statusTextActive: {
    color: colors.greenDark,
  },
  statusTextPending: {
    color: colors.yellowDark,
  },
  statusTextCompleted: {
    color: colors.muted,
  },
  adBrand: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  adArea: {
    fontSize: 11,
    color: colors.greenDark,
    fontWeight: "600",
    marginTop: 2,
  },
  adSubmitted: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  deliverySection: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  deliveryLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  deliveryPct: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  playCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playCountText: {
    fontSize: 10,
    color: colors.muted,
  },
  playCaption: {
    fontSize: 10,
    color: colors.greenDark,
    fontWeight: "700",
  },
  runDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  runDetailText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    flex: 1,
  },
  viewDetailLink: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.green,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 24, 20, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "88%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  detailBox: {
    backgroundColor: colors.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  noteBox: {
    backgroundColor: colors.sage,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 2,
  },
  noteBody: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 15,
  },
  exportBtn: {
    backgroundColor: colors.yellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
});
