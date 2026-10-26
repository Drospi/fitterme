import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Popover from "react-native-popover-view";

export interface ThemedInfoPopoverProps {
  title: string;
  content: string;
  icon?: keyof typeof Ionicons.glyphMap;
  triggerIcon?: keyof typeof Ionicons.glyphMap;
  triggerColor?: string;
  colors: any;
}

export default function ThemedInfoPopover({
  title,
  content,
  icon = "information-circle",
  triggerIcon = "information-circle-outline",
  triggerColor,
  colors,
}: ThemedInfoPopoverProps) {
  return (
    <Popover
      popoverStyle={[
        styles.popover,
        {
          backgroundColor: colors.surface,
        },
      ]}
      from={
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.trigger,
            {
              backgroundColor: (triggerColor || colors.primary) + "18",
            },
          ]}
        >
          <Ionicons
            name={triggerIcon}
            size={16}
            color={triggerColor || colors.primary}
          />
        </TouchableOpacity>
      }
    >
      <View
        style={[
          styles.contentWrapper,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Ionicons
            name={icon}
            size={18}
            color={triggerColor || colors.primary}
          />
          <Text
            style={[
              styles.popoverTitle,
              { color: colors.text },
            ]}
          >
            {title}
          </Text>
        </View>
        <Text
          style={[
            styles.popoverContent,
            { color: colors.textSecondary },
          ]}
        >
          {content}
        </Text>
      </View>
    </Popover>
  );
}

const styles = StyleSheet.create({
  popover: {
    borderRadius: 14,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  trigger: {
    padding: 3,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapper: {
    padding: 14,
    maxWidth: 280,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  popoverTitle: {
    fontWeight: "bold",
    fontSize: 14,
    flexShrink: 1,
  },
  popoverContent: {
    fontSize: 12,
    lineHeight: 18,
  },
});
