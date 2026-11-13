import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";
import { AdroverLogo } from "../components/AdroverLogo";

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : 0
  );
  const safeBottom = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 54 : 20
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid business email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    storageService.setLoggedIn(true);
    navigation.replace("Main");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: safeTop }]} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: safeBottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo Bar */}
          <View style={styles.topLogo}>
            <AdroverLogo size="md" />
          </View>

          {/* Intro Hero Section (mirroring website Login.tsx) */}
          <View style={styles.introCard}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>HYDERABAD, FIRST</Text>
            </View>
            <Text style={styles.introTitle}>Bring your brand along for the ride.</Text>
            <Text style={styles.introSubtitle}>
              Plan a campaign for the everyday journeys happening across Hyderabad.
            </Text>

            {/* 01 & 02 Highlights */}
            <View style={styles.highlightsContainer}>
              <View style={styles.highlightItem}>
                <View style={styles.numberIcon}>
                  <Text style={styles.numberIconText}>01</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightTitle}>Plan with clarity</Text>
                  <Text style={styles.highlightDesc}>
                    Explore campaign planning and performance.
                  </Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <View style={styles.numberIcon}>
                  <Text style={styles.numberIconText}>02</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightTitle}>Plan your creative</Text>
                  <Text style={styles.highlightDesc}>
                    Try a video or banner before you launch.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form Panel (mirroring website login-form-panel) */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.eyebrow}>ADVERTISER PORTAL</Text>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>
                Sign in to manage your advertisements, campaign details and billing.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Business email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <Text style={styles.fineText}>Session lasts for this mobile session</Text>
              <TouchableOpacity onPress={() => alert("Helpline: +91 40 4859 2100 | support@adrover.in")}>
                <Text style={styles.helpLink}>Need help?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Enter advertiser portal</Text>
            </TouchableOpacity>

            <View style={styles.createRow}>
              <Text style={styles.createText}>Are you a driver?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("DriverLogin")}>
                <Text style={styles.createLink}>Driver sign in</Text>
              </TouchableOpacity>
            </View>

            {/* New to Adrover */}
            <View style={styles.createRow}>
              <Text style={styles.createText}>New to Adrover?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.createLink}>Plan a campaign →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 32,
  },
  topLogo: {
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 4,
  },
  introCard: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  badgePill: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.6,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    lineHeight: 24,
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
    marginBottom: 14,
  },
  highlightsContainer: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  numberIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  numberIconText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.green,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  highlightDesc: {
    fontSize: 11,
    color: colors.muted,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  formHeader: {
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.green,
    letterSpacing: 1,
    marginBottom: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  toggleBtn: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  fineText: {
    fontSize: 11,
    color: colors.muted,
  },
  helpLink: {
    fontSize: 11,
    color: colors.green,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtnText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  createRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  createText: {
    fontSize: 12,
    color: colors.muted,
  },
  createLink: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
    textDecorationLine: "underline",
  },
});
