import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storage';
import { Card, Deck, RootStackParamList } from '../types';
import { generateUUID } from '../utils/uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCard'>;

export default function AddCardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Props['navigation']>();
  const route = useRoute<Props['route']>();
  const storage = StorageService.getInstance();
  
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardsAdded, setCardsAdded] = useState(0);
  const isFirstCard = route.params.isFirstCard ?? false;

  useEffect(() => {
    loadDeck();
  }, []);

  // Handle back button press
  const handleBackPress = () => {
    if (deck) {
      navigation.navigate('DeckDetail', { deckId: deck.id });
      return true;
    }
    return false;
  };

  // Set up back handler
  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }
  }, [deck]);

  useEffect(() => {
    if (deck) {
      navigation.setOptions({
        title: isFirstCard ? 'Create First Card' : 'Add Cards',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.headerButton}
          >
            <Text style={{ color: theme.colors.primary }}>Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          !isFirstCard ? (
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.headerButton}
            >
              <Text style={{ color: theme.colors.primary }}>Done</Text>
            </TouchableOpacity>
          ) : null
        ),
      });
    }
  }, [deck, isFirstCard, navigation, theme.colors.primary]);

  const loadDeck = async () => {
    try {
      console.log('Loading deck with ID:', route.params.deckId);
      const loadedDeck = await storage.getDeck(route.params.deckId);
      console.log('Loaded deck:', loadedDeck);
      if (loadedDeck) {
        setDeck(loadedDeck);
      }
    } catch (error) {
      console.error('Failed to load deck:', error);
    }
  };

  const clearForm = () => {
    setFront('');
    setBack('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!front.trim() || !back.trim() || !deck) {
      console.log('Validation failed:', { front: front.trim(), back: back.trim(), deck });
      return;
    }

    console.log('Starting card submission...');
    setIsSubmitting(true);
    try {
      const newCard: Card = {
        id: generateUUID(),
        deckId: deck.id,
        front: front.trim(),
        back: back.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 0,
        correctCount: 0,
        incorrectCount: 0,
        tags: [],
      };

      console.log('Saving new card:', newCard);
      await storage.saveCard(newCard);
      console.log('Card saved successfully');

      // Get current cards to ensure accurate count
      const currentCards = await storage.getCardsForDeck(deck.id);
      console.log('Current cards in deck:', currentCards.length);

      // Update deck card count
      const updatedDeck: Deck = {
        ...deck,
        totalCards: currentCards.length + 1, // Add 1 for the new card
        updatedAt: new Date(),
      };
      console.log('Updating deck:', updatedDeck);
      await storage.saveDeck(updatedDeck);
      console.log('Deck updated successfully');
      setDeck(updatedDeck);

      // Increment cards added counter
      setCardsAdded(prev => prev + 1);

      if (isFirstCard) {
        console.log('First card created, clearing form for next card');
        clearForm();
        // Set isFirstCard to false since we've added the first card
        navigation.setParams({ isFirstCard: false });
      } else {
        console.log('Card added, clearing form for next card');
        clearForm();
      }
    } catch (error) {
      console.error('Failed to save card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!deck) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {isFirstCard && (
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Tip: Start with a foundational concept or key term for your deck!
              </Text>
            </View>
          )}

          {!isFirstCard && cardsAdded > 0 && (
            <View style={[styles.addedContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.addedText, { color: theme.colors.textSecondary }]}>
                {cardsAdded} card{cardsAdded !== 1 ? 's' : ''} added to deck
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: theme.colors.text }]}>Front</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={isFirstCard ? "Enter your first flashcard question or concept" : "Enter the question or concept"}
            placeholderTextColor={theme.colors.textSecondary}
            value={front}
            onChangeText={setFront}
            multiline
            textAlignVertical="top"
            autoFocus={true}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Back</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={isFirstCard ? "Enter the answer or explanation for your first card" : "Enter the answer or explanation"}
            placeholderTextColor={theme.colors.textSecondary}
            value={back}
            onChangeText={setBack}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              (!front.trim() || !back.trim() || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!front.trim() || !back.trim() || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isFirstCard ? "Create First Card" : "Add Card"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  addedContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addedText: {
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    marginRight: 16,
  },
}); 