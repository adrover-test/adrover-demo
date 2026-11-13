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
import { AdroverLogo } from "../components/AdroverLogo";
import { DEMO_OTP } from "../services/driverDemo";

interface Props {
  navigation: any;
}

export const DriverLoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? RNStatusBar.currentHeight || 28 : 0
  );
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!otpSent) {
      if (!/^\d{10}$/.test(phone.trim())) {
        setError("Enter a valid 10-digit mobile number.");
        return;
      }
      setError("");
      setOtpSent(true);
      return;
    }
    if (otp.trim() !== DEMO_OTP) {
      setError("That code is not correct. Use the demo code shown below.");
      return;
    }
    setError("");
    navigation.replace("DriverMain");
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: safeTop }]}
      edges={["bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.topLogo}>
            <AdroverLogo size="md" />
          </View>

          <View style={styles.introCard}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>DRIVER PORTAL</Text>
            </View>
            <Text style={styles.introTitle}>Your ads, your earnings, one place.</Text>
            <Text style={styles.introSubtitle}>
              See today's ads, track plays and check payments in your language.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.eyebrow}>DRIVER PORTAL</Text>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>
              Sign in with your mobile number and a one-time code.
            </Text>

            <Text style={styles.label}>Mobile number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              editable={!otpSent}
            />

            {otpSent ? (
              <>
                <Text style={[styles.label, { marginTop: 14 }]}>One-time code</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.note}>
                  Demo mode: use code <Text style={styles.noteStrong}>{DEMO_OTP}</Text>
                </Text>
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>
                {otpSent ? "Enter driver portal" : "Send code"}
              </Text>
            </TouchableOpacity>

            <View style={styles.createRow}>
              <TouchableOpacity onPress={() => navigation.replace("Login")}>
                <Text style={styles.createLink}>← Advertiser sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 16, paddingBottom: 60 },
  topLogo: { alignItems: "center", marginBottom: 14, paddingVertical: 4 },
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
  badgePillText: { fontSize: 10, fontWeight: "800", color: colors.ink, letterSpacing: 0.6 },
  introTitle: { fontSize: 20, fontWeight: "900", color: colors.ink, lineHeight: 24, marginBottom: 6 },
  introSubtitle: { fontSize: 12, color: colors.muted, lineHeight: 16 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    elevation: 3,
  },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.green, letterSpacing: 1, marginBottom: 2 },
  formTitle: { fontSize: 20, fontWeight: "900", color: colors.ink, marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: colors.muted, lineHeight: 16, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: colors.ink, marginBottom: 6 },
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
  note: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.yellowLight,
    fontSize: 12,
    color: colors.muted,
  },
  noteStrong: { fontWeight: "900", color: colors.ink },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 10 },
  submitBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  createRow: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  createLink: { fontSize: 12, fontWeight: "800", color: colors.green, textDecorationLine: "underline" },
});
