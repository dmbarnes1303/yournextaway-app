
// Local storage service
import * as SecureStore from 'expo-secure-store';

export async function saveData(key: string, value: string) {
  console.log('Saving data to storage:', key);
  try {

