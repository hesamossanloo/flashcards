import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface CreateDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateDeck: (name: string) => void;
}

export default function CreateDeckModal({
  visible,
  onClose,
  onCreateDeck,
}: CreateDeckModalProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onCreateDeck(name.trim());
    setName('');
    setIsSubmitting(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Create New Deck
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>
            Deck Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Enter deck name"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus={true}
            maxLength={50}
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              (!name.trim() || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            <Text style={styles.buttonText}>Create Deck</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  content: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 