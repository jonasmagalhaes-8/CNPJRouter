import CryptoJS from "crypto-js";

const SECRET_KEY = "BI-INTELLIGENCE-KEY-2024";

export function decryptPayload<T>(encryptedData: string): T {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData) as T;
  } catch (error) {
    console.error("Failed to decrypt payload", error);
    throw new Error("Decryption Error");
  }
}

export function encryptPayload(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}
