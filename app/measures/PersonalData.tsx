import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getLatestSanitizedMeasure, getMeasures } from "@/store/measures";
import { getUserProfile, saveUserProfile } from "@/store/userProfile";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const PersonalData = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [name, setName] = useState("Atleta");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [weight, setWeight] = useState(65);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(18);
  const [sex, setSex] = useState("Masculino");

  const handlePickImage = () => {
    Alert.alert(
      "Foto de Perfil",
      "Selecciona una opción para tu foto de perfil",
      [
        {
          text: "📷 Tomar Foto",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Toast.show({
                  type: "error",
                  text1: "Permiso denegado",
                  text2: "Se requiere permiso de acceso a la cámara.",
                });
                return;
              }
              const res = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]) {
                setPhotoUri(res.assets[0].uri);
              }
            } catch (err) {
              console.error("Error al tomar foto:", err);
            }
          },
        },
        {
          text: "🖼️ Elegir de la Galería",
          onPress: async () => {
            try {
              const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Toast.show({
                  type: "error",
                  text1: "Permiso denegado",
                  text2: "Se requiere permiso de acceso a la galería.",
                });
                return;
              }
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]) {
                setPhotoUri(res.assets[0].uri);
              }
            } catch (err) {
              console.error("Error al seleccionar foto:", err);
            }
          },
        },
        ...(photoUri
          ? [
              {
                text: "🗑️ Eliminar Foto",
                style: "destructive" as const,
                onPress: () => setPhotoUri(null),
              },
            ]
          : []),
        {
          text: "Cancelar",
          style: "cancel" as const,
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      // 1. Guardar perfil de usuario (nombre y foto)
      await saveUserProfile({
        name: name.trim() || "Atleta",
        photoUri: photoUri,
      });

      // 2. Guardar medidas corporales conservando las medidas corporales válidas más recientes
      const latest = await getLatestSanitizedMeasure();

      const nuevaMedida = {
        name: name.trim() || "Measures",
        edad: age,
        sexo: sex,
        peso: weight,
        altura: height,
        cuello: latest?.cuello || 0,
        hombros: latest?.hombros || 0,
        pecho: latest?.pecho || 0,
        biceps: latest?.biceps || 0,
        cintura: latest?.cintura || 0,
        cadera: latest?.cadera || 0,
        antebrazo: latest?.antebrazo || 0,
        cuadriceps: latest?.cuadriceps || 0,
        gemelos: latest?.gemelos || 0,
        gluteos: latest?.gluteos || 0,
        espalda: latest?.espalda || 0,
      };

      await addMeasure(nuevaMedida);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Perfil Actualizado",
        text2: "Tus datos personales y perfil se guardaron correctamente.",
      });

      router.back();
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: "No se pudieron guardar los datos.",
      });
    }
  };

  const loadProfileAndMeasures = async () => {
    const profile = await getUserProfile();
    if (profile.name) setName(profile.name);
    setPhotoUri(profile.photoUri);

    const latest = await getLatestSanitizedMeasure();
    if (latest) {
      setAge(latest.edad || 18);
      setHeight(latest.altura || 170);
      setWeight(latest.peso || 65);
      setSex(latest.sexo || "Masculino");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileAndMeasures();
    }, [])
  );

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAdjusting = (increment: number) => {
    const updateValue = () => {
      setWeight((prev) => {
        const newValue = Math.max(0, prev + increment);
        return newValue;
      });
    };

    updateValue();

    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        updateValue();
      }, 100);
    }, 500);
  };

  const stopAdjusting = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAdjustingHeight = (increment: number) => {
    const updateValue = () => {
      setHeight((prev) => {
        const newValue = Math.max(0, prev + increment);
        return newValue;
      });
    };

    updateValue();

    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        updateValue();
      }, 100);
    }, 500);
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View
        style={[
          globalStyles.header,
          { marginBottom: 10, alignItems: "center" },
        ]}
      >
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Foto de Perfil con Badge de Cámara */}
      <View
        style={{
          alignItems: "center",
          marginTop: 15,
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.8}
          style={{ position: "relative" }}
        >
          <Image
            source={
              photoUri
                ? { uri: photoUri }
                : require("@/assets/images/profile.jpeg")
            }
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              borderWidth: 3,
              borderColor: colors.primary,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.background,
            }}
          >
            <Ionicons name="camera" size={18} color={colors.background} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickImage} style={{ marginTop: 8 }}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            {photoUri ? "Cambiar Foto de Perfil" : "Añadir Foto de Perfil"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nombre del Usuario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={globalStyles.cardText}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre o apodo"
          placeholderTextColor={colors.textSecondary}
          style={[
            globalStyles.input,
            {
              marginTop: 6,
              fontSize: 16,
              fontWeight: "600",
              borderWidth: 1,
              borderColor: colors.surface,
            },
          ]}
        />
      </View>

      {/* Peso Actual */}
      <View>
        <Text style={globalStyles.cardText}>Peso Actual</Text>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginTop: 6,
            },
          ]}
        >
          <TouchableOpacity
            onPressIn={() => startAdjusting(-1)}
            onPressOut={stopAdjusting}
            style={{
              borderRadius: 100,
              backgroundColor: colors.background,
              padding: 10,
            }}
          >
            <Ionicons name="remove-outline" size={32} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 24,
                color: colors.primary,
              }}
            >
              {weight}
              <Text style={{ color: colors.text, fontSize: 16 }}> kg</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPressIn={() => startAdjusting(+1)}
            onPressOut={stopAdjusting}
            style={{
              borderRadius: 100,
              backgroundColor: colors.background,
              padding: 10,
            }}
          >
            <Ionicons name="add-outline" size={32} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edad */}
      <View>
        <Text style={globalStyles.cardText}>Edad</Text>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginTop: 6,
            },
          ]}
        >
          <View>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 32,
                color: colors.primary,
              }}
            >
              {age}
            </Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>Años</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{
                borderRadius: 10,
                backgroundColor: colors.background,
                paddingHorizontal: 15,
                paddingVertical: 10,
              }}
              onPress={() => setAge((prev) => Math.max(0, prev - 1))}
            >
              <Ionicons name="remove-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderRadius: 10,
                backgroundColor: colors.primary,
                paddingHorizontal: 15,
                paddingVertical: 10,
              }}
              onPress={() => setAge((prev) => prev + 1)}
            >
              <Ionicons
                name="add-outline"
                size={24}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Altura Actual */}
      <View>
        <Text style={globalStyles.cardText}>Altura Actual</Text>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginTop: 6,
            },
          ]}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 32,
              color: colors.primary,
            }}
          >
            {height}
            <Text style={{ color: colors.text, fontSize: 16 }}> cm</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPressIn={() => startAdjustingHeight(-1)}
              onPressOut={stopAdjusting}
            >
              <Ionicons
                name="arrow-down-circle"
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 0,
                borderRadius: 100,
              }}
              onPressIn={() => startAdjustingHeight(+1)}
              onPressOut={stopAdjusting}
            >
              <Ionicons
                name="arrow-up-circle"
                size={32}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Género */}
      <View>
        <Text style={globalStyles.cardText}>Género</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSex("Masculino")}
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
                flex: 1,
                backgroundColor:
                  sex === "Masculino" ? colors.primary + "33" : colors.surface,
                borderWidth: sex === "Masculino" ? 1.5 : 1,
                borderColor:
                  sex === "Masculino" ? colors.primary : "transparent",
              },
            ]}
          >
            <Ionicons
              name="male"
              size={32}
              color={
                sex === "Masculino" ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={
                sex === "Masculino"
                  ? { ...globalStyles.cardText, color: colors.primary, fontWeight: "bold" }
                  : globalStyles.cardText
              }
            >
              Masculino
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSex("Femenino")}
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
                flex: 1,
                backgroundColor:
                  sex === "Femenino" ? colors.primary + "33" : colors.surface,
                borderWidth: sex === "Femenino" ? 1.5 : 1,
                borderColor:
                  sex === "Femenino" ? colors.primary : "transparent",
              },
            ]}
          >
            <Ionicons
              name="female"
              size={32}
              color={sex === "Femenino" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={
                sex === "Femenino"
                  ? { ...globalStyles.cardText, color: colors.primary, fontWeight: "bold" }
                  : globalStyles.cardText
              }
            >
              Femenino
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[globalStyles.button, { marginTop: 30, marginBottom: 100 }]}
      >
        <Text style={globalStyles.buttonText}>Guardar Datos Personales</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PersonalData;

