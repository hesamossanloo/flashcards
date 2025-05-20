import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { StorageService } from "../services/storage";

export default function BackupScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const storage = StorageService.getInstance();
  const [backups, setBackups] = useState<
    Array<{ timestamp: string; decks: any[]; cards: any[]; sessions: any[] }>
  >([]);
  const [backupFiles, setBackupFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingImportFilePath, setPendingImportFilePath] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const [availableBackups, files] = await Promise.all([
        storage.getBackups(),
        storage.getBackupFiles(),
      ]);
      setBackups(availableBackups);
      setBackupFiles(files);
    } catch (error) {
      console.error("Failed to load backups:", error);
      Alert.alert("Error", "Failed to load backups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await storage.createBackup();
      await loadBackups();
      Alert.alert("Success", "Backup created successfully");
    } catch (error) {
      console.error("Failed to create backup:", error);
      Alert.alert("Error", "Failed to create backup");
    }
  };

  const handleExportBackup = async (timestamp: string) => {
    try {
      const filePath = await storage.exportBackup(timestamp);
      await loadBackups();
      Alert.alert("Success", `Backup exported successfully to:\n${filePath}`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Failed to export backup:", error);
      Alert.alert("Error", "Failed to export backup");
    }
  };

  const handleImportBackup = async () => {
    try {
      if (backupFiles.length === 0) {
        Alert.alert("No Backups", "No backup files found on the device");
        return;
      }

      // Show a list of available backup files
      Alert.alert(
        "Import Backup",
        "Select a backup file to import:",
        backupFiles.map((file) => ({
          text: file,
          onPress: async () => {
            const filePath = `${FileSystem.documentDirectory}flashcards_backups/${file}`;
            setPendingImportFilePath(filePath);
            try {
              await storage.importBackup(filePath);
              await loadBackups();
              Alert.alert("Success", "Backup imported successfully");
              setPendingImportFilePath(null);
            } catch (error: any) {
              if (
                error.message &&
                error.message.includes(
                  "already exists. Please confirm overwrite."
                )
              ) {
                Alert.alert(
                  "Backup Exists",
                  "A backup with this timestamp already exists. Do you want to overwrite it?",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                      onPress: () => setPendingImportFilePath(null),
                    },
                    {
                      text: "Overwrite",
                      style: "destructive",
                      onPress: () => {
                        if (pendingImportFilePath) {
                          (async () => {
                            try {
                              await storage.overwriteBackup(
                                pendingImportFilePath
                              );
                              await loadBackups();
                              Alert.alert(
                                "Success",
                                "Backup overwritten successfully"
                              );
                              setPendingImportFilePath(null);
                            } catch (overwriteError) {
                              console.error(
                                "Failed to overwrite backup:",
                                overwriteError
                              );
                              Alert.alert(
                                "Error",
                                "Failed to overwrite backup"
                              );
                              setPendingImportFilePath(null);
                            }
                          })();
                        }
                      },
                    },
                  ]
                );
              } else {
                console.error("Failed to import backup:", error);
                Alert.alert("Error", "Failed to import backup");
                setPendingImportFilePath(null);
              }
            }
          },
        }))
      );
    } catch (error) {
      console.error("Failed to import backup:", error);
      Alert.alert("Error", "Failed to import backup");
      setPendingImportFilePath(null);
    }
  };

  const handleRestoreBackup = async (timestamp: string) => {
    Alert.alert(
      "Restore Backup",
      "Are you sure you want to restore this backup? This will replace all current data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.restoreFromBackup(timestamp);
              Alert.alert(
                "Success",
                "Backup restored successfully. The app will now restart to apply changes.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Force reload the app by navigating to the root
                      navigation.reset({
                        index: 0,
                        routes: [{ name: "Main" }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Failed to restore backup:", error);
              Alert.alert("Error", "Failed to restore backup");
            }
          },
        },
      ]
    );
  };

  const handleDeleteBackup = async (timestamp: string) => {
    Alert.alert(
      "Delete Backup",
      "Are you sure you want to delete this backup?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.deleteBackup(timestamp);
              await loadBackups();
              Alert.alert("Success", "Backup deleted successfully");
            } catch (error) {
              console.error("Failed to delete backup:", error);
              Alert.alert("Error", "Failed to delete backup");
            }
          },
        },
      ]
    );
  };

  const handleShareBackup = async (timestamp: string) => {
    try {
      await storage.shareBackup(timestamp);
    } catch (error) {
      console.error("Failed to share backup:", error);
      Alert.alert("Error", "Failed to share backup");
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading backups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Backups
          </Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleCreateBackup}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
            <Text style={styles.createButtonText}>Create Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[
            styles.importButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={handleImportBackup}
        >
          <MaterialCommunityIcons
            name="file-import"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.importButtonText, { color: theme.colors.text }]}>
            Import Backup from File
          </Text>
        </TouchableOpacity>

        {backups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="backup-restore"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No backups available. Create your first backup to protect your
              data.
            </Text>
          </View>
        ) : (
          backups.map((backup) => (
            <View
              key={backup.timestamp}
              style={[
                styles.backupItem,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.backupInfo}>
                <Text style={[styles.backupDate, { color: theme.colors.text }]}>
                  {formatDate(backup.timestamp)}
                </Text>
                <View style={styles.backupStats}>
                  <Text
                    style={[
                      styles.backupStat,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {backup.decks.length} decks
                  </Text>
                  <Text
                    style={[
                      styles.backupStat,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {backup.cards.length} cards
                  </Text>
                  <Text
                    style={[
                      styles.backupStat,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {backup.sessions.length} sessions
                  </Text>
                </View>
              </View>
              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => handleExportBackup(backup.timestamp)}
                >
                  <Text style={styles.actionButtonText}>Save in App</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => handleShareBackup(backup.timestamp)}
                >
                  <Text style={styles.actionButtonText}>Export to Files</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => handleRestoreBackup(backup.timestamp)}
                >
                  <Text style={styles.actionButtonText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  onPress={() => handleDeleteBackup(backup.timestamp)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  backupItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  backupInfo: {
    marginBottom: 12,
  },
  backupDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  backupStats: {
    flexDirection: "row",
    gap: 16,
  },
  backupStat: {
    fontSize: 14,
  },
  backupActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
    overflow: "hidden",
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
