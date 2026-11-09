import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { AdroverLogo } from "./AdroverLogo";

interface Props {
  onSignOut: () => void;
}

export const PortalHeader: React.FC<Props> = ({ onSignOut }) => {
  const insets = useSafeAreaInsets();

  // Compute safe top inset so the header never overlaps with battery, time or notch
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : 0
  );

  return (
    <View style={[styles.wrapper, { paddingTop: safeTop }]}>
      <View style={styles.topbar}>
        <View style={styles.logoWrap}>
          <AdroverLogo size="sm" />
        </View>

        <View style={styles.rightInfo}>
          <View style={styles.portalBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.portalBadgeText}>Advertiser portal</Text>
          </View>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={onSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.exitBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    width: "100%",
  },
  topbar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#eef7ed",
    borderWidth: 1,
    borderColor: "#d2e5d1",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  portalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#286d41",
  },
  exitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  exitBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
});
