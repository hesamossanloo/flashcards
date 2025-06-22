import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { theme } from "../assets/themes/theme";
import { Card } from "../types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_OUT_DURATION = 200;

interface Props {
  card: Card;
  onSwipeLeft: (card: Card) => void;
  onSwipeRight: (card: Card) => void;
  onSwipeComplete: () => void;
  isFlipped: boolean;
  onFlip: () => void;
}

export const SwipeableCard: React.FC<Props> = ({
  card,
  onSwipeLeft,
  onSwipeRight,
  onSwipeComplete,
  isFlipped,
  onFlip,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const [isPanning, setIsPanning] = useState(false);

  // Card rotation based on swipe
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ["-30deg", "0deg", "30deg"],
  });

  // Flip rotation
  const flipRotation = useRef(new Animated.Value(0)).current;
  const frontRotation = flipRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotation = flipRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  // Update flip animation when isFlipped changes
  React.useEffect(() => {
    Animated.spring(flipRotation, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  // Handle card tap
  const handleCardTap = () => {
    if (!isPanning) {
      onFlip();
    }
  };

  // Opacity and scale animations for the result indicators
  const wrongOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.3, -SCREEN_WIDTH * 0.1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const correctOpacity = position.x.interpolate({
    inputRange: [SCREEN_WIDTH * 0.1, SCREEN_WIDTH * 0.3],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const cardScale = position.x.interpolate({
    inputRange: [
      -SCREEN_WIDTH * 1.5,
      -SCREEN_WIDTH,
      0,
      SCREEN_WIDTH,
      SCREEN_WIDTH * 1.5,
    ],
    outputRange: [0.8, 0.9, 1, 0.9, 0.8],
  });

  const forceSwipe = useCallback(
    (direction: "right" | "left") => {
      const x =
        direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }).start(() => {
        if (direction === "right") {
          onSwipeRight(card);
        } else {
          onSwipeLeft(card);
        }
        position.setValue({ x: 0, y: 0 });
        setIsPanning(false);
        onSwipeComplete();
      });
    },
    [card, onSwipeLeft, onSwipeRight, onSwipeComplete, position]
  );

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start(() => {
      setIsPanning(false);
    });
  }, [position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only handle horizontal movements greater than 10 pixels
        return (
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy)
        );
      },
      onPanResponderGrant: () => {
        setIsPanning(true);
        position.setOffset({
          x: (position as any).__getValue().x,
          y: (position as any).__getValue().y,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 }); // Lock to horizontal movement
      },
      onPanResponderRelease: (_, gesture) => {
        setIsPanning(false);
        position.flattenOffset();

        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        setIsPanning(false);
        position.flattenOffset();
        resetPosition();
      },
    })
  ).current;

  const frontStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotation },
      { scale: cardScale },
      { rotateY: frontRotation },
    ],
  };

  const backStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotation },
      { scale: cardScale },
      { rotateY: backRotation },
    ],
  };

  // Animated overlay opacities for swipe feedback
  const leftOverlayOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.5, 0],
    outputRange: [0.5, 0],
    extrapolate: "clamp",
  });
  const rightOverlayOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.5],
    outputRange: [0, 0.5],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Animated swipe overlays */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.swipeOverlay,
          styles.leftOverlay,
          { opacity: leftOverlayOpacity },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.swipeOverlay,
          styles.rightOverlay,
          { opacity: rightOverlayOpacity },
        ]}
      />
      <Animated.View {...panResponder.panHandlers} style={styles.container}>
        {/* Card */}
        <TouchableWithoutFeedback onPress={handleCardTap}>
          <View style={styles.cardContainer}>
            {/* Front of card */}
            <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                frontStyle,
                { backgroundColor: theme.colors.cardBackground },
              ]}
              pointerEvents="box-none"
            >
              <Text style={[styles.cardText, { color: theme.colors.text }]}>
                {card.front}
              </Text>
            </Animated.View>

            {/* Back of card */}
            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                backStyle,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              pointerEvents="box-none"
            >
              <Text style={[styles.cardText, { color: theme.colors.text }]}>
                {card.back}
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.large,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: theme.colors.cardBackground,
  },
  cardBack: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  cardText: {
    ...theme.typography.body,
    textAlign: "center",
    lineHeight: 24,
  },
  resultIndicator: {
    position: "absolute",
    top: 50,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 2,
    zIndex: 1,
  },
  wrongIndicator: {
    left: 20,
    borderColor: theme.colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  correctIndicator: {
    right: 20,
    borderColor: theme.colors.success,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  resultText: {
    ...theme.typography.body,
    fontWeight: "bold",
  },
  swipeOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    zIndex: 2,
  },
  leftOverlay: {
    left: 0,
    backgroundColor: "rgba(239, 68, 68, 0.5)", // red
  },
  rightOverlay: {
    right: 0,
    backgroundColor: "rgba(16, 185, 129, 0.5)", // green
  },
});
