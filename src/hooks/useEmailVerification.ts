import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkEmailVerificationStatus } from '../lib/emailVerification';

export const useEmailVerification = () => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsVerified(null);
        setIsLoading(false);
        return;
      }

      try {
        // First check the user object from auth context
        if (user.is_email_verified !== undefined) {
          setIsVerified(user.is_email_verified);
          setIsLoading(false);
          return;
        }

        // Fallback to API check
        const verified = await checkEmailVerificationStatus();
        setIsVerified(verified);
      } catch (error) {
        console.error('Error checking email verification status:', error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  const requireEmailVerification = (action: () => void, onBlocked?: () => void) => {
    if (!user) {
      return false;
    }

    if (isVerified) {
      action();
      return true;
    } else {
      onBlocked?.();
      return false;
    }
  };

  return {
    isVerified,
    isLoading,
    requireEmailVerification,
    needsVerification: user && !isVerified,
  };
};