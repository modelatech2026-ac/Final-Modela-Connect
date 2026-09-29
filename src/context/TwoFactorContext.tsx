/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  TwoFactorState,
  TwoFactorSecretResponse,
  generate2FASecret,
  generateBackupCodes,
  verify2FACode,
  validateBackupCode,
  getStoredTwoFactorState,
  saveStoredTwoFactorState,
  checkIsDeviceTrusted,
  setDeviceTrustedExpiry,
  clearDeviceTrusted,
} from "../services/twoFactorService";

interface TwoFactorContextType {
  // State
  isEnabled: boolean;
  isVerified: boolean;
  isDeviceTrusted: boolean;
  trustedUntil: number | null;
  activeSecretData: TwoFactorSecretResponse | null;
  backupCodes: string[];
  remainingBackupCodesCount: number;
  isLoading: boolean;
  error: string | null;

  // Modals & UI View Flags
  isSetupModalOpen: boolean;
  isVerificationModalOpen: boolean;
  isBackupCodesModalOpen: boolean;

  // Modal controls
  openSetupModal: () => Promise<void>;
  closeSetupModal: () => void;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
  openBackupCodesModal: () => void;
  closeBackupCodesModal: () => void;

  // Actions
  initiateSetup: () => Promise<TwoFactorSecretResponse>;
  confirmSetupWithCode: (code: string) => Promise<boolean>;
  verifySessionWithOtp: (code: string, trustDevice: boolean) => Promise<boolean>;
  verifyWithBackupCode: (backupCode: string) => Promise<boolean>;
  regenerateBackupCodes: () => Promise<string[]>;
  disable2FA: () => Promise<boolean>;
  clearError: () => void;
}

const TwoFactorContext = createContext<TwoFactorContextType | undefined>(undefined);

