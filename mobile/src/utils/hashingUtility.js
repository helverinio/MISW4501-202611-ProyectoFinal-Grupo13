import Constants from 'expo-constants';

export default async function hashingUtility(textToHash) {
  const combinedString = textToHash + Constants.expoConfig?.extra?.REACT_APP_HASH_SALT;
  console.log("hashingUtility",Constants.expoConfig?.extra?.REACT_APP_HASH_SALT);
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const charCode = combinedString.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
  }
  const hashString = hash.toString();

  return hashString;
}
