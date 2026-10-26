import { useTheme } from "@/context/ThemeContext";
import { ConsumedMeal } from "@/store/meals";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TodayConsumedListProps {
  consumedMeals: ConsumedMeal[];
  totalCalories: number;
  onRemoveItem: (id: string) => void;
}

export default function TodayConsumedList({
  consumedMeals,
  totalCalories,
  onRemoveItem,
}: TodayConsumedListProps) {
  const { colors } = useTheme();

  if (consumedMeals.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
          },
        ]}
      >
        <Ionicons name="fast-food-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          SIN REGISTROS HOY
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Selecciona "+ Comer" en el catálogo o usa el escáner IA para sumar calorías.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            REGISTRADO HOY ({consumedMeals.length})
          </Text>
        </View>
        <View
          style={[
            styles.calorieBadge,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.calorieBadgeText, { color: colors.primary }]}>
            {totalCalories} KCAL
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {consumedMeals.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
              },
            ]}
          >
            <View style={styles.itemInfo}>
              <Ionicons
                name={(item.icon || "restaurant") as any}
                size={20}
                color={colors.primary}
              />
              <View style={styles.textColumn}>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.itemSubtext, { color: colors.textSecondary }]}>
                  {item.timestamp} • {item.calories} kcal ({item.protein}g P / {item.carbs}g C / {item.fat}g G)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onRemoveItem(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.delete} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
  },
  calorieBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  calorieBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  textColumn: {
    flex: 1,
  },
  itemName: {
    fontWeight: "900",
    fontSize: 14,
  },
  itemSubtext: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 4,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
