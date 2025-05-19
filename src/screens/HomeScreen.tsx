import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { theme } from '../assets/themes/theme';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../types';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Decks'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen({ navigation }: { navigation: NavigationProp }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome to Flashcards
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Start learning with spaced repetition
        </Text>
      </View>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Start
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('CreateDeck')}
          style={styles.button}
        >
          Create New Deck
        </Button>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Activity
        </Text>
      </Surface>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          Start by creating your first deck of flashcards
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
  },
  title: {
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
  },
}); 