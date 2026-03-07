import { View, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface RatingStarsProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function RatingStars({ rating, size = 18, interactive = false, onRate }: RatingStarsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const starColor = Colors[colorScheme].star;
  const emptyColor = Colors[colorScheme].border;

  const handlePress = (starIndex: number, isLeftHalf: boolean) => {
    if (!interactive || !onRate) return;
    const newRating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    onRate(newRating === rating ? 0 : newRating);
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = rating >= i + 1;
        const halfFilled = !filled && rating >= i + 0.5;

        const iconName = filled ? 'star' : halfFilled ? 'star-half-o' : 'star-o';

        if (interactive) {
          return (
            <View key={i} style={{ flexDirection: 'row' }}>
              <Pressable onPress={() => handlePress(i, true)} hitSlop={4}>
                <View style={{ width: size / 2, overflow: 'hidden' }}>
                  <FontAwesome
                    name={filled || halfFilled ? 'star' : 'star-o'}
                    size={size}
                    color={filled || halfFilled ? starColor : emptyColor}
                  />
                </View>
              </Pressable>
              <Pressable onPress={() => handlePress(i, false)} hitSlop={4}>
                <View style={{ width: size / 2, overflow: 'hidden', marginLeft: -(size / 2) }}>
                  <View style={{ marginLeft: -(size / 2) }}>
                    <FontAwesome
                      name={filled ? 'star' : 'star-o'}
                      size={size}
                      color={filled ? starColor : emptyColor}
                    />
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }

        return (
          <FontAwesome
            key={i}
            name={iconName}
            size={size}
            color={filled || halfFilled ? starColor : emptyColor}
            style={{ marginRight: 2 }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
