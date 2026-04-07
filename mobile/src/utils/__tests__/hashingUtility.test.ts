import hashingUtility from '../hashingUtility';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

jest.mock('expo-crypto');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      REACT_APP_HASH_SALT: 'test-salt',
    },
  },
}));

const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;

describe('hashingUtility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash text using SHA-256', async () => {
    const expectedHash = 'abc123hashedvalue';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

    const result = await hashingUtility('password123');

    expect(result).toBe(expectedHash);
  });

  it('should call digestStringAsync with SHA256 algorithm', async () => {
    mockCrypto.digestStringAsync.mockResolvedValue('hash');

    await hashingUtility('myPassword');

    expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      expect.any(String)
    );
  });

  it('should salt the text with salt from config', async () => {
    mockCrypto.digestStringAsync.mockResolvedValue('hash');

    await hashingUtility('password');

    expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'test-saltpasswordtest-salt'
    );
  });

  it('should handle empty string input', async () => {
    const expectedHash = 'emptyhash';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

    const result = await hashingUtility('');

    expect(result).toBe(expectedHash);
    expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'test-salttest-salt'
    );
  });

  it('should handle special characters in input', async () => {
    const expectedHash = 'specialhash';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

    const result = await hashingUtility('p@$$w0rd!#%');

    expect(result).toBe(expectedHash);
    expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'test-saltp@$$w0rd!#%test-salt'
    );
  });

  it('should handle unicode characters in input', async () => {
    const expectedHash = 'unicodehash';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

    const result = await hashingUtility('пароль');

    expect(result).toBe(expectedHash);
  });

  it('should handle long input strings', async () => {
    const expectedHash = 'longhash';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);
    const longPassword = 'a'.repeat(1000);

    const result = await hashingUtility(longPassword);

    expect(result).toBe(expectedHash);
    expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `test-salt${longPassword}test-salt`
    );
  });

  it('should propagate errors from Crypto', async () => {
    const cryptoError = new Error('Crypto failed');
    mockCrypto.digestStringAsync.mockRejectedValue(cryptoError);

    await expect(hashingUtility('password')).rejects.toThrow('Crypto failed');
  });

  it('should produce consistent results for same input', async () => {
    const expectedHash = 'consistenthash';
    mockCrypto.digestStringAsync.mockResolvedValue(expectedHash);

    const result1 = await hashingUtility('samePassword');
    const result2 = await hashingUtility('samePassword');

    expect(result1).toBe(result2);
  });

  it('should be called with different salted text for different inputs', async () => {
    mockCrypto.digestStringAsync.mockResolvedValue('hash');

    await hashingUtility('password1');
    await hashingUtility('password2');

    expect(mockCrypto.digestStringAsync).toHaveBeenNthCalledWith(
      1,
      Crypto.CryptoDigestAlgorithm.SHA256,
      'test-saltpassword1test-salt'
    );
    expect(mockCrypto.digestStringAsync).toHaveBeenNthCalledWith(
      2,
      Crypto.CryptoDigestAlgorithm.SHA256,
      'test-saltpassword2test-salt'
    );
  });
});
