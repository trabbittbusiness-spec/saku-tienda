import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        // Lazy mount: tabs only render when the user first navigates to them
        lazy: true,
        // Mantiene las pantallas en memoria después de visitarlas
        unmountOnBlur: false,
        // Freeze inactive tabs to stop unnecessary re-renders
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

