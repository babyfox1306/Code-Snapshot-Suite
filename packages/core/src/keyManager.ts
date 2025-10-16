import { createHash, randomBytes } from 'crypto';

export interface LicenseKey {
  key: string;
  encrypted: string;
  isValid: boolean;
  features: string[];
}

export class LicenseKeyManager {
  private readonly saltLength = 16;

  /**
   * Generate a salt for hashing
   */
  private generateSalt(): string {
    return randomBytes(this.saltLength).toString('hex');
  }

  /**
   * Encrypt a license key (simplified for MVP)
   */
  encryptKey(licenseKey: string): string {
    const salt = this.generateSalt();
    const hash = createHash('sha256');
    hash.update(licenseKey + salt);
    const encrypted = hash.digest('hex');
    return `${salt}:${encrypted}`;
  }

  /**
   * Decrypt a license key (simplified for MVP)
   */
  decryptKey(encryptedKey: string): string | null {
    try {
      const [salt, hash] = encryptedKey.split(':');
      if (!salt || !hash) {
        return null;
      }
      
      // For MVP, we'll just validate the format
      // In a real implementation, you'd need the original key to verify
      return 'VALID_KEY'; // Simplified for MVP
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate a license key format
   */
  validateKeyFormat(key: string): boolean {
    // Simple validation - in production, this would be more sophisticated
    // Format: SNAP-XXXX-XXXX-XXXX-XXXX (20 characters + 4 dashes)
    const keyPattern = /^SNAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return keyPattern.test(key);
  }

  /**
   * Check if a license key is valid
   */
  validateKey(key: string): LicenseKey {
    const isValid = this.validateKeyFormat(key);
    
    return {
      key,
      encrypted: isValid ? this.encryptKey(key) : '',
      isValid,
      features: isValid ? ['timeline-chart', 'markdown-export', 'auto-clean'] : []
    };
  }

  /**
   * Check if Pro features are enabled
   */
  isProEnabled(storedKey: string): boolean {
    if (!storedKey) {
      return false;
    }

    try {
      const decryptedKey = this.decryptKey(storedKey);
      return decryptedKey !== null && this.validateKeyFormat(storedKey.split(':')[0] || '');
    } catch {
      return false;
    }
  }

  /**
   * Generate a demo license key for testing
   */
  generateDemoKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SNAP-';
    
    for (let i = 0; i < 4; i++) {
      if (i > 0) result += '-';
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  /**
   * Get available Pro features
   */
  getProFeatures(): string[] {
    return [
      'timeline-chart',
      'markdown-export', 
      'auto-clean',
      'advanced-search',
      'bulk-operations'
    ];
  }

  /**
   * Check if a specific feature is available
   */
  hasFeature(storedKey: string, feature: string): boolean {
    // For MVP, if we have any stored key, all features are available
    if (!storedKey) {
      return false;
    }

    const features = this.getProFeatures();
    return features.includes(feature);
  }
}
