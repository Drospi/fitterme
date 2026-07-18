import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>Ajustes</Text>
        <Ionicons name="settings" size={24} color={colors.text} />
      </View>
      <ScrollView>
        <View style={{ marginVertical: 20 }}>
          <Text
            style={{ fontWeight: "bold", fontSize: 20, color: colors.primary }}
          >
            ENTRENAMIENTO
          </Text>
          <View style={[globalStyles.card, { marginTop: 10 }]}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons name="timer-outline" size={24} color={colors.text} />
                <Text style={globalStyles.text}>
                  Tiempo de descanso por defecto
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 20,
                  color: colors.primary,
                }}
              >
                90s
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons
                  name="briefcase-outline"
                  size={24}
                  color={colors.text}
                />
                <Text style={globalStyles.text}>Unidades de peso</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  style={{
                    marginRight: 10,
                    borderRadius: 5,
                    padding: 5,
                    paddingHorizontal: 10,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 20,
                      color: colors.background,
                    }}
                  >
                    Kg
                  </Text>
                </View>
                <View
                  style={{
                    marginRight: 10,
                    borderRadius: 5,
                    padding: 5,
                    paddingHorizontal: 10,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 20,
                      color: colors.primary,
                    }}
                  >
                    Lb
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ fontWeight: "bold", fontSize: 20, color: colors.primary }}
          >
            CUENTA Y DATOS
          </Text>
          <View style={[globalStyles.card, { paddingTop: 0, marginTop: 10 }]}>
            {[
              {
                icon: "person-outline",
                value: "Editar Perfil",
                link: "../measures/PersonalData",
              },
              {
                icon: "accessibility-outline",
                value: "Actualizar Medidas",
                link: "../measures/measures",
              },
              {
                icon: "analytics-outline",
                value: "Fijar Metas",
                link: "../measures/goals",
              },
            ].map((item, index) => (
              <View key={index} style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => router.push(item.link as Href)}
                >
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Ionicons name={item.icon} size={24} color={colors.text} />
                    <Text style={globalStyles.text}>{item.value}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ fontWeight: "bold", fontSize: 20, color: colors.primary }}
          >
            PREFERENCIAS
          </Text>
          <View style={[globalStyles.card, { paddingTop: 0, marginTop: 10 }]}>
            {[
              {
                icon: "notifications-outline",
                value: "Notificaciones",
                link: "./notifications",
              },
              {
                icon: "language-outline",
                value: "Idioma",
                link: "./language",
              },
              {
                icon: "color-palette-outline",
                value: "Tema",
                link: "./theme",
              },
            ].map((item, index) => (
              <View key={index} style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => router.push(item.link as Href)}
                >
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Ionicons name={item.icon} size={24} color={colors.text} />
                    <Text style={globalStyles.text}>{item.value}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
