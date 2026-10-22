import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type AdvisorProps = {
  medidas: any;
};

const FitnessAdvisor = ({ medidas }: AdvisorProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const getConsejos = () => {
    const consejos = [];

    // 1. Análisis de proporción piernas vs tronco
    if (medidas.cuadriceps < 55 && medidas.hombros > 120) {
      consejos.push({
        msg: "Tus hombros son fuertes, ¡equilibra tu físico trabajando más tus piernas!",
        icon: "barbell-outline",
      });
    }

    // 2. Análisis de brazos
    if (medidas.biceps < 35) {
      consejos.push({
        msg: "Tus brazos tienen potencial de crecimiento. Añade ejercicios de aislamiento como curls y extensiones.",
        icon: "fitness-outline",
      });
    } else if (medidas.biceps >= 35 && medidas.biceps < 40) {
      consejos.push({
        msg: "¡Buen desarrollo de brazos! Sigue con ejercicios compuestos y de aislamiento.",
        icon: "checkmark-circle-outline",
      });
    } else if (medidas.biceps >= 40) {
      consejos.push({
        msg: "¡Excelente desarrollo de brazos! Enfócate en mantener y definir.",
        icon: "trophy-outline",
      });
    }

    // 3. Análisis de cintura y core
    if (medidas.cintura > 90) {
      consejos.push({
        msg: "Prioriza ejercicios de core y alta intensidad para mejorar tu composición abdominal.",
        icon: "flame-outline",
      });
    } else if (medidas.cintura >= 75 && medidas.cintura <= 90) {
      consejos.push({
        msg: "Mantén un buen trabajo de core para seguir mejorando tu definición.",
        icon: "body-outline",
      });
    } else if (medidas.cintura < 75) {
      consejos.push({
        msg: "¡Excelente cintura! Continúa con ejercicios de mantenimiento y estabilidad.",
        icon: "star-outline",
      });
    }

    // 4. Análisis de pecho
    if (medidas.pecho < 90) {
      consejos.push({
        msg: "Trabaja más tu pecho con press de banca, aperturas y fondos.",
        icon: "pulse-outline",
      });
    } else if (medidas.pecho >= 90 && medidas.pecho < 110) {
      consejos.push({
        msg: "Buen desarrollo pectoral. Varía entre inclinado, plano y declinado.",
        icon: "stats-chart-outline",
      });
    } else if (medidas.pecho >= 110) {
      consejos.push({
        msg: "¡Gran desarrollo pectoral! Enfócate en definición y simetría.",
        icon: "ribbon-outline",
      });
    }

    // 5. Análisis de espalda (hombros)
    if (medidas.hombros < 100) {
      consejos.push({
        msg: "Fortalece tus hombros con press militar, elevaciones laterales y frontales.",
        icon: "arrow-up-outline",
      });
    } else if (medidas.hombros >= 100 && medidas.hombros < 130) {
      consejos.push({
        msg: "Buen ancho de hombros. Sigue trabajando todos los deltoides.",
        icon: "resize-outline",
      });
    } else if (medidas.hombros >= 130) {
      consejos.push({
        msg: "¡Excelente anchura de hombros! Mantén el trabajo con variedad de ángulos.",
        icon: "expand-outline",
      });
    }

    // 6. Análisis de cuádriceps
    if (medidas.cuadriceps < 50) {
      consejos.push({
        msg: "Fortalece tus cuádriceps con sentadillas, prensa y extensiones.",
        icon: "walk-outline",
      });
    } else if (medidas.cuadriceps >= 50 && medidas.cuadriceps < 65) {
      consejos.push({
        msg: "Buen desarrollo de cuádriceps. Varía entre series pesadas y de alta repetición.",
        icon: "bicycle-outline",
      });
    } else if (medidas.cuadriceps >= 65) {
      consejos.push({
        msg: "¡Excelentes cuádriceps! Trabaja también isquiotibiales para equilibrio.",
        icon: "musical-notes-outline",
      });
    }

    // 7. Análisis de gemelos
    if (medidas.gemelos < 35) {
      consejos.push({
        msg: "Fortalece tus gemelos con elevaciones de talones sentado y de pie.",
        icon: "footsteps-outline",
      });
    } else if (medidas.gemelos >= 35 && medidas.gemelos < 45) {
      consejos.push({
        msg: "Buen desarrollo de gemelos. Prueba diferentes rangos de movimiento.",
        icon: "aperture-outline",
      });
    } else if (medidas.gemelos >= 45) {
      consejos.push({
        msg: "¡Excelentes gemelos! Mantén con trabajo de definición y fuerza.",
        icon: "rocket-outline",
      });
    }

    // 8. Análisis de glúteos
    if (medidas.gluteos < 85) {
      consejos.push({
        msg: "Trabaja tus glúteos con sentadillas profundas, hip thrust y zancadas.",
        icon: "chevron-up-outline",
      });
    } else if (medidas.gluteos >= 85 && medidas.gluteos < 105) {
      consejos.push({
        msg: "Buen desarrollo glúteo. Añade ejercicios unilaterales para simetría.",
        icon: "sync-outline",
      });
    } else if (medidas.gluteos >= 105) {
      consejos.push({
        msg: "¡Gran desarrollo de glúteos! Enfócate en mantener con variedad de ejercicios.",
        icon: "happy-outline",
      });
    }

    // 9. Análisis de antebrazos
    if (medidas.antebrazo < 28) {
      consejos.push({
        msg: "Fortalece tus antebrazos con ejercicios de agarre y muñecas.",
        icon: "hand-left-outline",
      });
    } else if (medidas.antebrazo >= 28 && medidas.antebrazo < 35) {
      consejos.push({
        msg: "Buen desarrollo de antebrazos. Varía entre flexión y extensión.",
        icon: "hand-right-outline",
      });
    } else if (medidas.antebrazo >= 35) {
      consejos.push({
        msg: "¡Excelentes antebrazos! Mantén con trabajo variado de agarre.",
        icon: "thumbs-up-outline",
      });
    }

    // 10. Análisis de cuello
    if (medidas.cuello < 35) {
      consejos.push({
        msg: "Fortalece tu cuello con ejercicios isométricos y de resistencia.",
        icon: "alert-circle-outline",
      });
    } else if (medidas.cuello >= 35 && medidas.cuello < 45) {
      consejos.push({
        msg: "Buen desarrollo de cuello. Trabaja todos los movimientos posibles.",
        icon: "radio-outline",
      });
    } else if (medidas.cuello >= 45) {
      consejos.push({
        msg: "¡Excelente cuello! Mantén con trabajo de estabilidad y fuerza.",
        icon: "shield-checkmark-outline",
      });
    }

    // 11. Análisis de cadera
    if (medidas.cadera > 100 && medidas.cintura > 90) {
      consejos.push({
        msg: "Trabaja en reducir la relación cintura-cadera con cardio y core.",
        icon: "hourglass-outline",
      });
    } else if (medidas.cadera >= 85 && medidas.cadera <= 100) {
      consejos.push({
        msg: "Buena proporción cintura-cadera. Sigue con trabajo equilibrado.",
        icon: "balance-scale-outline",
      });
    } else if (medidas.cadera < 85) {
      consejos.push({
        msg: "Excelente relación cintura-cadera. Mantén con trabajo de mantenimiento.",
        icon: "checkmark-done-outline",
      });
    }

    // 12. Análisis por sexo
    if (medidas.sexo === "femenino" && medidas.cintura > 80) {
      consejos.push({
        msg: "Para mujeres, enfócate en ejercicios de glúteos y piernas, manteniendo core fuerte.",
        icon: "woman-outline",
      });
    } else if (medidas.sexo === "femenino" && medidas.cintura <= 80) {
      consejos.push({
        msg: "Excelente composición corporal. Sigue con entrenamiento variado.",
        icon: "sparkles-outline",
      });
    } else if (medidas.sexo === "masculino" && medidas.cintura > 90) {
      consejos.push({
        msg: "Para hombres, prioriza cardio y ejercicios compuestos para mejorar composición.",
        icon: "man-outline",
      });
    } else if (medidas.sexo === "masculino" && medidas.cintura <= 90) {
      consejos.push({
        msg: "Buena condición física. Enfócate en fuerza y definición muscular.",
        icon: "barbell-outline",
      });
    }

    // 13. Análisis de índice de masa muscular (simplificado)
    const imc = medidas.peso / (medidas.altura / 100) ** 2;
    if (imc < 18.5) {
      consejos.push({
        msg: "Tu IMC indica bajo peso. Prioriza alimentación y entrenamiento de fuerza.",
        icon: "nutrition-outline",
      });
    } else if (imc >= 18.5 && imc < 25) {
      consejos.push({
        msg: "¡Excelente IMC! Mantén una dieta balanceada y entrenamiento regular.",
        icon: "restaurant-outline",
      });
    } else if (imc >= 25 && imc < 30) {
      consejos.push({
        msg: "Tu IMC indica sobrepeso. Enfócate en cardio y control alimenticio.",
        icon: "bicycle-outline",
      });
    } else if (imc >= 30) {
      consejos.push({
        msg: "Tu IMC indica obesidad. Prioriza asesoría profesional y cambios graduales.",
        icon: "medkit-outline",
      });
    }

    // 14. Análisis por edad
    if (medidas.edad < 25) {
      consejos.push({
        msg: "¡Estás en edad óptima para desarrollar músculo! Aprovecha tu potencial.",
        icon: "flash-outline",
      });
    } else if (medidas.edad >= 25 && medidas.edad < 40) {
      consejos.push({
        msg: "Buena edad para mantener y mejorar condición física. Trabaja intensidad y recuperación.",
        icon: "trending-up-outline",
      });
    } else if (medidas.edad >= 40 && medidas.edad < 60) {
      consejos.push({
        msg: "Prioriza movilidad, flexibilidad y entrenamiento de fuerza moderado.",
        icon: "leaf-outline",
      });
    } else if (medidas.edad >= 60) {
      consejos.push({
        msg: "Enfócate en ejercicios de bajo impacto, equilibrio y movilidad.",
        icon: "heart-outline",
      });
    }

    // 15. Análisis de proporción cintura-altura
    const relacionCinturaAltura = medidas.cintura / medidas.altura;
    if (relacionCinturaAltura > 0.5) {
      consejos.push({
        msg: "Tu relación cintura-altura es alta. Prioriza pérdida de grasa abdominal.",
        icon: "warning-outline",
      });
    } else if (relacionCinturaAltura > 0.4 && relacionCinturaAltura <= 0.5) {
      consejos.push({
        msg: "Buena relación cintura-altura. Mantén hábitos saludables.",
        icon: "checkmark-circle-outline",
      });
    } else if (relacionCinturaAltura <= 0.4) {
      consejos.push({
        msg: "¡Excelente relación cintura-altura! Sigue así.",
        icon: "star-outline",
      });
    }

    return consejos.length > 0
      ? consejos
      : [
        {
          msg: "¡Vas por buen camino! Mantén la constancia.",
          icon: "happy-outline",
        },
      ];
  };

  const listaConsejos = getConsejos();

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>Consejos de hoy</Text>
      {listaConsejos.slice(0, 3).map((item, index) => (
        <View key={index} style={[{ flexDirection: "row", gap: 10, marginBottom: 20, alignItems: "center" }]}>
          <Ionicons name={item.icon as any} size={24} color={colors.primary} />
          <Text style={globalStyles.cardText}>{item.msg}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
});

export default FitnessAdvisor;
