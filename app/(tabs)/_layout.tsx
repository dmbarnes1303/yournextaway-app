
import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { theme } from '@/src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fixtures"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="airplane"
              android_material_icon_name="flight"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="wallet.pass.fill"
              android_material_icon_name="account-balance-wallet"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
