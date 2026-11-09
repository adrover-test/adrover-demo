import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, LayoutChangeEvent } from "react-native";
import Svg, { Rect, Text as SvgText, Path, G, Circle } from "react-native-svg";
import { colors } from "../theme/colors";

interface Props {
  currentStep: number; // 1 to 5
  totalSteps?: number; // default 5
}

export const AnimatedRoadCab: React.FC<Props> = ({
  currentStep,
  totalSteps = 5,
}) => {
  const [trackWidth, setTrackWidth] = React.useState(320);

  // Animated drive position (0 to 1)
  const driveAnim = useRef(new Animated.Value((currentStep - 0.5) / totalSteps)).current;
  // Bobbing animation up and down (driving over road)
  const bobAnim = useRef(new Animated.Value(0)).current;
  // Wheel spinning animation
  const wheelAnim = useRef(new Animated.Value(0)).current;

  // Animate car position when step changes
  useEffect(() => {
    const targetProgress = (currentStep - 0.5) / totalSteps;
    Animated.timing(driveAnim, {
      toValue: targetProgress,
      duration: 850,
      easing: Easing.bezier(0.3, 0.7, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  // Start continuous driving bob & wheel spin animations
  useEffect(() => {
    // Bobbing animation: up and down 2px
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -2.5,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bobLoop.start();

    // Wheel spin animation: 360 deg
    const wheelLoop = Animated.loop(
      Animated.timing(wheelAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    wheelLoop.start();

    return () => {
      bobLoop.stop();
      wheelLoop.stop();
    };
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTrackWidth(w);
  };

  // Car horizontal position from left: 0 to trackWidth - 68
  const carLeft = driveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(trackWidth - 72, 50)],
  });

  // Road fill width
  const roadFillWidth = driveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["10%", "100%"],
  });

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Step Heading matching website */}
      <View style={styles.headingRow}>
        <Text style={styles.headingLabel}>ONBOARDING ROUTE</Text>
        <Text style={styles.stepCounter}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Road & Driving Cab */}
      <View style={styles.roadTrack}>
        {/* Road Base with Dashed Markings */}
        <View style={styles.roadDashesContainer}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.dashLine} />
          ))}
        </View>

        {/* Road Fill Progress Line */}
        <Animated.View
          style={[
            styles.roadFill,
            { width: roadFillWidth },
          ]}
        />

        {/* Animated Yellow Adrover Taxi Cab */}
        <Animated.View
          style={[
            styles.cabWrapper,
            {
              left: carLeft,
              transform: [{ translateY: bobAnim }],
            },
          ]}
        >
          {/* Exact SVG Adrover Cab matching website AdvertiserRegistration.tsx */}
          <Svg viewBox="0 0 96 52" width={68} height={37}>
            {/* Green Rooftop Digital Ad Screen */}
            <Rect x="30" y="1" width="36" height="15" rx="3" fill="#087a45" />
            <SvgText
              x="48"
              y="12"
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#ffd21c"
              fontFamily="Arial, sans-serif"
            >
              AD
            </SvgText>

            {/* Mount Rack */}
            <Rect x="46" y="16" width="4" height="5" fill="#101814" />

            {/* Aerodynamic Yellow Taxi Cab Body */}
            <Path
              d="M10 38 L14 28 Q18 21 28 21 H66 Q76 21 81 28 L88 34 Q92 35 92 40 V42 H6 V40 Q6 38 10 38 Z"
              fill="#ffd21c"
              stroke="#101814"
              strokeWidth="2"
            />

            {/* Windows */}
            <Path d="M24 28 Q27 24 33 24 H46 V31 H22 Z" fill="#dff1f8" />
            <Path d="M50 24 H64 Q70 24 74 31 H50 Z" fill="#dff1f8" />

            {/* Left Wheel */}
            <G>
              <Circle cx="25" cy="43" r="7" fill="#101814" />
              <Circle cx="25" cy="43" r="2.5" fill="#f8f7f1" />
              <Rect x="24" y="37" width="2" height="3" fill="#f8f7f1" />
            </G>

            {/* Right Wheel */}
            <G>
              <Circle cx="73" cy="43" r="7" fill="#101814" />
              <Circle cx="73" cy="43" r="2.5" fill="#f8f7f1" />
              <Rect x="72" y="37" width="2" height="3" fill="#f8f7f1" />
            </G>
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  headingLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.green,
    letterSpacing: 1,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  roadTrack: {
    position: "relative",
    height: 48,
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  roadDashesContainer: {
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dashLine: {
    width: 12,
    height: 3,
    backgroundColor: colors.line,
    borderRadius: 2,
  },
  roadFill: {
    position: "absolute",
    bottom: 2,
    left: 0,
    height: 4,
    backgroundColor: colors.green,
    borderRadius: 2,
  },
  cabWrapper: {
    position: "absolute",
    bottom: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
