import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storage';
import { RootStackParamList } from '../types';
import { generateUUID } from '../utils/uuid';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateDeckScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const storage = StorageService.getInstance();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDeck = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newDeck = {
        id: generateUUID(),
        name: name.trim(),
        description: description.trim(),
        totalCards: 0,
        masteredCards: 0,
        learningCards: 0,
        color: theme.colors.primary,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.saveDeck(newDeck);
      navigation.navigate('DeckDetail', { deckId: newDeck.id });
    } catch (error) {
      console.error('Failed to create deck:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            label="Deck Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            autoFocus
          />
          
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <Button
            mode="contained"
            onPress={handleCreateDeck}
            style={styles.button}
            loading={isSubmitting}
            disabled={!name.trim() || isSubmitting}
          >
            Create Deck
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 