export const TwoFactorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { success, error: toastError, info } = useToast();

  const userEmail = currentUser?.email || "";

  // Core state from storage or defaults
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>(() =>
    getStoredTwoFactorState(userEmail)
  );
  const [activeSecretData, setActiveSecretData] = useState<TwoFactorSecretResponse | null>(null);
  const [isDeviceTrusted, setIsDeviceTrusted] = useState<boolean>(() =>
    checkIsDeviceTrusted(userEmail)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Open States
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState<boolean>(false);

  // Re-sync when currentUser changes
  useEffect(() => {
    if (userEmail) {
      const state = getStoredTwoFactorState(userEmail);
      setTwoFactorState(state);
      setIsDeviceTrusted(checkIsDeviceTrusted(userEmail));
    } else {
      setTwoFactorState({
        isEnabled: false,
        isVerified: false,
        trustedUntil: null,
        secret: null,
        otpauthUri: null,
        backupCodes: [],
        usedBackupCodes: [],
        lastVerifiedAt: null,
      });
      setIsDeviceTrusted(false);
      setActiveSecretData(null);
    }
  }, [userEmail]);

  // Sync state to localStorage whenever twoFactorState changes for the active user
  const persistState = useCallback(
    (newState: TwoFactorState) => {
      setTwoFactorState(newState);
      if (userEmail) {
        saveStoredTwoFactorState(userEmail, newState);
      }
    },
    [userEmail]
  );

  const clearError = () => setError(null);

  /**
   * Initiate 2FA Setup: generates key, QR SVG, and prepares 8 backup codes
   */
  const initiateSetup = useCallback(async (): Promise<TwoFactorSecretResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const secretData = await generate2FASecret(userEmail || "user@modela.io");
      setActiveSecretData(secretData);
      return secretData;
    } catch (err: any) {
      const msg = err.message || "Failed to initialize 2FA configuration.";
      setError(msg);
      toastError("2FA Setup Error", msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, toastError]);

  /**
   * Open Setup Modal and preload secret
   */
  const openSetupModal = useCallback(async () => {
    setIsSetupModalOpen(true);
    if (!activeSecretData) {
      await initiateSetup();
    }
  }, [activeSecretData, initiateSetup]);

  const closeSetupModal = useCallback(() => {
    setIsSetupModalOpen(false);
    setError(null);
  }, []);

  const openVerificationModal = useCallback(() => {
    setIsVerificationModalOpen(true);
  }, []);

  const closeVerificationModal = useCallback(() => {
    setIsVerificationModalOpen(false);
    setError(null);
  }, []);

  const openBackupCodesModal = useCallback(() => {
    setIsBackupCodesModalOpen(true);
  }, []);

  const closeBackupCodesModal = useCallback(() => {
    setIsBackupCodesModalOpen(false);
    setError(null);
  }, []);

  /**
   * Finalize 2FA setup by verifying the first 6-digit code
   */
  const confirmSetupWithCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!activeSecretData) {
        setError("Setup session timed out. Please restart the 2FA enrollment.");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await verify2FACode(code, activeSecretData.secret, false);
        if (!result.success) {
          setError(result.error || "Invalid 6-digit verification code.");
          return false;
        }

        // Generate initial emergency recovery codes
        const generatedCodes = generateBackupCodes();

        const newState: TwoFactorState = {
          isEnabled: true,
          isVerified: true,
          trustedUntil: null,
          secret: activeSecretData.secret,
          otpauthUri: activeSecretData.otpauthUri,
          backupCodes: generatedCodes,
          usedBackupCodes: [],
          lastVerifiedAt: new Date().toISOString(),
        };

        persistState(newState);
        setIsSetupModalOpen(false);
        setIsBackupCodesModalOpen(true); // Automatically present the backup codes to ensure user saves them!
        success(
          "Two-Factor Authentication Enabled",
          "Your account is now guarded by multi-factor security. Please store your backup codes safely."
        );
        return true;
      } catch (err: any) {
        const msg = err.message || "Failed to confirm 2FA code.";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [activeSecretData, persistState, success]
  );

  /**
   * Verify an active challenge during login or elevated clearance
   */
  const verifySessionWithOtp = useCallback(
    async (code: string, trustDevice: boolean): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await verify2FACode(code, twoFactorState.secret, trustDevice);
        if (!result.success) {
          setError(result.error || "Invalid or expired OTP code.");
          return false;
        }

        if (trustDevice && result.trustedUntil && userEmail) {
          setDeviceTrustedExpiry(userEmail, result.trustedUntil);
          setIsDeviceTrusted(true);
        }

        const newState: TwoFactorState = {
          ...twoFactorState,
          isVerified: true,
          trustedUntil: result.trustedUntil || twoFactorState.trustedUntil,
          lastVerifiedAt: new Date().toISOString(),
        };
        persistState(newState);

        setIsVerificationModalOpen(false);
        success("Identity Verified", "Two-factor challenge approved.");
        return true;
      } catch (err: any) {
        const msg = err.message || "2FA verification encountered an error.";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [twoFactorState, userEmail, persistState, success]
  );

  /**
   * Fallback: Consume an emergency backup code
   */
  const verifyWithBackupCode = useCallback(
    async (backupCode: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await validateBackupCode(backupCode, twoFactorState.backupCodes);
        if (!result.success) {
          setError(result.error || "Invalid backup recovery code.");
          return false;
        }

        // Move used code to used list
        const cleanUsed = backupCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
        const formattedUsed = `${cleanUsed.slice(0, 4)}-${cleanUsed.slice(4)}`;
        const updatedBackupCodes = twoFactorState.backupCodes.filter(
          (c) => c.replace(/[^A-Z0-9]/g, "") !== cleanUsed
        );
        const updatedUsedCodes = [...twoFactorState.usedBackupCodes, formattedUsed];

        const newState: TwoFactorState = {
          ...twoFactorState,
          isVerified: true,
          backupCodes: updatedBackupCodes,
          usedBackupCodes: updatedUsedCodes,
          lastVerifiedAt: new Date().toISOString(),
        };
        persistState(newState);

        setIsVerificationModalOpen(false);
        info(
          "Emergency Backup Code Accepted",
          `You have ${updatedBackupCodes.length} recovery codes remaining.`
        );
        return true;
      } catch (err: any) {
        const msg = err.message || "Error validating recovery code.";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [twoFactorState, persistState, info]
  );

  /**
   * Regenerate 8 fresh backup codes
   */
  const regenerateBackupCodes = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    try {
      const newCodes = generateBackupCodes();
      const newState: TwoFactorState = {
        ...twoFactorState,
        backupCodes: newCodes,
        usedBackupCodes: [],
      };
      persistState(newState);
      success("Backup Codes Regenerated", "Previous recovery codes are now void.");
      return newCodes;
    } finally {
      setIsLoading(false);
    }
  }, [twoFactorState, persistState, success]);

  /**
   * Disable 2FA
   */
  const disable2FA = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const clearedState: TwoFactorState = {
        isEnabled: false,
        isVerified: false,
        trustedUntil: null,
        secret: null,
        otpauthUri: null,
        backupCodes: [],
        usedBackupCodes: [],
        lastVerifiedAt: null,
      };
      persistState(clearedState);
      if (userEmail) {
        clearDeviceTrusted(userEmail);
      }
      setIsDeviceTrusted(false);
      setActiveSecretData(null);
      info("2FA Disabled", "Two-factor authentication has been turned off for this account.");
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, persistState, info]);

  return (
    <TwoFactorContext.Provider
      value={{
        isEnabled: twoFactorState.isEnabled,
        isVerified: twoFactorState.isVerified,
        isDeviceTrusted,
        trustedUntil: twoFactorState.trustedUntil,
        activeSecretData,
        backupCodes: twoFactorState.backupCodes,
        remainingBackupCodesCount: twoFactorState.backupCodes.length,
        isLoading,
        error,
        isSetupModalOpen,
        isVerificationModalOpen,
        isBackupCodesModalOpen,
        openSetupModal,
        closeSetupModal,
        openVerificationModal,
        closeVerificationModal,
        openBackupCodesModal,
        closeBackupCodesModal,
        initiateSetup,
        confirmSetupWithCode,
        verifySessionWithOtp,
        verifyWithBackupCode,
        regenerateBackupCodes,
        disable2FA,
        clearError,
      }}
    >
      {children}
    </TwoFactorContext.Provider>
  );
};

export const useTwoFactor = (): TwoFactorContextType => {
  const context = useContext(TwoFactorContext);
  if (!context) {
    throw new Error("useTwoFactor must be used within a TwoFactorProvider");
  }
  return context;
};
