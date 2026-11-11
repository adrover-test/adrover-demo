import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import {
  storageService,
  CREATIVE_PRESETS,
  PLAN_TIERS,
  HYDERABAD_CORRIDORS,
} from "../services/storage";
import { CabScreenPreview } from "../components/CabScreenPreview";
import { AnimatedRoadCab } from "../components/AnimatedRoadCab";

interface Props {
  navigation: any;
}

type Step = 1 | 2 | 3 | 4;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : 0
  );
  const safeBottom = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 54 : 20
  );
  const [step, setStep] = useState<Step>(1);

  // Custom Image Upload State
  const [bannerUri, setBannerUri] = useState<string | undefined>(undefined);
  const [bannerName, setBannerName] = useState<string>("");

  const pickRegisterImage = async () => {
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
        setBannerName(asset.fileName || "custom-creative.jpg");
      }
    } catch (e) {
      Alert.alert("Upload Error", "Could not access image library.");
    }
  };

  const continueToPlan = () => {
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const phoneDigits = phone.replace(/\D/g, "");
    if (
      !contactName.trim() ||
      !businessName.trim() ||
      !emailLooksValid ||
      phoneDigits.length !== 10
    ) {
      Alert.alert(
        "Check your details",
        "Enter your name, business name, valid email and 10-digit mobile number.",
      );
      return;
    }
    setStep(3);
  };

  // Step 1: Creative
  const [selectedPreset, setSelectedPreset] = useState(CREATIVE_PRESETS[0]);
  const [customHeadline, setCustomHeadline] = useState(CREATIVE_PRESETS[0].headline);
  const [customBrand, setCustomBrand] = useState(CREATIVE_PRESETS[0].brand);
  const [customSubtext, setCustomSubtext] = useState(CREATIVE_PRESETS[0].subtext);

  // Step 2: Details
  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [corridor, setCorridor] = useState(HYDERABAD_CORRIDORS[0]);

  // Step 3: Plan
  const [selectedPlan, setSelectedPlan] = useState(PLAN_TIERS[1]);

  // Final Action: Complete
  const handleLaunchCampaign = () => {
    storageService.addAdvertisement({
      id: `camp-${Date.now()}`,
      name: customHeadline,
      brand: customBrand || businessName,
      initials: (customBrand || businessName).slice(0, 2).toUpperCase(),
      area: corridor,
      submitted: new Date().toISOString().split("T")[0],
      dates: `Starts in 48 hrs (${selectedPlan.days} days)`,
      status: "Active",
      plays: 0,
      target: selectedPlan.plays,
      elapsedDays: 0,
      totalDays: selectedPlan.days,
      cabs: selectedPlan.cabs,
      fleet: `Active on ${corridor}`,
      note: `Mobile Registration Campaign. 16:9 rooftop screen playback.`,
      ownerEmail: email,
    });

    storageService.saveProfile({
      accountName: contactName,
      businessName: customBrand || businessName,
      email: email,
      phone: phone,
      area: corridor,
    });

    storageService.setLoggedIn(true);
    navigation.replace("Main");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: safeTop }]} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: safeBottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Progress */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step === 1) navigation.goBack();
              else setStep((prev) => (prev - 1) as Step);
            }}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step {step} of 4</Text>
          </View>
        </View>

        <AnimatedRoadCab currentStep={step} totalSteps={4} />

        {/* STEP 1: CREATIVE */}
        {step === 1 && (
          <View>
            <Text style={styles.screenHeading}>Preview Your Creative</Text>
            <Text style={styles.screenSub}>
              See your ad live on a Hyderabad cab rooftop screen.
            </Text>

            <CabScreenPreview
              brand={customBrand || selectedPreset.brand}
              headline={customHeadline || selectedPreset.headline}
              subtext={customSubtext || selectedPreset.subtext}
              bgColor={selectedPreset.color}
              bannerUri={bannerUri}
            />

            {/* Direct Device Image / Banner Upload */}
            <TouchableOpacity
              style={styles.regUploadBtn}
              onPress={pickRegisterImage}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>📁</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.regUploadTitle}>
                  {bannerUri ? "Replace custom brand creative" : "Upload your brand creative / banner"}
                </Text>
                <Text style={styles.regUploadSub}>
                  {bannerUri ? `Selected: ${bannerName}` : "Choose PNG, JPEG, or WebP from your device"}
                </Text>
              </View>
              <View style={styles.regBrowsePill}>
                <Text style={styles.regBrowseText}>Browse</Text>
              </View>
            </TouchableOpacity>

            {bannerUri ? (
              <View style={styles.thumbRow}>
                <Image source={{ uri: bannerUri }} style={styles.regThumb} />
                <Text style={styles.regThumbText} numberOfLines={1}>{bannerName}</Text>
                <TouchableOpacity onPress={() => setBannerUri(undefined)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>OR CHOOSE A STARTING DESIGN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {CREATIVE_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.chip,
                    selectedPreset.id === p.id && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedPreset(p);
                    setCustomHeadline(p.headline);
                    setCustomBrand(p.brand);
                    setCustomSubtext(p.subtext);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPreset.id === p.id && styles.chipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>CAMPAIGN HEADLINE</Text>
                <TextInput
                  style={styles.input}
                  value={customHeadline}
                  onChangeText={setCustomHeadline}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>BRAND NAME</Text>
                <TextInput
                  style={styles.input}
                  value={customBrand}
                  onChangeText={setCustomBrand}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryBtnText}>Continue to Details →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <View>
            <Text style={styles.screenHeading}>Advertiser Details</Text>
            <Text style={styles.screenSub}>
              Enter your brand information and preferred Hyderabad territory.
            </Text>

            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>CONTACT PERSON</Text>
                <TextInput
                  style={styles.input}
                  value={contactName}
                  onChangeText={setContactName}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>BUSINESS / REGISTERED BRAND</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>OFFICIAL EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@company.com"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>PHONE NUMBER (+91)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile number"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={continueToPlan}
            >
              <Text style={styles.primaryBtnText}>Continue to Plan →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: PLAN SELECTION */}
        {step === 3 && (
          <View>
            <Text style={styles.screenHeading}>Select Campaign Tier</Text>
            <Text style={styles.screenSub}>
              Choose estimated play volume and fleet cab allocations.
            </Text>

            {PLAN_TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.planCard,
                  selectedPlan.id === tier.id && styles.planCardActive,
                ]}
                onPress={() => setSelectedPlan(tier)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{tier.title}</Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{tier.badge}</Text>
                  </View>
                </View>

                <View style={styles.planMeta}>
                  <Text style={styles.planMetaText}>🎯 {tier.plays.toLocaleString()} Estimated Plays</Text>
                  <Text style={styles.planMetaText}>📅 {tier.days} Days</Text>
                  <Text style={styles.planMetaText}>🚕 ~{tier.cabs} Cabs</Text>
                </View>

                <Text style={styles.planPrice}>
                  ₹{tier.price.toLocaleString()}
                  <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "500" }}> total estimated</Text>
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep(4)}
            >
              <Text style={styles.primaryBtnText}>Review Campaign Brief →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: REVIEW & ACTIVATE */}
        {step === 4 && (
          <View>
            <Text style={styles.screenHeading}>Review & Launch</Text>
            <Text style={styles.screenSub}>
              Review your campaign brief and activate into the advertiser portal.
            </Text>

            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Campaign</Text>
                <Text style={styles.summaryVal}>{customHeadline}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Brand</Text>
                <Text style={styles.summaryVal}>{customBrand || businessName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Corridor</Text>
                <Text style={styles.summaryVal}>{corridor}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Plays</Text>
                <Text style={[styles.summaryVal, { color: colors.green }]}>
                  {selectedPlan.plays.toLocaleString()} Plays
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cabs Assigned</Text>
                <Text style={styles.summaryVal}>~{selectedPlan.cabs} Cabs</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: "800", color: colors.ink }]}>Total Budget</Text>
                <Text style={[styles.summaryVal, { fontSize: 18, color: colors.green, fontWeight: "900" }]}>
                  ₹{selectedPlan.price.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.yellow }]}
              onPress={handleLaunchCampaign}
            >
              <Text style={[styles.primaryBtnText, { color: colors.ink }]}>
                🚀 Launch in Advertiser Portal
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 18,
    flexGrow: 1,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: colors.green,
    fontWeight: "800",
    fontSize: 14,
  },
  stepBadge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },
  progressBar: {
    height: 5,
    backgroundColor: colors.line,
    borderRadius: 3,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 3,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: "row",
    marginBottom: 14,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  chipTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  primaryBtn: {
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  planCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  planBadge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  planMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  planMetaText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.green,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  regUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.sage,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.green,
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    gap: 10,
  },
  regUploadTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.greenDark,
  },
  regUploadSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  regBrowsePill: {
    backgroundColor: colors.green,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  regBrowseText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: "800",
  },
  thumbRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 10,
  },
  regThumb: {
    width: 44,
    height: 30,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  regThumbText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  removeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.danger,
    paddingHorizontal: 6,
  },
});
