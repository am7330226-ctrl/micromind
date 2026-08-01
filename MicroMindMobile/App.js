import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StoreProvider, useStoreState } from './src/store/StoreContext';
import TabNavigator from './src/navigation/TabNavigator';

function MainContainer() {
  const { theme } = useStoreState();
  const colors = theme.colors;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} backgroundColor={colors.bgHeader} />
      <TabNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavigationContainer>
          <MainContainer />
        </NavigationContainer>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
