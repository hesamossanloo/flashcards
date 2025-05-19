import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storage';
import { Card, Deck, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Props['navigation']>();
  const route = useRoute<Props['route']>();
  const storage = StorageService.getInstance();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const animationMap = useRef(new Map<string, Animated.Value>());
  const cardOpenState = useRef(new Map<string, boolean>());

  const getAnimationValue = (cardId: string) => {
    if (!animationMap.current.has(cardId)) {
      animationMap.current.set(cardId, new Animated.Value(0));
    }
    return animationMap.current.get(cardId)!;
  };

  const loadDeckAndCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const deckId = route.params?.deckId;
      console.log('Loading deck and cards for ID:', deckId);
      
      const loadedDeck = await storage.getDeck(deckId);
      console.log('Loaded deck:', loadedDeck);
      
      const loadedCards = await storage.getCardsForDeck(deckId);
      console.log('Loaded cards:', loadedCards);
      
      if (loadedDeck) {
        // Update deck with correct card count
        const updatedDeck = {
          ...loadedDeck,
          totalCards: loadedCards.length,
          updatedAt: new Date()
        };
        
        // Save the corrected deck
        await storage.saveDeck(updatedDeck);
        console.log('Updated deck with correct card count:', updatedDeck);
        
        setDeck(updatedDeck);
        setCards(loadedCards);

        // Update navigation title
        navigation.setOptions({
          title: updatedDeck.name,
          headerBackTitle: 'Decks',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'Decks'
                });
              }}
            />
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddCard', { deckId: updatedDeck.id })}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
        });
      }
    } catch (error) {
      console.error('Failed to load deck and cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigation, route.params?.deckId, theme.colors.primary]);

  // Load data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('DeckDetailScreen focused, reloading data...');
      loadDeckAndCards();
    }, [loadDeckAndCards])
  );

  const renderCard = ({ item: card, index }: { item: Card; index: number }) => {
    const translateX = getAnimationValue(card.id);
    const deleteButtonWidth = 100;
    const screenWidth = Dimensions.get('window').width;

    // Add interpolation for border radius
    const borderRadius = translateX.interpolate({
      inputRange: [0, deleteButtonWidth * 0.3],
      outputRange: [12, 0],
      extrapolate: 'clamp'
    });

    const performDeleteCard = async (cardIdToDelete: string) => {
      if (!deck) return;
      try {
        await storage.deleteCard(cardIdToDelete);
        animationMap.current.delete(cardIdToDelete);
        cardOpenState.current.delete(cardIdToDelete);
        const updatedDeck: Deck = {
          ...deck,
          totalCards: deck.totalCards - 1,
          updatedAt: new Date(),
        };
        await storage.saveDeck(updatedDeck);
        loadDeckAndCards();
      } catch (error) {
        console.error('Failed to delete card:', error);
        Alert.alert('Error', 'Failed to delete card');
      }
    };

    const handleDeletePress = () => {
      Alert.alert(
        "Delete Card",
        "Are you sure you want to delete this card?",
        [
          {
            text: "Cancel",
            onPress: () => {
              Animated.spring(translateX, {
                toValue: deleteButtonWidth,
                useNativeDriver: true,
              }).start();
              cardOpenState.current.set(card.id, true);
            },
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              cardOpenState.current.set(card.id, false);
              Animated.timing(translateX, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }).start(() => {
                performDeleteCard(card.id);
              });
            }
          }
        ]
      );
    };

    // Define TapGesture for card press
    const tapGesture = Gesture.Tap()
      .maxDuration(250) // Default is 500ms, shorten for snappier taps
      .onEnd((_event, success) => {
        if (success) {
          if (cardOpenState.current.get(card.id)) {
            cardOpenState.current.set(card.id, false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          } else {
            if (deck?.id) {
              navigation.navigate('EditCard', { deckId: deck.id, cardId: card.id });
            }
          }
        }
      });

    // Existing PanGesture for swipe
    const panGesture = Gesture.Pan()
      .activeOffsetX([30, Infinity])
      .failOffsetY([-5, 5])
      .onUpdate((e) => {
        translateX.setValue(Math.max(0, Math.min(e.translationX, deleteButtonWidth * 1.1)));
      })
      .onEnd((e) => {
        const swipeVelocity = e.velocityX;
        const currentGestureTranslation = e.translationX;
        const overSwipeThreshold = deleteButtonWidth * 1.7;

        if (currentGestureTranslation > overSwipeThreshold && swipeVelocity > 200) {
          Alert.alert(
            "Delete Card",
            "Are you sure you want to delete this card?",
            [
              {
                text: "Cancel",
                onPress: () => {
                  Animated.spring(translateX, {
                    toValue: deleteButtonWidth,
                    useNativeDriver: true,
                  }).start();
                  cardOpenState.current.set(card.id, true);
                },
                style: "cancel"
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  cardOpenState.current.set(card.id, false);
                  Animated.timing(translateX, {
                    toValue: screenWidth,
                    duration: 180,
                    useNativeDriver: true,
                  }).start(() => {
                    performDeleteCard(card.id);
                  });
                }
              }
            ]
          );
        } else if (currentGestureTranslation > deleteButtonWidth / 2 || (swipeVelocity > 400 && currentGestureTranslation > deleteButtonWidth / 3)) {
          cardOpenState.current.set(card.id, true);
          Animated.spring(translateX, {
            toValue: deleteButtonWidth,
            velocity: swipeVelocity,
            useNativeDriver: true,
          }).start();
        } else {
          cardOpenState.current.set(card.id, false);
          Animated.spring(translateX, {
            toValue: 0,
            velocity: swipeVelocity,
            useNativeDriver: true,
          }).start();
        }
      });

    // Compose gestures
    const composedGesture = Gesture.Race(panGesture, tapGesture);

    const animatedCardStyle = [
      styles.cardContainer,
      { 
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
      },
      { transform: [{ translateX }] },
      { zIndex: 1 }
    ];

    return (
      <View style={styles.renderCardItemOuterContainer}>
        <TouchableOpacity
          style={[
            styles.deleteActionContainer,
            { 
              backgroundColor: theme.colors.error,
              zIndex: 0,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            },
          ]}
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete-forever" size={30} color="white" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={animatedCardStyle}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardNumber, { color: theme.colors.textSecondary }]}>
                Card {index + 1}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardSide}>
                <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                  Front
                </Text>
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {card.front}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.cardSide}>
                <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                  Back
                </Text>
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {card.back}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.statsContainer}>
                <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
                  Correct: {card.correctCount}
                </Text>
                <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
                  Incorrect: {card.incorrectCount}
                </Text>
              </View>
              <Text style={[styles.levelText, { color: theme.colors.primary }]}>
                Level {card.level}
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  if (isLoading || !deck) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.statsHeader, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {deck.totalCards}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Cards
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {deck.masteredCards}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Mastered
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {deck.learningCards}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Learning
          </Text>
        </View>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.listFlex}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cards-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No cards yet. Tap + to add your first card!
            </Text>
          </View>
        }
      />

      {cards.length > 0 && (
        <TouchableOpacity
          style={[styles.studyButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('StudySession', { deckId: deck.id })}
        >
          <MaterialCommunityIcons name="brain" size={24} color="white" />
          <Text style={styles.studyButtonText}>Start Study Session</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listFlex: {
    flex: 1,
  },
  cardContainer: {
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  cardSide: {
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statsText: {
    fontSize: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studyButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  studyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
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
  },
  deleteActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  renderCardItemOuterContainer: {
    marginBottom: 16,
    position: 'relative',
  },
}); 