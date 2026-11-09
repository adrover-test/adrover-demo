import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export const TransitRadarMap: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.liveDot} />
          <Text style={styles.title}>LIVE TRANSIT FLEET RADAR</Text>
        </View>
        <Text style={styles.cityBadge}>HYDERABAD METRO</Text>
      </View>

      <View style={styles.mapCanvas}>
        {/* Route Lines representation */}
        <View style={styles.roadLine1} />
        <View style={styles.roadLine2} />

        {/* Corridor Waypoints */}
        <View style={[styles.node, { top: 20, left: 24 }]}>
          <Text style={styles.nodeText}>HITEC CITY</Text>
        </View>
        <View style={[styles.node, { top: 12, right: 30 }]}>
          <Text style={styles.nodeText}>JUBILEE HILLS</Text>
        </View>
        <View style={[styles.node, { bottom: 20, left: 60 }]}>
          <Text style={styles.nodeText}>GACHIBOWLI</Text>
        </View>
        <View style={[styles.node, { bottom: 15, right: 24 }]}>
          <Text style={styles.nodeText}>SECUNDERABAD</Text>
        </View>

        {/* Active Cabs */}
        <View style={[styles.cabMarker, { top: 40, left: "45%" }]}>
          <Text style={styles.cabIcon}>🚕</Text>
        </View>
        <View style={[styles.cabMarker, { top: 65, left: "25%" }]}>
          <Text style={styles.cabIcon}>🚕</Text>
        </View>
        <View style={[styles.cabMarker, { top: 55, right: "30%" }]}>
          <Text style={styles.cabIcon}>🚕</Text>
        </View>
      </View>

      <View style={styles.footerFeed}>
        <Text style={styles.footerFeedIcon}>📡</Text>
        <Text style={styles.footerFeedText}>
          <Text style={{ fontWeight: "700", color: "#fff" }}>142 Cabs Online: </Text>
          Broadcasting across Cyber Towers & Outer Ring Road
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#142017",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#233729",
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  title: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cityBadge: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "700",
  },
  mapCanvas: {
    height: 120,
    backgroundColor: "#0b140e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a2a1d",
    position: "relative",
    overflow: "hidden",
  },
  roadLine1: {
    position: "absolute",
    top: 55,
    left: 10,
    right: 10,
    height: 8,
    backgroundColor: "#1d3823",
    borderRadius: 4,
  },
  roadLine2: {
    position: "absolute",
    top: 20,
    bottom: 20,
    left: "50%",
    width: 6,
    backgroundColor: "#1d3823",
    borderRadius: 3,
  },
  node: {
    position: "absolute",
    backgroundColor: "rgba(8, 122, 69, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2a5435",
  },
  nodeText: {
    color: "#a4bea8",
    fontSize: 9,
    fontWeight: "700",
  },
  cabMarker: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  cabIcon: {
    fontSize: 12,
  },
  footerFeed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  footerFeedIcon: {
    fontSize: 12,
  },
  footerFeedText: {
    color: "#a4bea8",
    fontSize: 11,
    flex: 1,
  },
});
