import ActiveMusclesList from "@/components/profile/ActiveMusclesList";
import BiometricsGrid from "@/components/profile/BiometricsGrid";
import EmptyProfileCard from "@/components/profile/EmptyProfileCard";
import UserProfileCard from "@/components/profile/UserProfileCard";
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

      if (diffB !== diffA) {
        return diffB - diffA;
      }

      if (hasPrevA !== hasPrevB) {
        return hasPrevA ? -1 : 1;
      }

      return 0;
    });
  }, [activeMuscles, sanitizedSummary]);

  const displayedMuscles = useMemo(() => {
    if (showAll) {
      return sortedByImpact;
    }
    return sortedByImpact.slice(0, 3);
  }, [sortedByImpact, showAll]);

  const currentPeso = latestValid?.peso || latest?.peso;
  const currentAltura = latestValid?.altura || latest?.altura;
  const currentEdad = latestValid?.edad || latest?.edad;
  const currentSexo = latestValid?.sexo || latest?.sexo;

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
      <UserProfileCard
        userProfile={userProfile}
        sexo={currentSexo}
        edad={currentEdad}
        onEdit={() => {
          Haptics.selectionAsync();
          router.push("/measures/PersonalData");
        }}
      />

      {/* Grid Biométrico o Estado Vacío */}
      {measures.length === 0 ? (
        <EmptyProfileCard
          onAddInfo={() => {
            Haptics.selectionAsync();
            router.push("/measures/PersonalData");
          }}
        />
      ) : (
        <BiometricsGrid
          peso={currentPeso}
          altura={currentAltura}
          edad={currentEdad}
          sexo={currentSexo}
        />
      )}

      {/* Lista de Medidas Corporales */}
      <ActiveMusclesList
        displayedMuscles={displayedMuscles}
        activeMusclesCount={activeMuscles.length}
        sanitizedSummary={sanitizedSummary}
        showAll={showAll}
        onToggleShowAll={() => {
          Haptics.selectionAsync();
          setShowAll((prev) => !prev);
        }}
        onNavigateMeasures={() => {
          Haptics.selectionAsync();
          router.push("/measures/measures");
        }}
      />

      {/* Botón Inferior de Acción */}
      <TouchableOpacity
        style={[
          globalStyles.button,
          {
            width: "100%",
            marginTop: 20,
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
        <Ionicons
          name={measures.length === 0 ? "add-circle-outline" : "create-outline"}
          size={20}
          color={colors.background}
        />
        <Text style={globalStyles.buttonText}>
          {measures.length === 0 ? "Registrar Medidas" : "Actualizar Medidas"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
