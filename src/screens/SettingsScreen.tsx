import { MaterialCommunityIcons } from "@expo/vector-icons";
// @ts-ignore
import { useNavigation } from "@react-navigation/native";
// @ts-ignore
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { ThemeContext } from "../providers/ThemeProvider";
import { RootStackParamList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { mode, setMode } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
    },
    buttonContent: {
      flex: 1,
      marginLeft: 12,
    },
    buttonTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    buttonDescription: {
      fontSize: 14,
    },
    themeButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
    },
    themeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    themeButtonText: {
      color: theme.colors.text,
      fontWeight: "600",
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Data Management
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate("Backup")}
        >
          <MaterialCommunityIcons
            name="backup-restore"
            size={24}
            color={theme.colors.primary}
          />
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonTitle, { color: theme.colors.text }]}>
              Backup & Restore
            </Text>
            <Text
              style={[
                styles.buttonDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Create backups of your decks and restore them when needed
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Theme
      </Text>
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <TouchableOpacity
          style={[
            styles.themeButton,
            mode === "system" && styles.themeButtonActive,
          ]}
          onPress={() => setMode("system")}
        >
          <Text style={styles.themeButtonText}>System</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeButton,
            mode === "light" && styles.themeButtonActive,
          ]}
          onPress={() => setMode("light")}
        >
          <Text style={styles.themeButtonText}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeButton,
            mode === "dark" && styles.themeButtonActive,
          ]}
          onPress={() => setMode("dark")}
        >
          <Text style={styles.themeButtonText}>Dark</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
