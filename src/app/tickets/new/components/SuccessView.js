import { FiCheckCircle, FiCopy } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';

export default function SuccessView({ ticketNumber, ticketLink, onReset }) {
  const router = useRouter();
  const toast = useToast();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!', { duration: 3000 });
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
            <FiCheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Ticket Created Successfully
        </h2>
        
        <p className="text-sm text-gray-500 mb-1">
          Ticket Number: <span className="font-mono font-medium">{ticketNumber}</span>
        </p>
        
        <p className="text-sm text-gray-600 mb-4">
          Your ticket has been submitted. You'll receive updates via email.
        </p>

        <div className="bg-gray-50 rounded border border-gray-200 p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Share this link to track the ticket:</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={ticketLink}
              readOnly
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white font-mono"
              aria-label="Ticket link"
            />
            <button
              onClick={() => copyToClipboard(ticketLink)}
              className="p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
              aria-label="Copy link"
            >
              <FiCopy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => router.push(ticketLink.replace(window.location.origin, ''))}
            className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
          >
            View Ticket
          </button>
          <button
            onClick={onReset}
            className="px-4 py-1.5 bg-white text-gray-600 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
          >
            Create Another
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-3">
          Redirecting in 5 seconds...
        </p>
      </div>
    </div>
  );
}