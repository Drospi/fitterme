import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const PersonalData = () => {
  const route = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [weight, setWeight] = useState(65);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(18);
  const [sex, setSex] = useState("Masculino");

  const handleSave = async () => {
    try {
      const nuevaMedida = {
        name: "Measures",
        edad: age,
        sexo: sex,
        peso: weight,
        altura: height,
        cuello: 0,
        hombros: 0,
        pecho: 0,
        biceps: 0,
        cintura: 0,
        cadera: 0,
        muslo: 0,
        pantorrilla: 0,
        grasaCorporal: 0,
        antebrazo: 0,
        cuadriceps: 0,
        gemelos: 0,
        gluteos: 0,
        espalda: 0,
      };

      await addMeasure(nuevaMedida);
      route.dismissAll();
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const loadMeasures = async () => {
    const data = await getMeasures();
    setAge(data[0]?.edad || 0);
    setHeight(data[0]?.altura || 0);
    setWeight(data[0]?.peso || 0);
    setSex(data[0]?.sexo || "Masculino");
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
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
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Datos Personales</Text>
      </View>
      <View
        style={{
          alignItems: "center",
          borderRadius: 100,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <Image
          source={require("@/assets/images/profile.jpeg")}
          style={{ width: 100, height: 100 }}
        />
      </View>
      <View>
        <Text style={globalStyles.cardText}> Peso Actual</Text>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginTop: 10,
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
              marginTop: 10,
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
            <Text style={{ color: colors.text, fontSize: 16 }}>Años</Text>
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
              marginTop: 10,
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

      <View>
        <Text style={globalStyles.cardText}>Genero</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSex("Masculino")}
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
                flex: 1,
                backgroundColor:
                  sex === "Masculino" ? colors.primary + 33 : colors.surface,
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
                  ? { ...globalStyles.cardText, color: colors.primary }
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
                marginTop: 10,
                flex: 1,
                backgroundColor:
                  sex === "Femenino" ? colors.primary + 33 : colors.surface,
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
                  ? { ...globalStyles.cardText, color: colors.primary }
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
        style={[globalStyles.button, { marginBottom: 100 }]}
      >
        <Text style={globalStyles.buttonText}>Guardar Datos Personales</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PersonalData;
