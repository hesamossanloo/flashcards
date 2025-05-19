import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import CreateDeckModal from '../components/CreateDeckModal';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storage';
import { Deck, MainTabParamList, RootStackParamList } from '../types';
import { generateUUID } from '../utils/uuid';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Decks'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');

export default function DecksScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const storage = StorageService.getInstance();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [activeSwipe, setActiveSwipe] = useState<string | null>(null);
  const animationMap = useRef(new Map<string, Animated.Value>());
  const swipeStateMap = useRef(new Map<string, boolean>());

  // Initialize or get animation value for a deck
  const getAnimationValue = (deckId: string) => {
    if (!animationMap.current.has(deckId)) {
      animationMap.current.set(deckId, new Animated.Value(0));
    }
    return animationMap.current.get(deckId)!;
  };

  // Load decks
  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setIsLoading(true);
      const loadedDecks = await storage.getAllDecks();
      
      // Update each deck with accurate card count
      const updatedDecks = await Promise.all(
        loadedDecks.map(async (deck) => {
          const cards = await storage.getCardsForDeck(deck.id);
          return {
            ...deck,
            totalCards: cards.length,
            masteredCards: cards.filter(card => card.level >= 5).length,
            learningCards: cards.filter(card => card.level > 0 && card.level < 5).length,
            updatedAt: new Date()
          };
        })
      );

      // Save the updated decks
      await Promise.all(
        updatedDecks.map(deck => storage.saveDeck(deck))
      );

      console.log('Updated decks with correct counts:', updatedDecks);
      setDecks(updatedDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add focus effect to reload decks when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('DecksScreen focused, reloading decks...');
      loadDecks();
    });

    return unsubscribe;
  }, [navigation]);

  const handleCreateDeck = async (name: string) => {
    try {
      const newDeck: Deck = {
        id: generateUUID(),
        name: name,
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalCards: 0,
        masteredCards: 0,
        learningCards: 0,
        color: theme.colors.primary,
      };

      await storage.saveDeck(newDeck);
      setIsCreateModalVisible(false);
      
      // Navigate to add card screen
      navigation.navigate('AddCard', { 
        deckId: newDeck.id,
        isFirstCard: true
      });
      
      loadDecks(); // Refresh the list in the background
    } catch (error) {
      console.error('Failed to create deck:', error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    Alert.alert(
      'Delete Deck',
      'Are you sure you want to delete this deck? This will delete all cards in the deck and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all cards in the deck
              const cards = await storage.getCardsForDeck(deckId);
              await Promise.all(cards.map(card => storage.deleteCard(card.id)));
              
              // Delete the deck
              await storage.deleteDeck(deckId);
              loadDecks();
            } catch (error) {
              console.error('Failed to delete deck:', error);
            }
          },
        },
      ],
    );
  };

  const renderDeckItem = useCallback(({ item: deck }: { item: Deck }) => {
    const translateX = getAnimationValue(deck.id);
    const deleteButtonWidth = 100;
    const progress = deck.totalCards > 0 
      ? (deck.masteredCards / deck.totalCards) * 100 
      : 0;

    // Add interpolation for border radius
    const borderRadius = translateX.interpolate({
      inputRange: [0, deleteButtonWidth * 0.3],
      outputRange: [16, 0],
      extrapolate: 'clamp'
    });

    const gesture = Gesture.Pan()
      .activeOffsetX([30, Infinity])
      .failOffsetY([-5, 5])
      .onUpdate((e) => {
        if (e.translationX <= 0) return;
        translateX.setValue(Math.max(0, Math.min(e.translationX, deleteButtonWidth * 1.1)));
      })
      .onEnd((e) => {
        const swipeVelocity = e.velocityX;
        const currentGestureTranslation = e.translationX;
        const overSwipeThreshold = deleteButtonWidth * 1.7;

        if (currentGestureTranslation > overSwipeThreshold && swipeVelocity > 200) {
          handleDeleteDeck(deck.id);
          swipeStateMap.current.set(deck.id, false);
        } else if (currentGestureTranslation > deleteButtonWidth / 2 || (swipeVelocity > 400 && currentGestureTranslation > deleteButtonWidth / 3)) {
          Animated.spring(translateX, {
            toValue: deleteButtonWidth,
            velocity: swipeVelocity,
            useNativeDriver: true,
          }).start();
          swipeStateMap.current.set(deck.id, true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            velocity: swipeVelocity,
            useNativeDriver: true,
          }).start();
          swipeStateMap.current.set(deck.id, false);
        }
      });

    const tapGesture = Gesture.Tap()
      .onEnd(() => {
        if (swipeStateMap.current.get(deck.id)) {
          // If the deck is swiped open, close it
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          swipeStateMap.current.set(deck.id, false);
        } else {
          // If the deck is not swiped open, navigate to detail
          navigation.navigate('DeckDetail', { deckId: deck.id });
        }
      });

    const composedGesture = Gesture.Race(gesture, tapGesture);

    return (
      <GestureHandlerRootView>
        <View style={styles.deckItemContainer}>
          <TouchableOpacity
            style={[
              styles.deleteActionContainer,
              { backgroundColor: theme.colors.error }
            ]}
            onPress={() => handleDeleteDeck(deck.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="delete-forever" size={30} color="white" />
            <Text style={styles.deleteActionText}>Delete</Text>
          </TouchableOpacity>

          <GestureDetector gesture={composedGesture}>
            <Animated.View style={{ transform: [{ translateX }] }}>
              <Animated.View
                style={[
                  styles.deckItem,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderTopLeftRadius: borderRadius,
                    borderBottomLeftRadius: borderRadius,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                  }
                ]}
              >
                <View style={styles.deckHeader}>
                  <MaterialCommunityIcons
                    name="cards"
                    size={24}
                    color={deck.color || theme.colors.primary}
                  />
                  <Text style={[styles.cardCount, { color: theme.colors.textSecondary }]}>
                    {deck.totalCards} cards
                  </Text>
                </View>

                <Text 
                  style={[styles.deckName, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {deck.name}
                </Text>

                {deck.description ? (
                  <Text 
                    style={[styles.deckDescription, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {deck.description}
                  </Text>
                ) : null}

                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.colors.border }
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: deck.color || theme.colors.primary,
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                    {Math.round(progress)}% mastered
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    );
  }, [theme, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={decks}
        renderItem={renderDeckItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="cards-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No decks yet. Tap + to create your first flashcard!
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB for creating new deck */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Create Deck Modal */}
      <CreateDeckModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreateDeck={handleCreateDeck}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  deckItem: {
    width: '100%',
    marginBottom: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCount: {
    fontSize: 12,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 'auto',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  headerButton: {
    marginRight: 16,
  },
  deckItemContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  deleteActionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: -1,
  },
  deleteActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
}); 