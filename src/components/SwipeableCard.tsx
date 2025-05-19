import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
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
  const theme = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const [isPanning, setIsPanning] = useState(false);
  
  // Card rotation based on swipe
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  // Flip rotation
  const flipRotation = useRef(new Animated.Value(0)).current;
  const frontRotation = flipRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = flipRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
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
    extrapolate: 'clamp',
  });

  const correctOpacity = position.x.interpolate({
    inputRange: [SCREEN_WIDTH * 0.1, SCREEN_WIDTH * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const cardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, -SCREEN_WIDTH, 0, SCREEN_WIDTH, SCREEN_WIDTH * 1.5],
    outputRange: [0.8, 0.9, 1, 0.9, 0.8],
  });

  const forceSwipe = useCallback((direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'right') {
        onSwipeRight(card);
      } else {
        onSwipeLeft(card);
      }
      position.setValue({ x: 0, y: 0 });
      setIsPanning(false);
      onSwipeComplete();
    });
  }, [card, onSwipeLeft, onSwipeRight, onSwipeComplete, position]);

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
        return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderGrant: () => {
        setIsPanning(true);
        position.setOffset({
          x: position.x._value,
          y: position.y._value
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
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
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

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={StyleSheet.absoluteFill}
      >
        {/* Wrong indicator */}
        <Animated.View
          style={[
            styles.resultIndicator,
            styles.wrongIndicator,
            { opacity: wrongOpacity },
          ]}
        >
          <Text style={[styles.resultText, { color: theme.colors.error }]}>
            Incorrect
          </Text>
        </Animated.View>

        {/* Correct indicator */}
        <Animated.View
          style={[
            styles.resultIndicator,
            styles.correctIndicator,
            { opacity: correctOpacity },
          ]}
        >
          <Text style={[styles.resultText, { color: theme.colors.success }]}>
            Correct
          </Text>
        </Animated.View>

        {/* Front of card */}
        <TouchableWithoutFeedback onPress={handleCardTap}>
          <Animated.View
            style={[styles.card, frontStyle]}
          >
            <View style={[styles.content, styles.frontContent]}>
              <Text style={[styles.cardLabel, { color: theme.colors.primary }]}>
                Question
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                {card.front}
              </Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Back of card */}
        <TouchableWithoutFeedback onPress={handleCardTap}>
          <Animated.View
            style={[styles.card, styles.cardBack, backStyle]}
          >
            <View style={[styles.content, styles.backContent]}>
              <Text style={[styles.cardLabel, { color: theme.colors.primary }]}>
                Answer
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                {card.back}
              </Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 300,
    width: SCREEN_WIDTH - 40,
    alignSelf: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
    backgroundColor: '#EDF7ED', // Soft mint green for answers
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  frontContent: {
    backgroundColor: '#F5F6FF', // Soft blue for questions
  },
  backContent: {
    backgroundColor: '#EDF7ED', // Matching the back card color
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 24,
    textAlign: 'center',
  },
  resultIndicator: {
    position: 'absolute',
    top: '45%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  wrongIndicator: {
    left: 20,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  correctIndicator: {
    right: 20,
    borderWidth: 2,
    borderColor: '#00C851',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 