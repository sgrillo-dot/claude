import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from './src/ui/components';
import { GameScreen } from './src/ui/GameScreen';
import { PagellaScreen, StartScreen } from './src/ui/screens/StartScreen';
import { colors } from './src/ui/theme';
import { useGame } from './src/ui/useGame';

function Root() {
  const game = useGame();
  const { state } = game;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      {!game.loaded ? null : !state ? (
        <StartScreen onStart={game.start} />
      ) : state.finito ? (
        <PagellaScreen state={state} onRestart={() => game.start(state.nome, state.preferenza)} />
      ) : (
        <GameScreen game={game} state={state} />
      )}
      <Toast toast={game.toast} onHide={game.hideToast} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
