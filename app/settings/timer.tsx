import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Link } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {};

export default function TimerScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Timer</Text>
      </View>
      <View style={{ marginTop: 30, gap: 20 }}>
        <Link href="/routines" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
