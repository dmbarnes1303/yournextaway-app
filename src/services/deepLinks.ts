
// Deep linking service
import * as Linking from 'expo-linking';

export function createDeepLink(path: string) {
  console.log('Creating deep link:', path);
  return Linking.createURL(path);
}

export function parseDeepLink(url: string) {
  console.log('Parsing deep link:', url);
  return Linking.parse(url);
}

export default {
  createDeepLink,
  parseDeepLink,
};
