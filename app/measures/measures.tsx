import { globalStyles } from "@/styles/global";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function MeasuresScreen() {
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text>All Measures</Text>
      </View>
    </ScrollView>
  );
}
