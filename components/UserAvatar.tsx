import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface UserAvatarProps {
  displayName: string;
  size?: number;
  showDot?: boolean;
}

export function UserAvatar({ displayName, size = 44, showDot = false }: UserAvatarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const fontSize = size * 0.4;
  const dotSize = size * 0.28;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.accent,
          },
        ]}>
        <Text style={[styles.initial, { fontSize, color: '#fff' }]}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e53e3e',
    borderWidth: 2,
  },
});
