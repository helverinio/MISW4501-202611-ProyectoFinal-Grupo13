import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

/**
 * Hashes the provided text using SHA-256 with a salt from environment config.
 * @param {string} textToHash - The plain text to hash (e.g., password)
 * @returns {Promise<string>} - The SHA-256 hashed string in hex format
 */
export default async function hashingUtility(textToHash) {
  const salt = Constants.expoConfig?.extra?.REACT_APP_HASH_SALT || '';
  const saltedText = salt + textToHash + salt;
  
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedText
  );
  
  return hash;
}
