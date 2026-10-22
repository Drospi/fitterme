import { useTheme } from "@/context/ThemeContext";
import {
  ChatMessage,
  compileTargetedChatContext,
  getAvailableMentionItems,
  MentionItem,
  sendAIChatMessage,
} from "@/services/aiChatService";
import { getAIConfig } from "@/store/aiConfig";
import { getUserProfile } from "@/store/userProfile";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import FormattedMarkdownText, {
  AssistantActionType,
} from "./FormattedMarkdownText";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function HistoryAIChatModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelName, setModelName] = useState("Gemini");
  const [athleteName, setAthleteName] = useState("Atleta");

  // Catálogo y estado de menciones (@)
  const [mentionCatalog, setMentionCatalog] = useState<MentionItem[]>([]);
  const [selectedMentionTags, setSelectedMentionTags] = useState<MentionItem[]>([]);
  const [isMentionMenuVisible, setIsMentionMenuVisible] = useState(false);
  const [mentionFilterQuery, setMentionFilterQuery] = useState("");

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Cargar catálogo de menciones, configuración y perfil al abrir
  useEffect(() => {
    if (visible) {
      (async () => {
        const config = await getAIConfig();
        if (config.model) {
          setModelName(config.model);
        }
        const profile = await getUserProfile();
        if (profile.name) {
          setAthleteName(profile.name);
        }

        const items = await getAvailableMentionItems();
        setMentionCatalog(items);

        // Si es la primera vez que se abre, agregar mensaje inicial conciso
        if (messages.length === 0) {
          setMessages([
            {
              id: "welcome-1",
              sender: "assistant",
              text: `¡Hola, **${profile.name || "Atleta"}**! Soy tu **Coach Personal FitterMe**.\n\nPuedes escribir **@** para consultar un músculo, ejercicio, medida o meta específica (ej. *@Bíceps*, *@Peso*, *@Press de Banca*), o preguntarme libremente sobre tu progreso.`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      })();
    }
  }, [visible]);

  // Manejar cambios en el texto y detectar el disparador @
  const handleInputChange = (text: string) => {
    setInputText(text);

    const atIndex = text.lastIndexOf("@");
    if (atIndex !== -1) {
      const textAfterAt = text.slice(atIndex + 1);
      // Si no hay espacios después de @, el usuario está buscando una mención
      if (!/\s/.test(textAfterAt)) {
        setMentionFilterQuery(textAfterAt);
        setIsMentionMenuVisible(true);
        return;
      }
    }
    setIsMentionMenuVisible(false);
  };

  // Filtrar menciones disponibles según lo que se va escribiendo tras @
  const filteredMentions = useMemo(() => {
    if (!mentionFilterQuery.trim()) {
      return mentionCatalog.slice(0, 16);
    }
    const q = mentionFilterQuery.toLowerCase().trim();
    return mentionCatalog
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [mentionCatalog, mentionFilterQuery]);

  // Al seleccionar una mención del menú
  const handleSelectMention = (item: MentionItem) => {
    Haptics.selectionAsync();

    // Reemplazar el @query con @Etiqueta
    const atIndex = inputText.lastIndexOf("@");
    let updatedText = "";
    if (atIndex !== -1) {
      updatedText = inputText.slice(0, atIndex) + `@${item.label} `;
    } else {
      updatedText = inputText ? `${inputText} @${item.label} ` : `@${item.label} `;
    }

    setInputText(updatedText);
    setIsMentionMenuVisible(false);

    // Agregar a etiquetas activas de contexto si no está presente
    if (!selectedMentionTags.some((t) => t.id === item.id)) {
      setSelectedMentionTags((prev) => [...prev, item]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    Haptics.selectionAsync();
    setSelectedMentionTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleClearChat = () => {
    Alert.alert(
      "Reiniciar conversación",
      "¿Deseas vaciar el historial de mensajes del chat?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setSelectedMentionTags([]);
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                sender: "assistant",
                text: `¡Conversación reiniciada! Escribe **@** para consultar un músculo, ejercicio o tus medidas, o hazme una pregunta directa.`,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          },
        },
      ]
    );
  };

  const handleCopyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.selectionAsync();
    Toast.show({
      type: "success",
      text1: "Copiado al portapapeles",
      text2: "Respuesta del coach copiada.",
    });
  };

  const handleAction = (action: AssistantActionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (action === "REGISTRAR_MEDIDAS") {
      router.push("/measures/measures" as any);
    } else if (action === "REGISTRAR_COMIDAS") {
      router.push("/(tabs)/meals" as any);
    } else if (action === "INICIAR_RUTINA") {
      router.push("/(tabs)/routines" as any);
    } else if (action === "CONFIGURAR_METAS") {
      router.push("/measures/goals" as any);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText("");
    setIsMentionMenuVisible(false);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Compilar contexto enfocado en las menciones activas o contenidas en la pregunta
      const contextSummary = await compileTargetedChatContext(
        query,
        selectedMentionTags
      );

      const responseText = await sendAIChatMessage(
        updatedMessages,
        contextSummary
      );

      const botMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Error en chat de IA:", error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: `⚠️ ${error?.message || "No se pudo obtener respuesta del modelo."}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const quickPrompts = [
    {
      title: "🏋️ Entrenamiento de hoy",
      prompt: "¿Cómo estuvo mi entrenamiento de hoy y qué aspectos puedo mejorar para la siguiente sesión?",
    },
    {
      title: "🥗 Calorías y Comidas",
      prompt: "¿Cómo voy hoy con mis calorías y comidas registradas? ¿Cumplí mis macros?",
    },
    {
      title: "📏 Progreso de Medidas",
      prompt: "¿Cómo va el progreso de mis medidas corporales, peso y porcentaje de grasa?",
    },
    {
      title: "🔥 Sobrecarga y Récords",
      prompt: "Analiza mi sobrecarga progresiva y si superé algún récord en mis últimos entrenamientos.",
    },
    {
      title: "🥑 Recuperación y Dieta",
      prompt: "¿Qué me recomiendas comer hoy para optimizar mi recuperación muscular y metas?",
    },
  ];

  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? 28 : (Platform.OS === "ios" ? 14 : 0)
  );
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "ios" ? 12 : 8
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : "fullScreen"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topInset,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Cabecera del Chatbot */}
          <View style={[styles.header, { borderBottomColor: colors.neutral + "40" }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="sparkles" size={17} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Coach IA FitterMe
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {modelName} • Usa @ para consultar datos
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClearChat}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Zona de Mensajes */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowAssistant,
                  ]}
                >
                  {!isUser && (
                    <View style={[styles.avatarBox, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="sparkles" size={14} color={colors.primary} />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: colors.primary }]
                        : [
                          styles.assistantBubble,
                          {
                            backgroundColor: colors.surface,
                            borderColor: m.isError ? colors.delete : colors.neutral,
                          },
                        ],
                    ]}
                  >
                    <FormattedMarkdownText
                      content={m.text}
                      isUser={isUser}
                      onAction={handleAction}
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: isUser ? colors.background + "B0" : colors.textSecondary,
                        }}
                      >
                        {m.timestamp}
                      </Text>

                      {!isUser && (
                        <TouchableOpacity
                          onPress={() => handleCopyMessage(m.text)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          style={{ paddingLeft: 8 }}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={13}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Indicador de Pensando / Cargando */}
            {isLoading && (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View style={[styles.avatarBox, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    styles.assistantBubble,
                    { backgroundColor: colors.surface, borderColor: colors.neutral },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      El Coach IA está analizando tus datos...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Preguntas rápidas de sugerencia (si solo está el saludo inicial) */}
            {messages.length <= 1 && !isLoading && (
              <View style={{ marginTop: 15 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: colors.textSecondary,
                    marginBottom: 10,
                    letterSpacing: 0.5,
                  }}
                >
                  CONSULTAS RÁPIDAS:
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {quickPrompts.map((qp, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSendMessage(qp.prompt)}
                      style={[
                        styles.quickPromptChip,
                        { backgroundColor: colors.surface, borderColor: colors.primary + "30" },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.primary }}>
                        {qp.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Menú de Autocompletado @ Flotante */}
          {isMentionMenuVisible && (
            <View
              style={[
                styles.mentionMenuContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + "40",
                  shadowColor: "#000",
                },
              ]}
            >
              <View style={styles.mentionMenuHeader}>
                <Ionicons name="at" size={14} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.textSecondary }}>
                  MENCIONAR DATO ({filteredMentions.length} resultados)
                </Text>
                <TouchableOpacity
                  onPress={() => setIsMentionMenuVisible(false)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={true}
              >
                {filteredMentions.length === 0 ? (
                  <View style={{ padding: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      No se encontraron coincidencias para "@{mentionFilterQuery}"
                    </Text>
                  </View>
                ) : (
                  filteredMentions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleSelectMention(item)}
                      style={[
                        styles.mentionItemRow,
                        { borderBottomColor: colors.neutral + "30" },
                      ]}
                    >
                      <View
                        style={[
                          styles.mentionIconBox,
                          { backgroundColor: colors.primary + "18" },
                        ]}
                      >
                        <Ionicons name={item.icon as any} size={15} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
                          {item.label}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {item.description}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                        {item.tag}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Barra de Etiquetas de Menciones Activas */}
          {selectedMentionTags.length > 0 && (
            <View style={[styles.activeTagsBar, { backgroundColor: colors.surface }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {selectedMentionTags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: colors.neutral,
                      },
                    ]}
                  >
                    <Ionicons name={tag.icon as any} size={11} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.primary }}>
                      {tag.label}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.neutral + "40",
                paddingBottom: bottomInset,
              },
            ]}
          >
            {/* Botón rápido @ para insertar disparador */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                if (!inputText.endsWith("@")) {
                  setInputText((prev) => (prev ? `${prev.trim()} @` : "@"));
                }
                setMentionFilterQuery("");
                setIsMentionMenuVisible(true);
                textInputRef.current?.focus();
              }}
              style={[
                styles.atButton,
                {
                  backgroundColor: isMentionMenuVisible
                    ? colors.primary
                    : colors.primary + "18",
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="at"
                size={18}
                color={isMentionMenuVisible ? colors.background : colors.primary}
              />
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isMentionMenuVisible ? colors.primary : colors.neutral,
                },
              ]}
              placeholder="Pregunta o escribe @ para datos..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
              multiline
              maxLength={600}
            />

            <TouchableOpacity
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    !inputText.trim() || isLoading
                      ? colors.primary + "40"
                      : colors.primary,
                },
              ]}
            >
              <Ionicons
                name="send"
                size={18}
                color={colors.background}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  messagesContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: "84%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  quickPromptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  mentionMenuContainer: {
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  mentionMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mentionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  mentionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTagsBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  atButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
});
