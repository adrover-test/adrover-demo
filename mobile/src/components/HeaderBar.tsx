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
  businessName: string;
  onNotificationPress?: () => void;
}

export const HeaderBar: React.FC<Props> = ({ businessName, onNotificationPress }) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : 0
  );

  return (
    <View style={[styles.wrapper, { paddingTop: safeTop }]}>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          <AdroverLogo size="sm" />
        </View>

        <View style={styles.rightActions}>
          <View style={styles.portalBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.portalBadgeText}>Advertiser portal</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13 }}>🔔</Text>
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>3</Text>
            </View>
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
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  portalBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.green,
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.yellow,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.ink,
  },
});
