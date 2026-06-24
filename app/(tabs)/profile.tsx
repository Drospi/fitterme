import { globalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Profile</Text>
        <Link href="/settings/settings">
          <Ionicons style={globalStyles.title} name="settings" />
        </Link>
      </View>
    </ScrollView>
  );
}
