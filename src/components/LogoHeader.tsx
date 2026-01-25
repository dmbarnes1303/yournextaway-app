import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  size?: "sm" | "md";
};

const LOGO = require("../yna-logo.png");

export default function LogoHeader({ title, subtitle, size = "md" }: Props) {
  const badgeSize = size === "sm" ? 42 : 54;
  const logoSize = size === "sm" ? 24 : 34;

  return (
    <View style={styles.wrap}>
      <View style={[styles.logoBadge, { width: badgeSize, height: badgeSize }]}>
        <Image source={LOGO} style={{ width: logoSize, height: logoSize, resizeMode: "contain" }} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.euPins}>
          <View style={styles.pinGreen} />
          <View style={styles.pinBlue} />
          <View style={styles.pinGold} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 12 },

  logoBadge: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  title: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xl },
  subtitle: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.sm },

  euPins: { marginTop: 6, flexDirection: "row", gap: 6, alignItems: "center" },
  pinGreen: { width: 22, height: 4, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.70)" },
  pinBlue: { width: 16, height: 4, borderRadius: 999, backgroundColor: "rgba(0, 92, 175, 0.55)" },
  pinGold: { width: 12, height: 4, borderRadius: 999, backgroundColor: "rgba(255, 196, 46, 0.60)" },
});
