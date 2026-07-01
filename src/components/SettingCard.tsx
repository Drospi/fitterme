import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Href, Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
type SettingCardProps = {
  title: string;
  value: string;
  link?: Href;
};

const SettingCard = ({ title, value, link }: SettingCardProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <Link
      href={{
        pathname: (link || "/settings/settings") as any,
        params: { title: title, value: value },
      }}
      asChild
    >
      <TouchableOpacity>
        <View style={styles.selection}>
          <Text style={globalStyles.textSecondary}>{title}</Text>
          <Text style={globalStyles.textSecondary}>{value}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  selection: {
    fontSize: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },

  section: {
    marginBottom: 24,
  },
});

export default SettingCard;
