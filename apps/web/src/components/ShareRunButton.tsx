import { useState, useEffect } from 'react';
import Button from './ui/Button.js';

interface ShareRunButtonProps {
  jobId: string;
}

const ShareRunButton = ({ jobId }: ShareRunButtonProps) => {
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const shareUrl = `${window.location.origin}/run/${jobId}`;

  const handleShare = async () => {
    try {
      // Try to use the Clipboard API
      await navigator.clipboard.writeText(shareUrl);

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      // Fallback: show modal with readonly input
      console.warn('Clipboard API failed, showing modal fallback:', err);
      setShowModal(true);
    }
  };

  // Add global keyboard listener for Alt+C shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        handleShare();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <>
      <Button
        onClick={handleShare}
        variant="secondary"
        size="sm"
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
        }
        title="Share this run (Alt+C)"
        aria-label="Share this run"
      >
        Share
      </Button>

      {/* Success Toast */}
      {showToast && (
        <div
          className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 animate-slide-up"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Link copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Fallback Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Share Run
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Copy the link below to share this run:
            </p>

            <input
              type="text"
              value={shareUrl}
              readOnly
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono"
              onFocus={(e) => e.target.select()}
            />

            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                size="sm"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Try to select and copy manually
                  const input = document.querySelector(
                    'input[readonly]',
                  ) as HTMLInputElement;
                  if (input) {
                    input.select();
                    document.execCommand('copy');
                  }
                  setShowModal(false);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                variant="primary"
                size="sm"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareRunButton;
