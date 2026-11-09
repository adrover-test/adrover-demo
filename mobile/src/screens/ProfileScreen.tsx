import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";

interface Props {
  navigation: any;
}

const ADVERTISER_TYPES = [
  "Enterprise advertiser",
  "Brand Advertiser",
  "Agency / Media Planner",
  "Local Business",
];

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const currentProfile = storageService.getProfile();
  const [accountName, setAccountName] = useState(currentProfile.accountName || "Aditya Rao");
  const [businessName, setBusinessName] = useState(currentProfile.businessName || "Paradise Food Court");
  const [email, setEmail] = useState(currentProfile.email || "advertiser@example.com");
  const [phone, setPhone] = useState(currentProfile.phone || "+91 98490 12345");
  const [area, setArea] = useState(currentProfile.area || "Hyderabad, Telangana");
  const [advertiserType, setAdvertiserType] = useState(
    currentProfile.advertiserType || "Enterprise advertiser"
  );

  const [savedToast, setSavedToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "AD";

  const handleSave = () => {
    if (!accountName.trim() || !businessName.trim() || !area.trim()) {
      setErrorMsg("Required fields must contain text.");
      return;
    }

    setErrorMsg("");
    storageService.saveProfile({
      accountName: accountName.trim(),
      businessName: businessName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      area: area.trim(),
      advertiserType,
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleReset = () => {
    const p = storageService.getProfile();
    setAccountName(p.accountName);
    setBusinessName(p.businessName);
    setEmail(p.email);
    setPhone(p.phone);
    setArea(p.area);
    setAdvertiserType(p.advertiserType);
    setErrorMsg("");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to end your current advertiser session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            storageService.setLoggedIn(false);
            navigation.replace("Login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Heading matching Profile.tsx */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADVERTISER PORTAL</Text>
          <Text style={styles.heading}>Your profile</Text>
          <Text style={styles.sub}>
            Review and update your business and contact details.
          </Text>
        </View>

        {/* Sample Note */}
        <View style={styles.sampleNote}>
          <Text style={styles.noteTitle}>Profile storage</Text>
          <Text style={styles.noteText}>
            Changes are saved only on this device for this sign-in. Updating
            your contact email does not change your sign-in email.
          </Text>
        </View>

        {savedToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ Profile saved on this device.</Text>
          </View>
        )}

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Profile Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.overline}>{advertiserType}</Text>
            <Text style={styles.userName}>{accountName}</Text>
            <Text style={styles.userMeta}>
              {businessName} · {area}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Advertiser account</Text>
          </View>
        </View>

        {/* Edit Info Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account and business details</Text>
          <Text style={styles.cardSub}>Keep contact parameters accurate for ad dispatch.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>ACCOUNT NAME *</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g. Aditya Rao"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BUSINESS NAME *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Paradise Food Court"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BUSINESS EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PRIMARY SERVICE AREA *</Text>
            <TextInput
              style={styles.input}
              value={area}
              onChangeText={setArea}
              placeholder="e.g. Hyderabad, Telangana"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ADVERTISER TYPE</Text>
            <View style={styles.typeGrid}>
              {ADVERTISER_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, advertiserType === t && styles.typeChipActive]}
                  onPress={() => setAdvertiserType(t)}
                >
                  <Text style={[styles.typeChipText, advertiserType === t && styles.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hyderabad Support Desk Desk */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Adrover Hyderabad Support</Text>
          <Text style={styles.supportBody}>
            Operating from Jubilee Hills, our transit team assists with ad approvals, corridor scheduling, and fleet GPS telemetry.
          </Text>
          <View style={styles.supportMeta}>
            <Text style={styles.metaItem}>📍 Road No. 36, Jubilee Hills, Hyderabad 500033</Text>
            <Text style={styles.metaItem}>📞 +91 40 4821 7700 (Mon–Sat 9AM–7PM)</Text>
            <Text style={styles.metaItem}>✉️ support@adrover.in</Text>
          </View>
        </View>

        {/* Sign Out Action */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out of Advertiser Portal</Text>
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
    paddingBottom: 70,
  },
  header: {
    marginBottom: 16,
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
  toast: {
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  toastText: {
    fontSize: 12,
    color: colors.greenDark,
    fontWeight: "800",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffc9c9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "700",
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  identityCopy: {
    flex: 1,
  },
  overline: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
  },
  userMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: colors.sage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  cardSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  typeChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  typeChipTextActive: {
    color: colors.surface,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.yellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
  supportCard: {
    backgroundColor: colors.sage,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.greenDark,
    marginBottom: 4,
  },
  supportBody: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
    marginBottom: 10,
  },
  supportMeta: {
    gap: 4,
  },
  metaItem: {
    fontSize: 11,
    color: colors.muted,
  },
  signOutBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.danger,
  },
});
