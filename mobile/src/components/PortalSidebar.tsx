import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { colors } from "../theme/colors";
import { storageService } from "../services/storage";

export type PortalTab = "dashboard" | "campaigns" | "create" | "billing" | "profile";

interface Props {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onSignOut: () => void;
}

interface NavItem {
  id: PortalTab;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "campaigns", label: "My advertisements", icon: "▣" },
  { id: "create", label: "Create a new ad", icon: "+" },
  { id: "billing", label: "Payments & history", icon: "₹" },
  { id: "profile", label: "Profile", icon: "○" },
];

export const PortalSidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onSignOut,
}) => {
  const { width } = useWindowDimensions();
  const profile = storageService.getProfile();
  const isCompact = width < 1000;

  const initials =
    (profile.businessName || profile.accountName || "AD")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "DA";

  const renderNavButtons = (showLabels: boolean, compact = false) => (
    <View style={compact ? styles.compactNavList : styles.navList}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.navItem,
              compact && styles.compactNavItem,
              isActive && styles.navItemActive,
            ]}
            onPress={() => {
              onSelectTab(item.id);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <View
              style={[
                styles.iconWrap,
                isActive && styles.iconWrapActive,
              ]}
            >
              <Text
                style={[
                  styles.navIcon,
                  isActive && styles.navIconActive,
                ]}
              >
                {item.icon}
              </Text>
            </View>

            {showLabels && (
              <Text
                style={[
                  styles.navLabel,
                  compact && styles.compactNavLabel,
                  isActive && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (isCompact) {
    return (
      <View style={styles.compactNavigation}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.compactScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {renderNavButtons(true, true)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.sidebarContainer, { width: 220 }]}>
      <Text style={styles.sidebarLabel}>ADVERTISER PORTAL</Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderNavButtons(true)}
      </ScrollView>

      {/* Account info matching website */}
      <View style={styles.accountBox}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName} numberOfLines={1}>
            {profile.businessName || "Advertiser"}
          </Text>
          <Text style={styles.accountWorkspace}>Campaign workspace</Text>
        </View>
      </View>

      {/* Sign out matching website */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={onSignOut}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    paddingTop: 16,
    paddingHorizontal: 10,
    height: "100%",
  },
  sidebarLabel: {
    color: colors.muted,
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  navList: {
    gap: 4,
  },
  compactNavigation: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  compactScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compactNavList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  compactNavItem: {
    minHeight: 38,
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  compactNavLabel: {
    flex: 0,
    fontSize: 11,
  },
  navItemActive: {
    backgroundColor: colors.yellow,
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {},
  navIcon: {
    fontSize: 16,
    color: "#536459",
    fontWeight: "700",
  },
  navIconActive: {
    color: colors.ink,
    fontWeight: "900",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#536459",
    flex: 1,
  },
  navLabelActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  accountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 8,
  },
  accountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  accountName: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  accountWorkspace: {
    fontSize: 10,
    color: colors.muted,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  logoutIcon: {
    fontSize: 15,
    color: colors.muted,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },

});
