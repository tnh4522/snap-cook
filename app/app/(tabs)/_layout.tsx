import React from 'react';
import { Tabs } from 'expo-router';
import { Camera } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Snap & Cook',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
