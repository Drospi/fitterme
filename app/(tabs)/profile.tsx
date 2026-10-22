import MeasureItem from "@/components/MeasureItem";
import { useTheme } from "@/context/ThemeContext";
import {
  getLatestSanitizedMeasure,
  getMeasures,
  getSanitizedMeasuresSummary,
  Measure,
  MuscleSummary,
} from "@/store/measures";
import { getUserProfile, UserProfile } from "@/store/userProfile";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const MUSCLE_LIST: { key: keyof Measure; name: string }[] = [
  { key: "pecho", name: "Pecho" },
  { key: "cuello", name: "Cuello" },
  { key: "hombros", name: "Hombros" },
  { key: "biceps", name: "Bíceps" },
  { key: "antebrazo", name: "Antebrazo" },
  { key: "cintura", name: "Cintura" },
  { key: "cadera", name: "Cadera" },
  { key: "cuadriceps", name: "Cuádriceps" },
  { key: "gemelos", name: "Gemelos" },
  { key: "gluteos", name: "Glúteos" },
  { key: "espalda", name: "Espalda" },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Atleta",
    photoUri: null,
  });
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [sanitizedSummary, setSanitizedSummary] = useState<
    Record<string, MuscleSummary>
  >({});
  const [latestValid, setLatestValid] = useState<Measure | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadData = async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
    const data = await getMeasures();
    setMeasures(data);
    const summary = await getSanitizedMeasuresSummary();
    setSanitizedSummary(summary);
    const valid = await getLatestSanitizedMeasure();
    setLatestValid(valid);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const latest = measures[0];

  // Músculos activos con al menos una medida registrada
  const activeMuscles = useMemo(() => {
    return MUSCLE_LIST.filter((muscle) => {
      const item = sanitizedSummary[muscle.key];
      return item && item.latest && item.latest > 0;
    });
  }, [sanitizedSummary]);

  // Ordenar por impacto (cambio absoluto entre medida actual y previa)
  const sortedByImpact = useMemo(() => {
    return [...activeMuscles].sort((a, b) => {
      const itemA = sanitizedSummary[a.key];
      const itemB = sanitizedSummary[b.key];

      const hasPrevA = itemA?.previous !== undefined && itemA.previous > 0;
      const hasPrevB = itemB?.previous !== undefined && itemB.previous > 0;

      const diffA = hasPrevA
        ? Math.abs(itemA.latest - (itemA.previous ?? itemA.latest))
        : 0;
      const diffB = hasPrevB
        ? Math.abs(itemB.latest - (itemB.previous ?? itemB.latest))
        : 0;

      // Mayor impacto primero
      if (diffB !== diffA) {
        return diffB - diffA;
      }

      // Priorizar los que sí tienen registro previo
      if (hasPrevA !== hasPrevB) {
        return hasPrevA ? -1 : 1;
      }

      // Fallback: mantener orden original
      return MUSCLE_LIST.indexOf(a) - MUSCLE_LIST.indexOf(b);
    });
  }, [activeMuscles, sanitizedSummary]);

  // Top 3 que tuvieron más impacto
  const top3Muscles = useMemo(() => {
    return sortedByImpact.slice(0, 3);
  }, [sortedByImpact]);

  // Si está desplegado muestra todas, si no solo el top 3
  const displayedMuscles = showAll ? sortedByImpact : top3Muscles;

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header Estético */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: 6,
        }}
      >
        <View>
          <Text style={[globalStyles.title, { marginBottom: 2 }]}>Mi Perfil</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Resumen corporal y datos personales
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/settings/settings");
          }}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderColor: colors.text,
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="settings" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Perfil de Usuario con Foto y Nombre */}
      <View
        style={[
          globalStyles.card,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: colors.primary + "30",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, marginRight: 8 }}>
          <View style={{ position: "relative" }}>
            <Image
              source={
                userProfile.photoUri
                  ? { uri: userProfile.photoUri }
                  : require("@/assets/images/profile.jpeg")
              }
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                borderWidth: 2.5,
                borderColor: colors.primary,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: colors.surface,
              }}
            >
              <Ionicons name="sparkles" size={10} color={colors.background} />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 19,
                fontWeight: "bold",
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {userProfile.name || "Atleta"}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 6,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                {latestValid?.sexo || latest?.sexo || "Atleta"} • {latestValid?.edad || latest?.edad || 18} años
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/measures/PersonalData");
          }}
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            borderWidth: 1,
            borderColor: colors.primary + "40",
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="pencil" size={13} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>
            Editar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 4 }}>
        {measures.length === 0 ? (
          <View
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                padding: 24,
                borderWidth: 1,
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary + "18",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="person-outline" size={28} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              No hay información del perfil
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginBottom: 16,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              ¿Deseas agregar tus datos biométricos para personalizar tus estadísticas?
            </Text>
            <TouchableOpacity
              style={[
                globalStyles.button,
                {
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/measures/PersonalData");
              }}
            >
              <Ionicons name="add" size={18} color={colors.background} />
              <Text style={globalStyles.buttonText}>Agregar Información</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {/* Fila 1 de Métricas: Peso y Altura */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Peso Actual */}
              <View
                style={[
                  globalStyles.card,
                  {
                    flex: 1,
                    padding: 14,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.primary + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="scale-outline" size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.textSecondary,
                      letterSpacing: 0.5,
                    }}
                  >
                    PESO ACTUAL
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: colors.primary,
                    }}
                  >
                    {latestValid?.peso || latest?.peso || "No data"}
                  </Text>
                  {(latestValid?.peso || latest?.peso) && (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
                      kg
                    </Text>
                  )}
                </View>
              </View>

              {/* Altura Actual */}
              <View
                style={[
                  globalStyles.card,
                  {
                    flex: 1,
                    padding: 14,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.secondary + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="body-outline" size={20} color={colors.secondary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.textSecondary,
                      letterSpacing: 0.5,
                    }}
                  >
                    ALTURA ACTUAL
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {latestValid?.altura || latest?.altura || "No data"}
                  </Text>
                  {(latestValid?.altura || latest?.altura) && (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
                      cm
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Fila 2 de Métricas: Edad y Género */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Edad */}
              <View
                style={[
                  globalStyles.card,
                  {
                    flex: 1,
                    padding: 14,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#f59e0b18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.textSecondary,
                      letterSpacing: 0.5,
                    }}
                  >
                    EDAD
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {latestValid?.edad || latest?.edad || "No data"}
                  </Text>
                  {(latestValid?.edad || latest?.edad) && (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
                      años
                    </Text>
                  )}
                </View>
              </View>

              {/* Género */}
              <View
                style={[
                  globalStyles.card,
                  {
                    flex: 1,
                    padding: 14,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        (latestValid?.sexo || latest?.sexo) === "Femenino"
                          ? colors.delete + "18"
                          : colors.secondary + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={
                        (latestValid?.sexo || latest?.sexo) === "Femenino"
                          ? "female-outline"
                          : "male-outline"
                      }
                      size={20}
                      color={
                        (latestValid?.sexo || latest?.sexo) === "Femenino"
                          ? colors.delete
                          : colors.secondary
                      }
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: colors.textSecondary,
                      letterSpacing: 0.5,
                    }}
                  >
                    GÉNERO
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {latestValid?.sexo || latest?.sexo || "No data"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sección Medidas Corporales */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              <Text style={[globalStyles.title, { fontSize: 18, marginBottom: 0 }]}>
                Medidas Corporales
              </Text>
            </View>
            <Text style={[globalStyles.textSecondary, { fontSize: 12, marginTop: 2 }]}>
              {activeMuscles.length > 3 && !showAll
                ? "Top 3 con mayor cambio"
                : "Rastrea tu progreso a lo largo del tiempo."}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/measures/measures");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
              Actualizar
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Medidas corporales: Top 3 o todas desplegadas hacia abajo */}
        {displayedMuscles.map((muscle) => {
          const item = sanitizedSummary[muscle.key];
          if (!item || !item.latest || item.latest <= 0) return null;
          return (
            <MeasureItem
              key={muscle.key}
              name={muscle.name}
              measure={item.latest}
              previousMeasure={item.previous}
            />
          );
        })}

        {/* Botón acordeón al medio: despliega todas hacia abajo o contrae */}
        {activeMuscles.length > 3 && (
          <View
            style={{
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowAll((prev) => !prev);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.primary + "40",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={showAll ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {showAll ? "Ver menos" : "Ver todas"}
              </Text>
              <Ionicons
                name={showAll ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Botón Inferior */}
      {measures.length === 0 ? (
        <View style={{ marginTop: 15, marginBottom: 40, alignItems: "center" }}>
          <Text style={[globalStyles.textSecondary, { marginBottom: 12, textAlign: "center" }]}>
            No existen medidas todavía...
          </Text>
          <TouchableOpacity
            style={[
              globalStyles.button,
              {
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 14,
                paddingVertical: 14,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/measures/measures");
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.background} />
            <Text style={globalStyles.buttonText}>Registrar Medidas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            globalStyles.button,
            {
              width: "100%",
              marginTop: 15,
              marginBottom: 80,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 14,
              paddingVertical: 14,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/measures/measures");
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.background} />
          <Text style={globalStyles.buttonText}>Actualizar Medidas</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
