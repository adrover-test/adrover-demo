import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  brand: string;
  headline: string;
  subtext: string;
  bgColor?: string;
  aspect?: string;
  bannerUri?: string;
}

export const CabScreenPreview: React.FC<Props> = ({
  brand,
  headline,
  subtext,
  bgColor = "#087a45",
  aspect = "16:9 Digital LED",
  bannerUri,
}) => {
  const [viewMode, setViewMode] = useState<"screen" | "cab">("cab");

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.headerDot}>●</Text>
          <Text style={styles.headerText}>ADROVER HYDERABAD FLEET</Text>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "cab" && styles.toggleBtnActive]}
            onPress={() => setViewMode("cab")}
          >
            <Text style={[styles.toggleBtnText, viewMode === "cab" && styles.toggleBtnTextActive]}>
              Cab In-Transit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "screen" && styles.toggleBtnActive]}
            onPress={() => setViewMode("screen")}
          >
            <Text style={[styles.toggleBtnText, viewMode === "screen" && styles.toggleBtnTextActive]}>
              LED Panel
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "cab" ? (
        /* Real Cab Photo Frame matching website hyderabad-cab-hero.jpg */
        <View style={styles.cabFrameWrapper}>
          <Image
            source={require("../../assets/hyderabad-cab-hero.jpg")}
            style={styles.cabHeroImage}
            resizeMode="cover"
          />

          {/* In-Cab Digital Screen Inset */}
          <View style={[styles.cabDigitalInset, { backgroundColor: bgColor }]}>
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}

            <View style={bannerUri ? styles.imageOverlay : undefined}>
              <Text style={styles.brandText}>{brand.toUpperCase()}</Text>
              <Text style={styles.headlineTextSmall} numberOfLines={2}>
                {headline}
              </Text>
              <Text style={styles.subtextTextSmall} numberOfLines={1}>
                {subtext}
              </Text>
            </View>

            <View style={styles.liveOverlayBadge}>
              <Text style={styles.liveOverlayText}>● LIVE GPS</Text>
            </View>
          </View>
        </View>
      ) : (
        /* Standalone 16:9 Rooftop LED Screen Mockup */
        <View>
          <View style={[styles.screenBox, { backgroundColor: bgColor }]}>
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={styles.screenImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={bannerUri ? styles.screenImageOverlay : undefined}>
              <Text style={styles.brandText}>{brand.toUpperCase()}</Text>
              <Text style={styles.headlineText} numberOfLines={2}>
                {headline}
              </Text>
              <Text style={styles.subtextText} numberOfLines={2}>
                {subtext}
              </Text>
            </View>
            <Text style={styles.cityPill}>ADROVER HYDERABAD</Text>
          </View>

          {/* Cab Roof Mount Rack */}
          <View style={styles.roofMount}>
            <View style={styles.mountLeg} />
            <View style={styles.mountBar} />
            <View style={styles.mountLeg} />
          </View>
        </View>
      )}

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          Real-time GPS verified digital transit screens deployed across Hyderabad smart cabs.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111a14",
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: "#233428",
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerDot: {
    color: colors.yellow,
    fontSize: 10,
  },
  headerText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#1b2a20",
    borderRadius: 6,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: colors.yellow,
  },
  toggleBtnText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a4bea8",
  },
  toggleBtnTextActive: {
    color: colors.ink,
    fontWeight: "900",
  },
  cabFrameWrapper: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0d1610",
  },
  cabHeroImage: {
    width: "100%",
    height: "100%",
  },
  cabDigitalInset: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  imageOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 4,
  },
  brandText: {
    color: colors.yellow,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headlineTextSmall: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
    lineHeight: 15,
  },
  subtextTextSmall: {
    color: "#f8f7f1",
    fontSize: 10,
    opacity: 0.9,
  },
  liveOverlayBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveOverlayText: {
    color: "#4ade80",
    fontSize: 8,
    fontWeight: "800",
  },
  screenBox: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.yellow,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  screenImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  screenImageOverlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  headlineText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 18,
  },
  subtextText: {
    color: "#f8f7f1",
    fontSize: 11,
    textAlign: "center",
    opacity: 0.9,
  },
  cityPill: {
    position: "absolute",
    bottom: 6,
    right: 8,
    color: colors.yellow,
    fontSize: 8,
    fontWeight: "700",
  },
  roofMount: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    gap: 20,
  },
  mountLeg: {
    width: 24,
    height: 6,
    backgroundColor: "#39483d",
    borderRadius: 2,
  },
  mountBar: {
    width: 80,
    height: 3,
    backgroundColor: "#2c3b30",
  },
  footerNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1d2e22",
  },
  footerNoteText: {
    fontSize: 9,
    color: "#a4bea8",
    textAlign: "center",
  },
});
