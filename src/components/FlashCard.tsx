import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanGestureHandler,
  State,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../assets/themes/theme";
import { Flashcard } from "../types";

interface FlashCardProps {
  card: Flashcard;
  onFlip?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const { width, height } = Dimensions.get("window");
const cardWidth = width - 48; // 24px padding on each side
const cardHeight = height * 0.4; // 40% of screen height

export default function FlashCard({
  card,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));

  const panRef = useRef(null);

  const flipCard = () => {
    // Add a small scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }, { scale: scaleAnim }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }, { scale: scaleAnim }],
  };

  const cardContainerStyle = {
    transform: [{ translateX }, { rotate: rotateAnim }],
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;

      if (
        Math.abs(translationX) > cardWidth * 0.3 ||
        Math.abs(velocityX) > 500
      ) {
        // Swipe threshold met
        const toValue = translationX > 0 ? cardWidth * 1.5 : -cardWidth * 1.5;

        Animated.timing(translateX, {
          toValue,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Reset position and call appropriate callback
          translateX.setValue(0);
          if (translationX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        });
      } else {
        // Return to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={[styles.container, cardContainerStyle]}>
        <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
          {/* Front of card */}
          <Animated.View
            style={[styles.card, styles.cardFront, frontAnimatedStyle]}
          >
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={24}
                  color="rgba(255,255,255,0.7)"
                  style={styles.cardIcon}
                />
                <Text style={styles.cardText}>{card.front}</Text>
                <View style={styles.flipHint}>
                  <MaterialCommunityIcons
                    name="rotate-3d-variant"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.flipHintText}>Tap to flip</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Back of card */}
          <Animated.View
            style={[styles.card, styles.cardBack, backAnimatedStyle]}
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.tertiary]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={24}
                  color="rgba(255,255,255,0.7)"
                  style={styles.cardIcon}
                />
                <Text style={styles.cardText}>{card.back}</Text>
                <View style={styles.flipHint}>
                  <MaterialCommunityIcons
                    name="rotate-3d-variant"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.flipHintText}>Tap to flip back</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 20,
    ...theme.shadows.large,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    position: "absolute",
  },
  cardBack: {
    position: "absolute",
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    padding: theme.spacing.lg,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    marginBottom: theme.spacing.md,
  },
  cardText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 32,
    marginBottom: theme.spacing.lg,
  },
  flipHint: {
    position: "absolute",
    bottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  flipHintText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginLeft: theme.spacing.xs,
    fontWeight: "500",
  },
});
