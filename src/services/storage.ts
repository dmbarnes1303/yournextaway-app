
// Local storage service
import * as SecureStore from 'expo-secure-store';

export async function saveData(key: string, value: string) {
  console.log('Saving data to storage:', key);
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export async function getData(key: string) {
  console.log('Getting data from storage:', key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
}

export async function removeData(key: string) {
  console.log('Removing data from storage:', key);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error removing data:', error);
  }
}

export default {
  saveData,
  getData,
  removeData,
};
