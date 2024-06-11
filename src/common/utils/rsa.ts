import { constants, publicEncrypt } from 'crypto';

const encryptWithChunks = (data: string, publicKey: string): string => {
  const buffer = Buffer.from(data, 'utf8');
  const chunkSize = 128;
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  const encryptedChunks = chunks.map((chunk) =>
    publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      chunk,
    ),
  );
  return encryptedChunks.map((encryptedChunk) => encryptedChunk.toString('base64')).join('\n\n');
};

export function encryptWithPublicKey(data: string, publicKey: string): string {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );
    return encrypted.toString('base64');
  } catch (error) {
    if (error.message.includes('data too large for key size')) {
      return encryptWithChunks(data, publicKey);
    }
    throw error;
  }
}
