
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="home">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="fixtures" name="fixtures">
        <Icon sf="calendar" />
        <Label>Fixtures</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="trips" name="trips">
        <Icon sf="airplane" />
        <Label>Trips</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="wallet" name="wallet">
        <Icon sf="creditcard" />
        <Label>Wallet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
