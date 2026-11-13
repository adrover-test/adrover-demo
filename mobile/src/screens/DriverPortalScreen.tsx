import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { PortalHeader } from "../components/PortalHeader";
import {
  DriverLang,
  LANGUAGES,
  demoAds,
  demoDriver,
  demoEarnings,
  demoHistory,
  demoPayments,
  driverText,
} from "../services/driverDemo";

interface Props {
  navigation: any;
}

type Tab = "home" | "ads" | "earnings" | "profile" | "support";
const TABS: Tab[] = ["home", "ads", "earnings", "profile", "support"];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const DriverPortalScreen: React.FC<Props> = ({ navigation }) => {
  const [tab, setTab] = useState<Tab>("home");
  const [lang, setLang] = useState<DriverLang>("en");
  const t = driverText[lang];
  const played = demoAds.reduce((s, a) => s + a.plays, 0);

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const AdsTable = () => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{t.ads}</Text>
      {demoAds.map((ad) => (
        <View key={ad.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{ad.name}</Text>
            <Text style={styles.rowSub}>
              {ad.time} · {ad.plays}
            </Text>
          </View>
          <View style={[styles.badge, ad.status === "Scheduled" && styles.badgeWait]}>
            <Text style={styles.badgeText}>{ad.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const max = Math.max(...demoHistory);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <PortalHeader
        onSignOut={() => navigation.replace("DriverLogin")}
        label="Driver portal"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navBar}>
        {TABS.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setTab(k)}
            style={[styles.navItem, tab === k && styles.navItemActive]}
          >
            <Text style={[styles.navText, tab === k && styles.navTextActive]}>{t[k]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>DRIVER PORTAL</Text>
        <Text style={styles.heading}>
          {t.hello}, {demoDriver.name}
        </Text>

        {tab === "home" && (
          <>
            <View style={styles.stats}>
              <Stat label={t.adsToday} value={String(demoAds.length)} />
              <Stat label={t.played} value={String(played)} />
              <Stat label={t.thisMonth} value={inr(demoEarnings.month)} />
              <Stat label={t.pending} value={inr(demoEarnings.pending)} />
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t.chart}</Text>
              <View style={styles.chart}>
                {demoHistory.map((v, i) => (
                  <View key={i} style={styles.barWrap}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(6, (v / max) * 110) },
                        i === demoHistory.length - 1 && styles.barToday,
                      ]}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.rowSub}>{t.today}: {demoHistory[demoHistory.length - 1]}</Text>
            </View>
            <AdsTable />
          </>
        )}

        {tab === "ads" && <AdsTable />}

        {tab === "earnings" && (
          <>
            <View style={styles.stats}>
              <Stat label={t.thisMonth} value={inr(demoEarnings.month)} />
              <Stat label={t.pending} value={inr(demoEarnings.pending)} />
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t.payments}</Text>
              {demoPayments.map((p) => (
                <View key={p.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{p.month}</Text>
                    <Text style={styles.rowSub}>{inr(p.amount)}</Text>
                  </View>
                  <View style={[styles.badge, p.status === "Pending" && styles.badgeWait]}>
                    <Text style={styles.badgeText}>{p.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === "profile" && (
          <View style={styles.panel}>
            <Text style={styles.rowSub}>{t.vehicle}</Text>
            <Text style={styles.rowTitle}>{demoDriver.vehicle}</Text>
            <Text style={[styles.rowSub, { marginTop: 10 }]}>{t.phone}</Text>
            <Text style={styles.rowTitle}>+91 98XXXXXX21</Text>
            <Text style={[styles.rowSub, { marginTop: 10 }]}>{t.language}</Text>
            <View style={styles.langRow}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  onPress={() => setLang(l.code)}
                  style={[styles.navItem, lang === l.code && styles.navItemActive]}
                >
                  <Text style={[styles.navText, lang === l.code && styles.navTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === "support" && (
          <View style={styles.panel}>
            <Text style={styles.rowTitle}>{t.helpText}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  navBar: {
    flexGrow: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  navItemActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  navText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  navTextActive: { color: colors.ink },
  content: { padding: 16, paddingBottom: 60 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.green, letterSpacing: 1 },
  heading: { fontSize: 24, fontWeight: "900", color: colors.ink, marginBottom: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  stat: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "700" },
  statValue: { fontSize: 22, fontWeight: "900", color: colors.ink, marginTop: 4 },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
  },
  panelTitle: { fontSize: 16, fontWeight: "900", color: colors.ink, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowTitle: { fontSize: 14, fontWeight: "800", color: colors.ink },
  rowSub: { fontSize: 12, color: colors.muted },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.greenLight,
  },
  badgeWait: { backgroundColor: colors.yellowLight },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.greenDark },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 4,
    marginBottom: 8,
  },
  barWrap: { flex: 1, justifyContent: "flex-end" },
  bar: { backgroundColor: colors.green, borderRadius: 4, opacity: 0.75 },
  barToday: { backgroundColor: colors.yellow, opacity: 1 },
  langRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
});
