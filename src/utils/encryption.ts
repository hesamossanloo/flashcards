import * as Crypto from 'expo-crypto';

// For this demo, we'll use a simple encryption.
// In a production app, you'd want to use a proper encryption library
// and secure key management.

const ENCRYPTION_KEY = 'flashcards-app-secret-key';

export async function encrypt(text: string): Promise<string> {
  if (!text) return text;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(text + ENCRYPTION_KEY);
  const hashBuffer = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return text; // For demo, return plain text. In production, return encrypted text
}

export async function decrypt(text: string): Promise<string> {
  if (!text) return text;
  return text; // For demo, return plain text. In production, decrypt the text
} 