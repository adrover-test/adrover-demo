import React, { useState } from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";
import { PortalHeader } from "../components/PortalHeader";
import { PortalSidebar, PortalTab } from "../components/PortalSidebar";

import { DashboardScreen } from "./DashboardScreen";
import { CampaignsScreen } from "./CampaignsScreen";
import { CreateAdScreen } from "./CreateAdScreen";
import { BillingScreen } from "./BillingScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ViewAdScreen } from "./ViewAdScreen";
import { Advertisement } from "../types";

interface Props {
  navigation: any;
  route?: any;
}

export const PortalScreen: React.FC<Props> = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 1000;
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 48 : 16
  );
  const initialTab: PortalTab = route?.params?.initialTab || "dashboard";
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [viewingAd, setViewingAd] = useState<Advertisement | null>(null);

  const handleSelectTab = (tab: PortalTab) => {
    setViewingAd(null);
    setActiveTab(tab);
  };

  const handleSignOut = () => {
    storageService.setLoggedIn(false);
    navigation.replace("Login");
  };

  // Navigation adapter for child screens
  const childNavigation = {
    navigate: (screenName: string, params?: any) => {
      switch (screenName) {
        case "Dashboard":
        case "Home":
          setViewingAd(null);
          setActiveTab("dashboard");
          break;
        case "Campaigns":
        case "Advertisements":
        case "Ads":
          setViewingAd(null);
          setActiveTab("campaigns");
          break;
        case "CreateAd":
        case "Create":
          setViewingAd(null);
          setActiveTab("create");
          break;
        case "Billing":
        case "Payments":
          setViewingAd(null);
          setActiveTab("billing");
          break;
        case "Profile":
          setViewingAd(null);
          setActiveTab("profile");
          break;
        case "ViewAd":
        case "View":
          if (params?.ad || params?.advertisement) {
            setViewingAd(params?.ad || params?.advertisement);
          }
          break;
        default:
          navigation.navigate(screenName, params);
      }
    },
    replace: (screenName: string, params?: any) => {
      if (screenName === "Login") {
        handleSignOut();
      } else {
        navigation.replace(screenName, params);
      }
    },
    goBack: () => {
      setActiveTab("dashboard");
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      {/* Top Bar matching website portal-topbar */}
      <PortalHeader onSignOut={handleSignOut} />

      {/* Main Layout Row: Sidebar at Left + Content on Right */}
      <View style={[styles.bodyRow, isCompact && styles.bodyColumn]}>
        {/* Navigation Bar docked at the SIDE on Mobile, Tablet, PC & TV */}
        <PortalSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSignOut={handleSignOut}
        />

        {/* Content Panel with clearance above phone Back button */}
        <View style={[styles.contentPanel, { paddingBottom: safeBottom }]}>
          {viewingAd ? (
            <ViewAdScreen
              advertisement={viewingAd}
              navigation={childNavigation}
              onBack={() => setViewingAd(null)}
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardScreen navigation={childNavigation} showHeader={false} />
              )}
              {activeTab === "campaigns" && (
                <CampaignsScreen navigation={childNavigation} />
              )}
              {activeTab === "create" && (
                <CreateAdScreen navigation={childNavigation} />
              )}
              {activeTab === "billing" && <BillingScreen />}
              {activeTab === "profile" && (
                <ProfileScreen navigation={childNavigation} />
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  bodyRow: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  bodyColumn: {
    flexDirection: "column",
  },
  contentPanel: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
