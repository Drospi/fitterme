import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AssistantActionType =
  | "REGISTRAR_MEDIDAS"
  | "REGISTRAR_COMIDAS"
  | "INICIAR_RUTINA"
  | "CONFIGURAR_METAS";

type Props = {
  content: string;
  isUser?: boolean;
  onAction?: (action: AssistantActionType) => void;
};

export default function FormattedMarkdownText({
  content,
  isUser = false,
  onAction,
}: Props) {
  const { colors } = useTheme();

  const textColor = isUser ? colors.background : colors.text;
  const secondaryColor = isUser ? colors.background + "D0" : colors.textSecondary;
  const primaryColor = isUser ? colors.background : colors.primary;

  // Extraer etiquetas de acción del texto si existen
  const detectedActions: AssistantActionType[] = [];
  let cleanContent = content;

  if (cleanContent.includes("[ACCION:REGISTRAR_MEDIDAS]")) {
    detectedActions.push("REGISTRAR_MEDIDAS");
    cleanContent = cleanContent.replace(/\[ACCION:REGISTRAR_MEDIDAS\]/g, "");
  }
  if (cleanContent.includes("[ACCION:REGISTRAR_COMIDAS]")) {
    detectedActions.push("REGISTRAR_COMIDAS");
    cleanContent = cleanContent.replace(/\[ACCION:REGISTRAR_COMIDAS\]/g, "");
  }
  if (cleanContent.includes("[ACCION:INICIAR_RUTINA]")) {
    detectedActions.push("INICIAR_RUTINA");
    cleanContent = cleanContent.replace(/\[ACCION:INICIAR_RUTINA\]/g, "");
  }
  if (cleanContent.includes("[ACCION:CONFIGURAR_METAS]")) {
    detectedActions.push("CONFIGURAR_METAS");
    cleanContent = cleanContent.replace(/\[ACCION:CONFIGURAR_METAS\]/g, "");
  }

  // Parsear texto en línea (negritas **texto** y cursivas *texto*)
  const renderInlineFormatted = (rawText: string) => {
    const parts = rawText.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <Text
            key={index}
            style={{ fontWeight: "bold", color: textColor }}
          >
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <Text
            key={index}
            style={{ fontStyle: "italic", color: secondaryColor }}
          >
            {part.slice(1, -1)}
          </Text>
        );
      }
      return (
        <Text key={index} style={{ color: textColor }}>
          {part}
        </Text>
      );
    });
  };

  const lines = cleanContent.trim().split("\n");

  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Línea vacía
        if (!trimmed) {
          return <View key={index} style={{ height: 4 }} />;
        }

        // Separador horizontal ---
        if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
          return (
            <View
              key={index}
              style={{
                height: 1,
                backgroundColor: colors.neutral + "60",
                marginVertical: 6,
              }}
            />
          );
        }

        // Título H1 (# )
        if (trimmed.startsWith("# ")) {
          return (
            <Text
              key={index}
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: primaryColor,
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              {trimmed.slice(2)}
            </Text>
          );
        }

        // Título H2 (## )
        if (trimmed.startsWith("## ")) {
          return (
            <Text
              key={index}
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: primaryColor,
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              {trimmed.slice(3)}
            </Text>
          );
        }

        // Título H3 (### )
        if (trimmed.startsWith("### ")) {
          return (
            <Text
              key={index}
              style={{
                fontSize: 15,
                fontWeight: "bold",
                color: primaryColor,
                marginTop: 5,
                marginBottom: 2,
              }}
            >
              {trimmed.slice(4)}
            </Text>
          );
        }

        // Lista con viñeta (* o - o •)
        if (
          trimmed.startsWith("* ") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("• ")
        ) {
          const itemText = trimmed.slice(2);
          return (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingLeft: 4,
                marginVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 20,
                  color: primaryColor,
                  marginRight: 6,
                }}
              >
                •
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
                  color: textColor,
                }}
              >
                {renderInlineFormatted(itemText)}
              </Text>
            </View>
          );
        }

        // Lista numerada (ej. 1. , 2. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingLeft: 4,
                marginVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  lineHeight: 20,
                  color: primaryColor,
                  marginRight: 6,
                  minWidth: 16,
                }}
              >
                {num}.
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
                  color: textColor,
                }}
              >
                {renderInlineFormatted(itemText)}
              </Text>
            </View>
          );
        }

        // Párrafo de texto normal
        return (
          <Text
            key={index}
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: textColor,
            }}
          >
            {renderInlineFormatted(trimmed)}
          </Text>
        );
      })}

      {/* Botones de acción directa si se detectaron datos faltantes */}
      {detectedActions.length > 0 && onAction && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {detectedActions.map((action, idx) => {
            let label = "";
            let icon: any = "add-circle";
            if (action === "REGISTRAR_MEDIDAS") {
              label = "Registrar Medidas Corporales";
              icon = "body-outline";
            } else if (action === "REGISTRAR_COMIDAS") {
              label = "Registrar Comidas de Hoy";
              icon = "restaurant-outline";
            } else if (action === "INICIAR_RUTINA") {
              label = "Iniciar un Entrenamiento";
              icon = "barbell-outline";
            } else if (action === "CONFIGURAR_METAS") {
              label = "Configurar mis Metas";
              icon = "flag-outline";
            }

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onAction(action)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons name={icon} size={15} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={13}
                  color={colors.primary}
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
