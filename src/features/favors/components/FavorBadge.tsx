import { Text } from 'react-native';
import { styles } from '../styles/favors.styles';

export function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}
