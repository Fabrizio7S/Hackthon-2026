import { useMemo, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

export function useFavorDeck(lastCardIndex: number) {
  const [cardIndex, setCardIndex] = useState(0);

  const [cardOffset] = useState(() => new Animated.Value(0));

  const cardSwipe = useMemo(() => {
    function resetOffset() {
      Animated.spring(cardOffset, { toValue: 0, useNativeDriver: false }).start();
    }

    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy, numberActiveTouches }) =>
        lastCardIndex > 0 &&
        numberActiveTouches === 1 &&
        Math.abs(dx) > 12 &&
        Math.abs(dx) > Math.abs(dy) * 1.3,
      onPanResponderGrant: () => cardOffset.setValue(0),
      onPanResponderMove: (_, { dx }) => cardOffset.setValue(dx),
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 64) {
          resetOffset();
          return;
        }
        const step = dx < 0 ? 1 : -1;
        setCardIndex((index) => Math.max(0, Math.min(lastCardIndex, index + step)));
        cardOffset.setValue(0);
      },
      onPanResponderTerminate: resetOffset,
    });
  }, [cardOffset, lastCardIndex]);

  const cardRotation = useMemo(
    () =>
      cardOffset.interpolate({
        inputRange: [-160, 0, 160],
        outputRange: ['-9deg', '0deg', '9deg'],
        extrapolate: 'clamp',
      }),
    [cardOffset],
  );
  return { cardIndex, setCardIndex, cardOffset, cardSwipe, cardRotation };
}
