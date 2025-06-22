import { MaterialCommunityIcons } from "@expo/vector-icons";
// @ts-ignore
import { useNavigation } from "@react-navigation/native";
// @ts-ignore
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { theme } from "../assets/themes/theme";
import CreateDeckModal from "../components/CreateDeckModal";
import DeckCard from "../components/DeckCard";
import { StorageService } from "../services/storage";
import { Deck, RootStackParamList } from "../types";
import { generateUUID } from "../utils/uuid";

export default function DecksScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const storage = StorageService.getInstance();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [swipedDecks, setSwipedDecks] = useState<{ [id: string]: boolean }>({});

  const animationMap = useRef(new Map<string, Animated.Value>()).current;

  const getAnimationValue = (deckId: string) => {
    if (!animationMap.has(deckId)) {
      const animatedValue = new Animated.Value(0);
      animatedValue.addListener(({ value }) => {
        setSwipedDecks((prev) => ({ ...prev, [deckId]: value > 10 }));
      });
      animationMap.set(deckId, animatedValue);
    }
    return animationMap.get(deckId)!;
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
            masteredCards: cards.filter((card) => card.level >= 5).length,
            learningCards: cards.filter(
              (card) => card.level > 0 && card.level < 5
            ).length,
            reviewedCards: cards.filter((card) => !!card.lastReviewed).length,
            updatedAt: new Date(),
          };
        })
      );

      // Save the updated decks
      await Promise.all(updatedDecks.map((deck) => storage.saveDeck(deck)));

      console.log("Updated decks with correct counts:", updatedDecks);
      setDecks(updatedDecks);
    } catch (error) {
      console.error("Failed to load decks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add focus effect to reload decks when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("DecksScreen focused, reloading decks...");
      loadDecks();
    });

    return unsubscribe;
  }, [navigation]);

  const handleCreateDeck = async (name: string) => {
    try {
      const newDeck: Deck = {
        id: generateUUID(),
        name: name,
        description: "",
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
      (navigation as NativeStackNavigationProp<RootStackParamList>).navigate(
        "AddCard",
        {
          deckId: newDeck.id,
          isFirstCard: true,
        }
      );

      loadDecks(); // Refresh the list in the background
    } catch (error) {
      console.error("Failed to create deck:", error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    Alert.alert(
      "Delete Deck",
      "Are you sure you want to delete this deck? This will delete all cards in the deck and cannot be undone.",
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
              // Delete all cards in the deck
              const cards = await storage.getCardsForDeck(deckId);
              await Promise.all(
                cards.map((card) => storage.deleteCard(card.id))
              );

              // Delete the deck
              await storage.deleteDeck(deckId);
              loadDecks();
            } catch (error) {
              console.error("Failed to delete deck:", error);
            }
          },
        },
      ]
    );
  };

  const handleDeckPress = useCallback(
    (deck: Deck) => {
      navigation.navigate("DeckDetail", { deckId: deck.id });
    },
    [navigation]
  );

  const renderDeckItem = useCallback(
    ({ item: deck }: { item: Deck }) => {
      const translateX = getAnimationValue(deck.id);
      const deleteButtonWidth = 100;

      const panGesture = Gesture.Pan()
        .activeOffsetX([10, 9999]) // Only allow swiping right
        .failOffsetY([-5, 5])
        .onUpdate((e) => {
          // Only allow swiping right (positive X)
          const newX = Math.max(
            0,
            Math.min(e.translationX, deleteButtonWidth * 1.5)
          );
          translateX.setValue(newX);
        })
        .onEnd((e) => {
          const toValue =
            e.translationX > deleteButtonWidth / 2 || e.velocityX > 500
              ? deleteButtonWidth
              : 0;
          Animated.spring(translateX, {
            toValue,
            useNativeDriver: true,
          }).start();
        });

      const tapGesture = Gesture.Tap().onEnd(() => {
        const currentX = (translateX as any)._value;
        if (currentX !== 0) {
          // If swiped, close it on tap
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          navigation.navigate("DeckDetail", { deckId: deck.id });
        }
      });

      const composedGesture = Gesture.Race(panGesture, tapGesture);

      return (
        <GestureHandlerRootView>
          <View style={styles.deckItemContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, { width: deleteButtonWidth }]}
              onPress={() => handleDeleteDeck(deck.id)}
            >
              <MaterialCommunityIcons
                name="delete-forever-outline"
                size={30}
                color="#ffffff"
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <GestureDetector gesture={composedGesture}>
              <Animated.View
                style={{
                  transform: [{ translateX }],
                }}
              >
                <DeckCard
                  deck={deck}
                  onPress={() => {}}
                  sharpLeft={!!swipedDecks[deck.id]}
                  reviewedCards={deck.reviewedCards}
                />
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      );
    },
    [animationMap, navigation, handleDeleteDeck, swipedDecks]
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={decks}
        renderItem={renderDeckItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="cards-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
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
    padding: theme.spacing.lg,
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: "absolute",
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.large,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    ...theme.typography.body,
    textAlign: "center",
    color: theme.colors.textSecondary,
  },
  deckItemContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "stretch", // Ensure children fill the same height
    marginBottom: theme.spacing.lg,
  },
  deleteButton: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: theme.roundness,
    borderBottomLeftRadius: theme.roundness,
    zIndex: 0,
  },
  deleteButtonText: {
    color: "#ffffff",
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
});
