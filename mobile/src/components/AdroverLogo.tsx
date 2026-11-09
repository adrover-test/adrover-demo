import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../theme/colors";

interface Props {
  size?: "sm" | "md" | "lg";
  light?: boolean;
  showText?: boolean;
}

export const AdroverLogo: React.FC<Props> = ({
  size = "md",
  light = false,
  showText = true,
}) => {
  const iconSize = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const fontSize = size === "sm" ? 17 : size === "lg" ? 26 : 21;

  return (
    <View style={styles.container}>
      {/* Exact Adrover Brand Crest SVG */}
      <Svg viewBox="0 0 40 40" width={iconSize} height={iconSize} aria-hidden={true}>
        <Path d="M0 37 14 2h12l14 35H28L20 14 12 37Z" fill="#ffd21c" />
        <Path d="M18 25h4l3 8H15Z" fill="#101814" />
      </Svg>

      {showText && (
        <Text
          style={[
            styles.brandText,
            { fontSize, color: light ? "#ffffff" : colors.ink },
          ]}
        >
          adrover<Text style={styles.dot}>.</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  dot: {
    color: colors.yellow,
    fontStyle: "italic",
    fontWeight: "900",
  },
});
