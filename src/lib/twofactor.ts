import * as CryptoES from 'crypto-es';

/**
 * Access the crypto-es library.
 */
// @ts-ignore
const getLib = () => {
  if (typeof CryptoES === 'undefined') return null;
  // @ts-ignore
  const anyCrypto = CryptoES as any;
  const lib = (anyCrypto.default && anyCrypto.default.AES) ? anyCrypto.default : (anyCrypto.AES ? anyCrypto : null);
  
  if (lib) {
    if (lib.Utf8 && (!lib.enc || !lib.enc.Utf8)) {
        if (!lib.enc) lib.enc = {};
        lib.enc.Utf8 = lib.Utf8;
    }
    if (lib.Hex && (!lib.enc || !lib.enc.Hex)) {
        if (!lib.enc) lib.enc = {};
        lib.enc.Hex = lib.Hex;
    }
    return lib;
  }
  return null;
};

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_2FA_ENCRYPTION_KEY || 'favorites-social-2fa-secret-key-2026';

/**
 * Encrypts a string (e.g. 2FA secret).
 */
export const encryptSecret = (text: string): string => {
  try {
    const lib = getLib();
    if (!lib || !lib.AES) return text;
    return lib.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

/**
 * Decrypts a string.
 */
export const decryptSecret = (encryptedText: string): string => {
  try {
    const lib = getLib();
    if (!lib || !lib.AES || !lib.enc || !lib.enc.Utf8) return encryptedText;
    const bytes = lib.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(lib.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
};

/**
 * Generates a random Base32 string (simulated secret).
 */
export const generateSecret = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates recovery codes.
 */
export const generateRecoveryCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * TOTP verification logic.
 * Calculates the expected token based on the secret and current time.
 */
export const verifyTOTP = (token: string, secret: string): boolean => {
  if (!token || token.length !== 6 || !/^\d+$/.test(token)) return false;
  
  try {
    const lib = getLib();
    if (!lib || !lib.HmacSHA1 || !lib.enc || !lib.enc.Hex) {
      // Fallback for demonstration if crypto-es is not fully available
      return false;
    }

    // Base32 decode the secret
    const base32ToHex = (base32: string) => {
      const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let bits = '';
      let hex = '';
      for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += val.toString(2).padStart(5, '0');
      }
      for (let i = 0; i + 4 <= bits.length; i += 4) {
        const chunk = bits.substr(i, 4);
        hex = hex + parseInt(chunk, 2).toString(16);
      }
      return hex;
    };

    const key = lib.enc.Hex.parse(base32ToHex(secret));
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const time = lib.enc.Hex.parse(Math.floor(epoch / 30).toString(16).padStart(16, '0'));
    
    const hmac = lib.HmacSHA1(time, key).toString();
    const offset = parseInt(hmac.substring(hmac.length - 1), 16);
    const otp = (parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff) + '';
    const expectedToken = otp.substr(otp.length - 6, 6).padStart(6, '0');
    
    // Check current window and also +/- 1 window to account for clock drift
    if (token === expectedToken) return true;
    
    // Previous window
    const timePrev = lib.enc.Hex.parse(Math.floor((epoch - 30) / 30).toString(16).padStart(16, '0'));
    const hmacPrev = lib.HmacSHA1(timePrev, key).toString();
    const offsetPrev = parseInt(hmacPrev.substring(hmacPrev.length - 1), 16);
    const otpPrev = (parseInt(hmacPrev.substr(offsetPrev * 2, 8), 16) & 0x7fffffff) + '';
    const expectedTokenPrev = otpPrev.substr(otpPrev.length - 6, 6).padStart(6, '0');
    if (token === expectedTokenPrev) return true;

    // Next window
    const timeNext = lib.enc.Hex.parse(Math.floor((epoch + 30) / 30).toString(16).padStart(16, '0'));
    const hmacNext = lib.HmacSHA1(timeNext, key).toString();
    const offsetNext = parseInt(hmacNext.substring(hmacNext.length - 1), 16);
    const otpNext = (parseInt(hmacNext.substr(offsetNext * 2, 8), 16) & 0x7fffffff) + '';
    const expectedTokenNext = otpNext.substr(otpNext.length - 6, 6).padStart(6, '0');
    if (token === expectedTokenNext) return true;

    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};
