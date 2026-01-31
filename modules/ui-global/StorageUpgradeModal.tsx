"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface StorageUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: {
    name: string;
    storageGB: number;
  };
  storageUsed: number;
  storageQuota: number;
}

export const StorageUpgradeModal: React.FC<StorageUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan = { name: 'Current Plan', storageGB: 0 },
  storageUsed,
  storageQuota,
}) => {
  // Use window.location as fallback if router is not available context
  const router = useRouter(); 

  const usagePercent = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;
  const usedGB = storageUsed / 1024 / 1024 / 1024;
  const quotaGB = storageQuota / 1024 / 1024 / 1024;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Redirect to billing page - ensure this path is correct for wildmindcanvas or redirects to main app
    // Assuming wildmindcanvas is on a subdomain or same domain where /account/billing is accessible
    // For now, using window.open to be safe if it's a different app/port
    window.open(process.env.NEXT_PUBLIC_MAIN_APP_URL ? `${process.env.NEXT_PUBLIC_MAIN_APP_URL}/account/billing` : '/account/billing', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1b26] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 z-10 border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 leading-tight">
              Storage Limit Reached
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Can't create new content
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
            You've used <strong className="text-white">{usagePercent.toFixed(1)}%</strong> of your
            storage quota. Upgrade to continue creating amazing content.
          </p>

          {/* Storage Visual */}
          <div className="bg-gray-100 dark:bg-[#252630] rounded-xl p-4 border border-gray-200 dark:border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Current Usage
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {usedGB.toFixed(2)} GB / {quotaGB.toFixed(2)} GB
              </span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 text-center">
              Free up space or upgrade for more storage
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
          >
            Upgrade Plan
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition font-medium text-gray-700 dark:text-gray-300 text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
