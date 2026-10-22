import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Share, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

type ShareButtonProps = {
  text: string;
};

export default function ShareButton({ text }: ShareButtonProps) {
  const { colors } = useTheme();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={{ padding: 5 }}>
      <Ionicons name="share-outline" size={26} color={colors.primary} />
    </TouchableOpacity>
  );
}
