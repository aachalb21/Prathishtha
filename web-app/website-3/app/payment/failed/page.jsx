'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'no_response': 'No response received from payment gateway.',
      'decryption_error': 'Failed to process payment response.',
      'invalid_signature': 'Invalid payment signature detected.',
      'order_not_found': 'Order not found in our system.',
      'server_error': 'An unexpected server error occurred.',
    };
    return errorMessages[errorCode] || decodeURIComponent(errorCode || 'Payment could not be processed.');
  };

  return (
    <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Comic-style card */}
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
          {/* Error burst effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-400 rounded-full opacity-20"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-400 rounded-full opacity-20"></div>
          
          {/* Failed Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-500 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-shake">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 text-black" style={{ fontFamily: 'var(--font-bangers)' }}>
            PAYMENT FAILED!
          </h1>
          
          {/* Comic speech bubble */}
          <div className="bg-red-100 border-3 border-red-400 rounded-lg p-3 mb-6 relative">
            <p className="text-center text-red-700 font-bold text-lg">
              💥 OOPS! Something went wrong! 💥
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-red-100"></div>
          </div>

          {/* Error Details */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-4 mb-6 space-y-2">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Order ID:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300">{orderId}</span>
              </div>
            )}
            <div className="mt-3">
              <span className="text-gray-600 font-medium block mb-1">Error:</span>
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>

          {/* Info message */}
          <p className="text-center text-gray-600 text-sm mb-6">
            Don't worry! Your money has not been deducted. If any amount was debited, 
            it will be refunded within 5-7 business days.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/events" className="block w-full">
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                TRY AGAIN
              </button>
            </Link>
            <Link href="/dashboard" className="block w-full">
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                GO TO DASHBOARD
              </button>
            </Link>
          </div>

          {/* Support link */}
          <p className="text-center text-gray-500 text-xs mt-4">
            Need help? <Link href="/contact" className="text-blue-500 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}
