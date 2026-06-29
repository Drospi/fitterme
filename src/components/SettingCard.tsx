import { colors, globalStyles } from "@/styles/global";
import { Href, Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SettingCardProps = {
  title: string;
  value: string;
  link?: Href;
};

const SettingCard = ({ title, value, link }: SettingCardProps) => {
  return (
    <Link href={link || "/settings/settings"} asChild>
      <TouchableOpacity>
        <View style={styles.selection}>
          <Text style={styles.textSelection}>{title}</Text>
          <Text style={styles.textSelection}>{value}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: globalStyles.container.backgroundColor,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    left: -8,
  },
  selection: {
    fontSize: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  textSelection: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
});

export default SettingCard;
