import { useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Flashcard } from '../types';

interface FlashCardProps {
  card: Flashcard;
  onFlip?: () => void;
}

export default function FlashCard({ card, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  const flipCard = () => {
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
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <TouchableOpacity onPress={flipCard} activeOpacity={1}>
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        <Text style={styles.text}>{card.front}</Text>
      </Animated.View>
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <Text style={styles.text}>{card.back}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width - 40; // 20px padding on each side

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#f8f8f8',
    position: 'absolute',
    top: 0,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  },
}); 