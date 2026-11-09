import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Advertisement } from "../types";

interface Props {
  advertisement: Advertisement;
  navigation?: any;
  onBack?: () => void;
}

export const ViewAdScreen: React.FC<Props> = ({
  advertisement: ad,
  navigation,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const isPending = ad.status === "Pending approval";
  const isApproved = (ad.status as string) === "Approved";
  const elapsedDays =
    ad.status === "Completed"
      ? ad.totalDays
      : isPending || isApproved
      ? 0
      : Math.min(Math.max(ad.elapsedDays || 0, 0), ad.totalDays);
  const remainingDays = Math.max(ad.totalDays - elapsedDays, 0);
  const pendingPlays = Math.max(ad.target - ad.plays, 0);
  const progressPct = Math.min(
    Math.round(((ad.plays || 0) / Math.max(ad.target || 1, 1)) * 100),
    100
  );

  const handleDownloadReport = () => {
    const report = [
      "ADROVER / CAMPAIGN REPORT",
      `Campaign ID: ${ad.id.toUpperCase()}`,
      `Advertisement: ${ad.name}`,
      `Brand: ${ad.brand}`,
      `Status: ${ad.status}`,
      `Target area: ${ad.area}`,
      `Campaign period: ${ad.dates}`,
      `Plays delivered: ${ad.plays.toLocaleString("en-IN")}`,
      `Play target: ${ad.target.toLocaleString("en-IN")}`,
      `Pending plays: ${pendingPlays.toLocaleString("en-IN")}`,
      `Fleet: ${ad.cabs} cabs`,
    ].join("\n");

    Alert.alert(
      "Campaign Report",
      `Saved: Adrover-${ad.id}-report.txt\n\n${report.slice(0, 260)}...`,
      [{ text: "OK" }]
    );
  };

  const handleBackToAds = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.navigate) {
      navigation.navigate("Campaigns");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb matching website view-ad-breadcrumb */}
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={handleBackToAds} activeOpacity={0.7}>
            <Text style={styles.breadcrumbLink}>My advertisements</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {ad.name}
          </Text>
        </View>

        {/* Heading matching website dashboard-heading view-ad-heading */}
        <View style={styles.heading}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.eyebrow}>
              CAMPAIGN ID · {ad.id.toUpperCase()}
            </Text>
            <Text style={styles.headingTitle}>{ad.name}</Text>
            <Text style={styles.headingSub}>
              {ad.brand} · {ad.area}
            </Text>
          </View>

          <View style={styles.headingActions}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={handleDownloadReport}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostBtnText}>Download report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.yellowBtn}
              onPress={() => navigation?.navigate("CreateAd")}
              activeOpacity={0.85}
            >
              <Text style={styles.yellowBtnText}>Create new ad</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campaign Info Note matching website dashboard-sample-note */}
        <View style={styles.sampleNote}>
          <Text style={styles.sampleNoteTitle}>Campaign information</Text>
          <Text style={styles.sampleNoteText}>
            View campaign status, target and delivery details.
          </Text>
        </View>

        {/* Status Bar Section matching website view-ad-status-bar */}
        <View style={styles.statusBarSection}>
          <View style={styles.statusHeadingRow}>
            <View style={styles.statusBadgeWrap}>
              <Text style={styles.statusEyebrow}>AD STATUS</Text>
              <View
                style={[
                  styles.statusBadge,
                  ad.status === "Active"
                    ? styles.statusActive
                    : ad.status === "Completed"
                    ? styles.statusCompleted
                    : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    ad.status === "Active"
                      ? styles.statusTextActive
                      : ad.status === "Completed"
                      ? styles.statusTextCompleted
                      : styles.statusTextPending,
                  ]}
                >
                  {ad.status}
                </Text>
              </View>
            </View>

            <Text style={styles.daysHighlight}>
              {isPending || isApproved
                ? `${ad.totalDays} days requested`
                : `${remainingDays} days remaining`}
            </Text>
          </View>

          {/* Progress Bar matching website progress element */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          <Text style={styles.pendingPlaysLine}>
            <Text style={{ fontWeight: "800", color: colors.ink }}>
              Pending plays: {pendingPlays.toLocaleString("en-IN")}
            </Text>
            {" · "}
            {ad.plays.toLocaleString("en-IN")} delivered of{" "}
            {ad.target.toLocaleString("en-IN")}{" "}
            {isPending ? "requested" : "target"} plays
          </Text>

          <Text style={styles.statusExplanation}>
            {isPending
              ? "Awaiting approval. Your campaign has not started."
              : isApproved
              ? "Approved — awaiting payment/scheduling. Your campaign has not started."
              : ad.status === "Completed"
              ? `Campaign completed · ${ad.totalDays} of ${ad.totalDays} days`
              : `${elapsedDays} of ${ad.totalDays} days completed`}
          </Text>
        </View>

        {/* Top Grid matching website view-ad-top-grid */}
        <View style={[styles.topGrid, isWide && styles.topGridWide]}>
          {/* Panel 1: Campaign Overview matching website view-ad-summary */}
          <View style={[styles.panel, isWide && styles.panelLeft]}>
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelTitle}>Campaign overview</Text>
                <Text style={styles.panelSub}>Key details at a glance</Text>
              </View>
              <View style={styles.panelTag}>
                <Text style={styles.panelTagText}>OVERVIEW</Text>
              </View>
            </View>

            <View style={styles.metaDl}>
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>PENDING PLAYS</Text>
                  <Text style={styles.metaDd}>
                    {pendingPlays.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>DELIVERED PLAYS</Text>
                  <Text style={styles.metaDd}>
                    {ad.plays.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>PLAY TARGET</Text>
                  <Text style={styles.metaDd}>
                    {ad.target.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>CAMPAIGN PERIOD</Text>
                  <Text style={styles.metaDd}>{ad.dates}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>TARGET AREA</Text>
                  <Text style={styles.metaDd}>{ad.area}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaDt}>ADVERTISEMENT</Text>
                  <Text style={styles.metaDd}>{ad.name}</Text>
                </View>
              </View>

              <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaDt}>FLEET STATUS</Text>
                  <Text style={styles.metaDd}>{ad.fleet}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Panel 2: Creative Preview matching website view-ad-creative */}
          <View style={[styles.panel, isWide && styles.panelRight]}>
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelTitle}>Creative preview</Text>
                <Text style={styles.panelSub}>Campaign screen concept</Text>
              </View>
              <View style={styles.panelTag}>
                <Text style={styles.panelTagText}>TEXT PREVIEW</Text>
              </View>
            </View>

            {/* Authentic .view-ad-screen mockup from website */}
            <View style={styles.screenMockup}>
              <Text style={styles.screenBrand} numberOfLines={1}>
                {ad.brand}
              </Text>
              <Text style={styles.screenHeadline}>{ad.name}</Text>
              <Text style={styles.screenArea}>Hyderabad · {ad.area}</Text>
              <View style={styles.screenPill}>
                <Text style={styles.screenPillText}>Campaign creative</Text>
              </View>
            </View>

            <Text style={styles.fineNote}>
              The original video asset is not available in the advertiser
              portal.
            </Text>
          </View>
        </View>

        {/* Back Link Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackToAds}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>← Back to advertisements</Text>
        </TouchableOpacity>
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
    paddingBottom: 80,
  },

  // Breadcrumb matching website view-ad-breadcrumb
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.green,
  },
  breadcrumbDivider: {
    fontSize: 11,
    color: colors.muted,
  },
  breadcrumbCurrent: {
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },

  // Heading matching website view-ad-heading
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  headingSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  headingActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  ghostBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  yellowBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  yellowBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },

  // Sample Note matching website dashboard-sample-note
  sampleNote: {
    backgroundColor: colors.sage,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sampleNoteTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 2,
  },
  sampleNoteText: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },

  // Status Bar Section matching website view-ad-status-bar
  statusBarSection: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  statusHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
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
  statusBadgeText: {
    fontSize: 11,
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
  daysHighlight: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },

  // Progress Bar matching website
  progressTrack: {
    height: 9,
    backgroundColor: "#edf1ec",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 20,
  },
  pendingPlaysLine: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  statusExplanation: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },

  // Top Grid matching website view-ad-top-grid
  topGrid: {
    gap: 14,
    marginBottom: 16,
  },
  topGridWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  panelLeft: {
    flex: 1.3,
  },
  panelRight: {
    flex: 0.85,
  },

  // Panels matching website dashboard-panel
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  panelHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
  },
  panelSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  panelTag: {
    backgroundColor: colors.sage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelTagText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.greenDark,
    letterSpacing: 0.5,
  },

  // Definition List matching website view-ad-meta
  metaDl: {
    gap: 0,
  },
  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
    paddingVertical: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaDt: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.3,
  },
  metaDd: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 3,
  },

  // Authentic .view-ad-screen Mockup matching website
  screenMockup: {
    backgroundColor: "#0d2b1c",
    borderRadius: 13,
    borderWidth: 6,
    borderColor: "#29372d",
    padding: 18,
    minHeight: 165,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  screenBrand: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.yellow,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  screenHeadline: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 22,
  },
  screenArea: {
    fontSize: 10,
    color: "#d3e2cf",
  },
  screenPill: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  screenPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  fineNote: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 10,
    lineHeight: 15,
  },

  // Back Button
  backBtn: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.green,
  },
});
