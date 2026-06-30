import * as CryptoES from 'crypto-es';

/**
 * Access the crypto-es library in a way that works for both ESM and CommonJS.
 */
// @ts-ignore
const getLib = () => {
  if (typeof CryptoES === 'undefined') {
    return null;
  }
  
  // @ts-ignore
  const anyCrypto = CryptoES as any;
  const lib = (anyCrypto.default && anyCrypto.default.AES) ? anyCrypto.default : (anyCrypto.AES ? anyCrypto : null);
  
  if (lib) {
    // Normalize Utf8 and enc.Utf8
    if (lib.Utf8 && (!lib.enc || !lib.enc.Utf8)) {
        if (!lib.enc) lib.enc = {};
        lib.enc.Utf8 = lib.Utf8;
    }
    if (lib.Hex && (!lib.enc || !lib.enc.Hex)) {
        if (!lib.enc) lib.enc = {};
        lib.enc.Hex = lib.Hex;
    }
    if (lib.Latin1 && (!lib.enc || !lib.enc.Latin1)) {
        if (!lib.enc) lib.enc = {};
        lib.enc.Latin1 = lib.Latin1;
    }
    return lib;
  }

  return null;
};

const SYSTEM_KEY = process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY || 'favorites-social-secret-key-2026';

/**
 * Derives a chat-specific key from the system key and a chat-specific salt.
 * This ensures each chat has its own unique encryption key.
 */
const getChatKey = (chatSalt?: string) => {
  if (!chatSalt || (typeof chatSalt !== 'string' && typeof chatSalt !== 'number') || chatSalt === 'undefined' || chatSalt === 'null') {
    console.log(`[Crypto] getChatKey: Using SYSTEM_KEY (salt is ${typeof chatSalt}: ${chatSalt})`);
    return SYSTEM_KEY;
  }
  return `${SYSTEM_KEY}-${chatSalt}`;
};

export const encryptMessage = (text: string, chatSalt?: string): string => {
  try {
    if (!text) return '';
    const activeLib = getLib();
    if (!activeLib || !activeLib.AES) {
      return text;
    }
    const key = getChatKey(chatSalt);
    const encrypted = activeLib.AES.encrypt(text, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

export const decryptMessage = (encryptedText: string, chatSalt?: string): string => {
  try {
    if (!encryptedText) {
      return '';
    }

    if (!encryptedText.startsWith('U2FsdGVkX1')) {
      return encryptedText;
    }

    const activeLib = getLib();
    if (!activeLib || !activeLib.AES || !activeLib.enc || !activeLib.enc.Utf8) {
      return encryptedText;
    }
    
    const key = getChatKey(chatSalt);
    const cleanEncryptedText = encryptedText.trim();
    const bytes = activeLib.AES.decrypt(cleanEncryptedText, key);
    
    let decrypted = '';
    try {
      decrypted = bytes.toString(activeLib.enc.Utf8);
    } catch (e) {
      // Ignore
    }
    
    if (!decrypted) {
      // If decryption with chat-specific key fails, try with system key (for backward compatibility)
      if (chatSalt && chatSalt !== 'undefined') {
        const fallbackBytes = activeLib.AES.decrypt(cleanEncryptedText, SYSTEM_KEY);
        const fallbackDecrypted = fallbackBytes.toString(activeLib.enc.Utf8);
        if (fallbackDecrypted) {
          return fallbackDecrypted;
        }
      }
      return encryptedText;
    }
    
    return decrypted;
  } catch (error) {
    return encryptedText;
  }
};
