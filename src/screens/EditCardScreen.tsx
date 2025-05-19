import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
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
import { Card, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditCard'>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'EditCard'>['route'];

export default function EditCardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const storage = StorageService.getInstance();
  
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [card, setCard] = useState<Card | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    try {
      console.log('Loading card with ID:', route.params?.cardId);
      const cards = await storage.getCardsForDeck(route.params.deckId);
      const foundCard = cards.find(c => c.id === route.params.cardId);
      console.log('Found card:', foundCard);
      
      if (foundCard) {
        setCard(foundCard);
        setFront(foundCard.front);
        setBack(foundCard.back);
      } else {
        console.error('Card not found:', route.params.cardId);
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    }
  };

  const handleSubmit = async () => {
    if (!front.trim() || !back.trim() || !card) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Updating card:', { id: card.id, front, back });
      const updatedCard: Card = {
        ...card,
        front: front.trim(),
        back: back.trim(),
        updatedAt: new Date(),
      };

      await storage.saveCard(updatedCard);
      console.log('Card updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!card) {
    console.log('Card not loaded yet');
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading card...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
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
            placeholder="Enter the question or concept"
            placeholderTextColor={theme.colors.textSecondary}
            value={front}
            onChangeText={setFront}
            multiline
            textAlignVertical="top"
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
            placeholder="Enter the answer or explanation"
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
            <Text style={styles.buttonText}>Save Changes</Text>
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
}); 