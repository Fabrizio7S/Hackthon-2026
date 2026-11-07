import { StatusBar } from 'expo-status-bar';

import { FavorsScreen } from './src/features/favors/FavorsScreen';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <FavorsScreen />
    </>
  );
}
