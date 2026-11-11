import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  type ScrollViewInstance,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import {
  storageService,
  CREATIVE_PRESETS,
  HYDERABAD_CORRIDORS,
} from "../services/storage";
import { CabScreenPreview } from "../components/CabScreenPreview";

interface Props {
  navigation?: any;
}

const STARTER_PLAN = {
  plays: 7000,
  days: 7,
  cabs: 10,
  price: 2100,
};

export const CreateAdScreen: React.FC<Props> = ({ navigation }) => {
  const profile = storageService.getProfile();
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  // Form states
  const [adName, setAdName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(CREATIVE_PRESETS[1]);
  const [corridor, setCorridor] = useState(HYDERABAD_CORRIDORS[0]);
  const [planSelected, setPlanSelected] = useState(true);

  // Uploaded banner state
  const [bannerUri, setBannerUri] = useState<string | undefined>(undefined);
  const [bannerName, setBannerName] = useState<string>("");
  const [bannerSize, setBannerSize] = useState<string>("");

  // Feedback states
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Section anchor positions for smooth navigation
  const [section1Y, setSection1Y] = useState(0);
  const [section2Y, setSection2Y] = useState(0);
  const [section3Y, setSection3Y] = useState(0);

  const finalName = adName.trim() || selectedPreset.headline;
  const finalBrand = profile.businessName || selectedPreset.brand;

  const scrollToSection = (section: 1 | 2 | 3) => {
    const targetY = section === 1 ? section1Y : section === 2 ? section2Y : section3Y;
    scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY - 10), animated: true });
  };

  // Real Image Picker from device photos or files
  const pickBannerImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setBannerUri(asset.uri);
        const name = asset.fileName || `ad-banner-${Date.now().toString().slice(-4)}.jpg`;
        setBannerName(name);
        const sizeMb = asset.fileSize
          ? (asset.fileSize / 1024 / 1024).toFixed(1)
          : "1.2";
        setBannerSize(`${sizeMb} MB`);
        setErrorMsg("");
      }
    } catch {
      Alert.alert("Upload Error", "Could not access image library.");
    }
  };

  const removeBannerImage = () => {
    setBannerUri(undefined);
    setBannerName("");
    setBannerSize("");
  };

  const handleDownloadBrief = () => {
    if (!adName.trim() && !bannerUri) {
      setErrorMsg("Add an advertisement name and banner image before downloading.");
      scrollToSection(1);
      return;
    }
    if (!planSelected) {
      setErrorMsg("Select the campaign plan before downloading the review brief.");
      scrollToSection(3);
      return;
    }

    setErrorMsg("");
    const briefText = [
      "ADROVER / ADVERTISEMENT REVIEW BRIEF",
      `Advertisement: ${adName.trim() || finalName}`,
      `Banner image: ${bannerName || "adrover-banner-default.webp"} (${bannerSize || "1.2 MB"})`,
      `Target area: ${corridor} (preference; to be confirmed)`,
      "Start date: To be discussed",
      "End date: To be discussed",
      `Plan: ${STARTER_PLAN.plays.toLocaleString("en-IN")} plays over ${STARTER_PLAN.days} days`,
      `Starting price: ₹${STARTER_PLAN.price.toLocaleString("en-IN")} (subject to confirmation)`,
      "",
      `Creative preview: ${bannerName || "asset"}.`,
      "",
      "Contact Adrover to confirm availability, requirements and final pricing.",
    ].join("\n");

    setStatusMsg("Review brief downloaded to this device.");
    Alert.alert(
      "Review Brief Downloaded",
      `Saved: Adrover-advertisement-review-brief.txt\n\n${briefText.slice(0, 260)}...`,
      [{ text: "OK" }]
    );
  };

  const handleSaveCampaign = () => {
    if (!adName.trim()) {
      setErrorMsg("Add an advertisement name before saving this ad.");
      scrollToSection(1);
      return;
    }
    if (!planSelected) {
      setErrorMsg("Select the campaign plan before saving this ad.");
      scrollToSection(3);
      return;
    }

    setErrorMsg("");
    const newAd = {
      id: `ad-${Date.now()}`,
      name: adName.trim(),
      brand: finalBrand,
      initials:
        finalBrand
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join("") || "AD",
      area: corridor,
      submitted: new Date().toISOString().slice(0, 10),
      dates: `Start date to be confirmed · ${STARTER_PLAN.days} days requested`,
      status: "Pending approval" as const,
      plays: 0,
      target: STARTER_PLAN.plays,
      elapsedDays: 0,
      totalDays: STARTER_PLAN.days,
      cabs: STARTER_PLAN.cabs,
      fleet: "Fleet reservation is not confirmed",
      note: `Starter plan: ${STARTER_PLAN.plays.toLocaleString("en-IN")} plays over ${STARTER_PLAN.days} days. Starting price: ₹${STARTER_PLAN.price.toLocaleString("en-IN")}. Banner: ${bannerName || "Local creative"}. Review pending; availability and final pricing require confirmation.`,
    };

    storageService.addAdvertisement(newAd);
    setSuccess(true);
    setStatusMsg("Advertisement submitted for review.");

    setTimeout(() => {
      setSuccess(false);
      navigation?.navigate("ViewAd", { ad: newAd });
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching CreateAd.tsx */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.eyebrow}>ADVERTISER PORTAL</Text>
              <Text style={styles.heading}>Create a new advertisement</Text>
              <Text style={styles.sub}>
                Add your campaign details, preview your creative and select a
                plan.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <View style={styles.draftBadge}>
                <View style={styles.draftDot} />
                <Text style={styles.draftText}>Draft</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation?.navigate("Campaigns")}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sampleNote}>
          <Text style={styles.noteTitle}>Campaign details</Text>
          <Text style={styles.noteText}>
            Add your campaign information and creative for review.
          </Text>
        </View>

        {/* Numbered Setup Steps Bar matching create-ad-steps */}
        <View style={styles.stepsBar}>
          <TouchableOpacity
            style={styles.stepTab}
            onPress={() => scrollToSection(1)}
            activeOpacity={0.7}
          >
            <View style={[styles.stepNumCircle, styles.stepNumCircleActive]}>
              <Text style={styles.stepNumActiveText}>1</Text>
            </View>
            <Text style={styles.stepLabelActiveText}>Campaign details</Text>
          </TouchableOpacity>

          <View style={styles.stepSeparator} />

          <TouchableOpacity
            style={styles.stepTab}
            onPress={() => scrollToSection(2)}
            activeOpacity={0.7}
          >
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={styles.stepLabelText}>Preview creative</Text>
          </TouchableOpacity>

          <View style={styles.stepSeparator} />

          <TouchableOpacity
            style={styles.stepTab}
            onPress={() => scrollToSection(3)}
            activeOpacity={0.7}
          >
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={styles.stepLabelText}>Plan &amp; review</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Alerts */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {errorMsg}</Text>
          </View>
        ) : null}

        {statusMsg ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>ℹ {statusMsg}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              ✓ Advertisement saved! Redirecting to campaigns...
            </Text>
          </View>
        ) : null}

        {/* SECTION 01: Campaign Essentials & Live Text Preview */}
        <View
          style={styles.sectionWrap}
          onLayout={(e) => setSection1Y(e.nativeEvent.layout.y)}
        >
          {/* Card: Campaign Essentials Form */}
          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Campaign essentials</Text>
                <Text style={styles.cardSub}>
                  Tell us the basics so your plan is easy to review.
                </Text>
              </View>
              <Text style={styles.stepBadge}>01</Text>
            </View>

            {/* Field: Advertisement name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Advertisement name *</Text>
              <TextInput
                style={styles.input}
                value={adName}
                onChangeText={(val) => {
                  setAdName(val);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="For example, Summer launch campaign"
                placeholderTextColor={colors.muted}
                maxLength={100}
              />
            </View>

            {/* Field: Hyderabad Corridor / Area */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Campaign target area</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.corridorScroll}
              >
                {HYDERABAD_CORRIDORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.corridorChip,
                      corridor === c && styles.corridorChipActive,
                    ]}
                    onPress={() => setCorridor(c)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.corridorChipText,
                        corridor === c && styles.corridorChipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Field: Ad banner image upload matching website */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ad banner image *</Text>

              <TouchableOpacity
                style={styles.uploadDashedBtn}
                onPress={pickBannerImage}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadIcon}>📁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>
                    {bannerUri ? "Replace banner image" : "Choose image from device"}
                  </Text>
                  <Text style={styles.uploadSub}>
                    PNG, JPEG or WebP · up to 5 MB · previewed on this device
                  </Text>
                </View>
                <View style={styles.browsePill}>
                  <Text style={styles.browsePillText}>Browse</Text>
                </View>
              </TouchableOpacity>

              {/* Selected Banner Info & Thumbnail */}
              {bannerUri ? (
                <View style={styles.bannerRow}>
                  <Image source={{ uri: bannerUri }} style={styles.bannerThumb} />
                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.bannerFileName} numberOfLines={1}>
                      {bannerName}
                    </Text>
                    <Text style={styles.bannerFileSize}>
                      {bannerSize} · Custom upload
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={removeBannerImage}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.fieldHelp}>
                  PNG, JPEG or WebP · up to 5 MB · previewed in this app only.
                </Text>
              )}
            </View>

            <Text style={styles.fineNote}>
              Campaign area, schedule, availability and final pricing are confirmed
              during review. Your banner stays in this app and is not uploaded.
            </Text>
          </View>

          {/* Live Campaign Preview Mockup matching create-ad-live-preview */}
          <View style={styles.liveMockCard}>
            <View style={styles.liveMockHeader}>
              <View>
                <Text style={styles.liveMockTitle}>Campaign preview</Text>
                <Text style={styles.liveMockSub}>Updates as you edit details</Text>
              </View>
              <View style={styles.panelTag}>
                <Text style={styles.panelTagText}>TEXT PREVIEW</Text>
              </View>
            </View>

            <View style={styles.mockScreenBox}>
              <Text style={styles.mockBrand}>{finalBrand}</Text>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.mockBannerImage} />
              ) : null}
              <Text style={styles.mockHeadline}>{finalName}</Text>
              <Text style={styles.mockArea}>{corridor}</Text>
            </View>

            <Text style={styles.liveMockFine}>
              Text mockup only. View actual rooftop LED cab screen below in section 02.
            </Text>
          </View>
        </View>

        {/* SECTION 02: Add and preview your creative matching create-ad-creative-section */}
        <View
          style={styles.sectionWrap}
          onLayout={(e) => setSection2Y(e.nativeEvent.layout.y)}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionStepNumber}>02</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sectionHeading}>
                Add and preview your creative
              </Text>
              <Text style={styles.sectionSub}>
                Preview how your ad looks mounted atop Hyderabad smart cabs.
              </Text>
            </View>
          </View>

          {/* Real Cab Screen Preview Component */}
          <View style={styles.cabPreviewContainer}>
            <CabScreenPreview
              brand={finalBrand}
              headline={finalName}
              subtext={`Assigned territory: ${corridor}`}
              bgColor={selectedPreset.color}
              bannerUri={bannerUri}
            />
          </View>

          {/* Creative Palettes */}
          <View style={styles.presetsCard}>
            <Text style={styles.presetsTitle}>CREATIVE STARTING POINTS</Text>
            <View style={styles.presetsGrid}>
              {CREATIVE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetChip,
                    selectedPreset.id === preset.id && styles.presetChipActive,
                  ]}
                  onPress={() => setSelectedPreset(preset)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.presetDot, { backgroundColor: preset.color }]}
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedPreset.id === preset.id && styles.presetChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.uploadPromptBtn}
              onPress={pickBannerImage}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadPromptText}>
                📷 {bannerUri ? "Replace custom uploaded image" : "Upload your custom 16:9 banner image"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Screen Specs Box */}
          <View style={styles.specsBox}>
            <Text style={styles.specsTitle}>Digital Taxi Screen Specifications</Text>
            <Text style={styles.specsLine}>
              • 16:9 Rooftop Full HD LED Display (1920 × 1080)
            </Text>
            <Text style={styles.specsLine}>
              • Synchronized GPS beaconing across Hyderabad corridors
            </Text>
            <Text style={styles.specsLine}>
              • Sunlight-adaptive ultra-bright display (5,000 nits)
            </Text>
          </View>
        </View>

        {/* SECTION 03: Select your campaign plan matching create-ad-plan-section */}
        <View
          style={styles.sectionWrap}
          onLayout={(e) => setSection3Y(e.nativeEvent.layout.y)}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionStepNumber}>03</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sectionHeading}>
                Select your campaign plan
              </Text>
              <Text style={styles.sectionSub}>
                Choose the available starter plan for your review request.
              </Text>
            </View>
          </View>

          {/* Starter Plan Radio Card */}
          <TouchableOpacity
            style={[styles.planCard, planSelected && styles.planCardSelected]}
            onPress={() => setPlanSelected(true)}
            activeOpacity={0.85}
          >
            <View style={styles.planCardTop}>
              <View style={styles.planRadioCircle}>
                {planSelected && <View style={styles.planRadioInner} />}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.starterTag}>
                  <Text style={styles.starterTagText}>STARTER PLAN</Text>
                </View>
                <Text style={styles.planTitle}>Starter Transit Plan</Text>
                <Text style={styles.planPlaysDays}>
                  {STARTER_PLAN.plays.toLocaleString("en-IN")} plays · {STARTER_PLAN.days} days
                </Text>
              </View>

              <View style={styles.planPriceCol}>
                <Text style={styles.planPrice}>
                  ₹{STARTER_PLAN.price.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.planPriceNote}>starting price</Text>
              </View>
            </View>

            {/* Plan Metrics Row */}
            <View style={styles.planMetricsRow}>
              <View style={styles.planMetricItem}>
                <Text style={styles.metricBig}>
                  {STARTER_PLAN.plays.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.metricSmall}>Estimated plays</Text>
              </View>
              <View style={styles.metricVDivider} />
              <View style={styles.planMetricItem}>
                <Text style={styles.metricBig}>7 Days</Text>
                <Text style={styles.metricSmall}>Campaign run</Text>
              </View>
              <View style={styles.metricVDivider} />
              <View style={styles.planMetricItem}>
                <Text style={styles.metricBig}>{STARTER_PLAN.cabs} Cabs</Text>
                <Text style={styles.metricSmall}>Dedicated fleet</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.planFootnote}>
            Final pricing and availability require confirmation.
          </Text>
        </View>

        {/* SECTION: Prepare a review brief matching create-ad-review */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewEyebrow}>NEXT STEP</Text>
          <Text style={styles.reviewTitle}>Prepare a review brief</Text>
          <Text style={styles.reviewSub}>
            Download your campaign details to review or share with the Adrover team.
          </Text>

          {/* Quick Review Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryKey}>Advertisement:</Text>
              <Text style={styles.summaryVal} numberOfLines={1}>
                {finalName}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryKey}>Target area:</Text>
              <Text style={styles.summaryVal}>{corridor}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryKey}>Banner asset:</Text>
              <Text style={styles.summaryVal} numberOfLines={1}>
                {bannerName || "Default creative preset"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryKey}>Plan duration:</Text>
              <Text style={styles.summaryVal}>
                {STARTER_PLAN.plays.toLocaleString("en-IN")} plays · {STARTER_PLAN.days} days
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryKey}>Status upon save:</Text>
              <Text style={styles.summaryValPending}>Pending approval</Text>
            </View>
          </View>

          {/* Dual Action Buttons matching website */}
          <View style={styles.reviewActionsRow}>
            <TouchableOpacity
              style={styles.downloadBriefBtn}
              onPress={handleDownloadBrief}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBriefBtnText}>Download brief</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleSaveCampaign}
              activeOpacity={0.85}
            >
              <Text style={styles.submitReviewBtnText}>Submit ad for review</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 80,
  },

  // Header matching CreateAd.tsx
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 4,
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
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.yellowDark,
    marginRight: 6,
  },
  draftText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  cancelBtn: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },

  // Local Storage Note
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

  // Setup Steps Bar
  stepsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
  },
  stepTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumCircleActive: {
    backgroundColor: colors.green,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
  },
  stepNumActiveText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.surface,
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  stepLabelActiveText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },
  stepSeparator: {
    width: 16,
    height: 1,
    backgroundColor: colors.line,
  },

  // Feedback Banners
  errorBanner: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffc9c9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "700",
  },
  statusBanner: {
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    color: colors.greenDark,
    fontWeight: "700",
  },
  successBanner: {
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    color: colors.greenDark,
    fontWeight: "800",
    textAlign: "center",
  },

  // Section Layout Wrapper
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionStepNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.green,
    lineHeight: 24,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },

  // Card Panel
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
  },
  cardHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
  },
  cardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  stepBadge: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.muted,
  },

  // Fields
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  corridorScroll: {
    marginHorizontal: -4,
  },
  corridorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    marginRight: 8,
  },
  corridorChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  corridorChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  corridorChipTextActive: {
    color: colors.surface,
    fontWeight: "800",
  },
  uploadDashedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.sage,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.green,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  uploadIcon: {
    fontSize: 22,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.greenDark,
  },
  uploadSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  browsePill: {
    backgroundColor: colors.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  browsePillText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "800",
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
  },
  bannerThumb: {
    width: 44,
    height: 32,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  bannerFileName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  bannerFileSize: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffc9c9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.danger,
  },
  fieldHelp: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  fineNote: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },

  // Live Mock Card matching create-ad-live-preview
  liveMockCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  liveMockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveMockTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  liveMockSub: {
    fontSize: 11,
    color: colors.muted,
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
  mockScreenBox: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    borderWidth: 2,
    borderColor: colors.line,
  },
  mockBrand: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.yellow,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  mockBannerImage: {
    width: "100%",
    height: 70,
    borderRadius: 4,
    marginBottom: 8,
    resizeMode: "cover",
  },
  mockHeadline: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 4,
  },
  mockArea: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  liveMockFine: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 10,
    textAlign: "center",
  },

  // Creative & Cab Section
  cabPreviewContainer: {
    marginBottom: 14,
  },
  presetsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    gap: 6,
    width: "48%",
  },
  presetChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  presetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
    flex: 1,
  },
  presetChipTextActive: {
    color: colors.greenDark,
    fontWeight: "800",
  },
  uploadPromptBtn: {
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 4,
  },
  uploadPromptText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.green,
  },
  specsBox: {
    backgroundColor: colors.sage,
    padding: 12,
    borderRadius: 8,
  },
  specsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 4,
  },
  specsLine: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },

  // Plan Card
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
  },
  planCardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  planCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  planRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  starterTag: {
    backgroundColor: colors.yellow,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  starterTagText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.ink,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
  },
  planPlaysDays: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.green,
  },
  planPriceNote: {
    fontSize: 10,
    color: colors.muted,
  },
  planMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  planMetricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricBig: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
  metricSmall: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  metricVDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.line,
  },
  planFootnote: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 16,
  },

  // Review Section matching create-ad-review
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 8,
  },
  reviewEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 2,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
  },
  reviewSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryKey: {
    fontSize: 11,
    color: colors.muted,
  },
  summaryVal: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
    maxWidth: "60%",
    textAlign: "right",
  },
  summaryValPending: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.yellowDark,
  },
  reviewActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  downloadBriefBtn: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBriefBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  submitReviewBtn: {
    flex: 1.3,
    backgroundColor: colors.yellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitReviewBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
});
