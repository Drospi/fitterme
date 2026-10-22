import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserProfile = {
  name: string;
  photoUri: string | null;
};

const USER_PROFILE_KEY = "UserProfile_v1";

const DEFAULT_PROFILE: UserProfile = {
  name: "Atleta",
  photoUri: null,
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name && typeof parsed.name === "string" && parsed.name.trim() !== "" ? parsed.name.trim() : DEFAULT_PROFILE.name,
      photoUri: parsed.photoUri || null,
    };
  } catch (error) {
    console.error("Error al cargar perfil de usuario:", error);
    return DEFAULT_PROFILE;
  }
};

export const saveUserProfile = async (
  newProfile: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const current = await getUserProfile();
    const updated: UserProfile = {
      ...current,
      ...newProfile,
      name: newProfile.name !== undefined ? (newProfile.name.trim() || DEFAULT_PROFILE.name) : current.name,
      photoUri: newProfile.photoUri !== undefined ? newProfile.photoUri : current.photoUri,
    };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error al guardar perfil de usuario:", error);
    return DEFAULT_PROFILE;
  }
};
