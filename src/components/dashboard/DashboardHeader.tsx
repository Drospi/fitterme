import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { UserProfile } from "@/store/userProfile";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface DashboardHeaderProps {
  userProfile: UserProfile;
  trainedDays: number;
  shareText: string;
}

export default function DashboardHeader({
  userProfile,
  trainedDays,
  shareText,
}: DashboardHeaderProps) {
  const { colors } = useTheme();

  // Fecha en español formateada: "Lunes, 4 de mayo"
  const rawDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const userName = userProfile.name?.trim() ? userProfile.name : "Diego";

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        <View style={styles.avatarWrapper}>
          <Image
            style={[styles.avatar, { borderColor: colors.primary }]}
            source={
              userProfile.photoUri
                ? { uri: userProfile.photoUri }
                : require("@/assets/images/profile.jpeg")
            }
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
          <Text
            style={[styles.greetingText, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Bienvenido, {userName}
          </Text>

          {/* Días entrenando en lugar de racha */}
          <View
            style={[
              styles.trainedBadge,
              {
                backgroundColor: colors.cardHighlight,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="barbell" size={14} color={colors.primary} />
            <Text style={[styles.trainedText, { color: colors.primary }]}>
              {trainedDays > 0
                ? `${trainedDays} ${trainedDays === 1 ? "día entrenando" : "días entrenando"}`
                : "0 días entrenando • ¡Empieza hoy!"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightActions}>
        <ShareButton text={shareText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  trainedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  trainedText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rightActions: {
    marginLeft: 8,
  },
});
