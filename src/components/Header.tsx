import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, LogOut, Crown, AlertCircle, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { createCheckoutSession } from '../lib/stripe';
import { stripeProducts } from '../stripe-config';
import { AuthModal } from './auth/AuthModal';
import { EmailVerificationModal } from './EmailVerificationModal';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const { user, subscription, signOut, getUserTier, loading, error, authStep } = useAuth();
  const { checkEmailBeforePayment } = useEmailVerification();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const userTier = getUserTier();
  const isProUser = userTier === 'pro';
  const product = stripeProducts[0]; // Pro product

  const handleLogoClick = () => {
    if (user) {
      // Redirect to dashboard for authenticated users
      window.location.href = '/dashboard';
    } else {
      // Redirect to home for unauthenticated users
      window.location.href = '/';
    }
  };

  const handleSignInSuccess = () => {
    setShowAuthModal(false);
    // Redirect to dashboard after successful sign in
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 100);
  };

  const handleUpgradeClick = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check email verification before proceeding with payment
    const canProceed = await checkEmailBeforePayment();
    if (!canProceed) {
      setShowVerificationModal(true);
      return;
    }

    setIsUpgrading(true);

    try {
      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email address before upgrading');
        setShowVerificationModal(true);
      } else {
        toast.error(error.message || 'Failed to start upgrade process');
      }
      console.error('Upgrade error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button 
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.05 }}
            >
             <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl overflow-hidden">
  <img 
    src="/favicon.png" 
    alt="Lukisan Logo" 
    className="w-full h-full object-cover" 
  />
</div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Lukisan
              </span>
            </motion.button>

            <div className="flex items-center space-x-4">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm">Loading...</span>
                  {process.env.NODE_ENV === 'development' && (
                    <span className="text-xs text-gray-400">({authStep})</span>
                  )}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Auth Error</span>
                </div>
              )}

              {/* Authenticated User */}
              {user && !loading && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                    {isProUser && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {isProUser ? `${user.credits_remaining} credits` : `Free tier`}
                    </span>
                  </div>
                  
                  {/* Upgrade Button for Free Users */}
                  {!isProUser && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUpgradeClick}
                      disabled={isUpgrading}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {isUpgrading ? 'Processing...' : 'Upgrade'}
                      </span>
                    </motion.button>
                  )}
                  
                  {subscription?.subscription_status === 'active' && (
                    <div className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full border border-yellow-200">
                      <span className="text-sm font-medium">{product.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=6366F1&color=fff`}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={signOut}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </motion.button>
                </div>
              )}

              {/* Unauthenticated User */}
              {!user && !loading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleSignInSuccess}
      />

      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Email Verification Required"
        message="Please verify your email address before upgrading to Creator. This helps us protect your account and ensure you receive important updates about your subscription."
      />
    </>
  );
};