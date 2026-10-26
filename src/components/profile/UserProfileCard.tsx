import { useTheme } from "@/context/ThemeContext";
import { UserProfile } from "@/store/userProfile";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserProfileCardProps {
  userProfile: UserProfile;
  sexo?: string;
  edad?: number;
  onEdit: () => void;
}

export default function UserProfileCard({
  userProfile,
  sexo = "Atleta",
  edad = 18,
  onEdit,
}: UserProfileCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <View
      style={[
        globalStyles.card,
        styles.card,
        {
          borderColor: colors.primary + "30",
        },
      ]}
    >
      <View style={styles.leftRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              userProfile.photoUri
                ? { uri: userProfile.photoUri }
                : require("@/assets/images/profile.jpeg")
            }
            style={[
              styles.avatarImage,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.sparkleBadge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.surface,
              },
            ]}
          >
            <Ionicons name="sparkles" size={10} color={colors.background} />
          </View>
        </View>

        <View style={styles.nameColumn}>
          <Text
            style={[styles.nameText, { color: colors.text }]}
            numberOfLines={1}
          >
            {userProfile.name || "Atleta"}
          </Text>
          <View style={styles.tag}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
              {sexo} • {edad} años
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={onEdit}
        style={[
          styles.editButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary + "40",
          },
        ]}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="pencil" size={13} color={colors.primary} />
        <Text style={[styles.editButtonText, { color: colors.primary }]}>
          Editar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    marginRight: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
  },
  sparkleBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  nameColumn: {
    flex: 1,
  },
  nameText: {
    fontSize: 19,
    fontWeight: "bold",
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },
  editButtonText: {
    fontWeight: "bold",
    fontSize: 12,
  },
});
