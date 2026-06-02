'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CancelledContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');

  // Map reason codes to user-friendly messages
  const getReasonMessage = (reasonCode) => {
    const reasonMessages = {
      'user_terminated': 'You cancelled the payment process.',
      'timeout': 'The payment session timed out.',
      'bank_declined': 'Your bank declined the transaction.',
    };
    return reasonMessages[reasonCode] || 'The payment was cancelled.';
  };

  return (
    <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Comic-style card */}
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
          {/* Cancelled burst effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400 rounded-full opacity-20"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
          
          {/* Cancelled Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-orange-500 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 text-black" style={{ fontFamily: 'var(--font-bangers)' }}>
            PAYMENT CANCELLED
          </h1>
          
          {/* Comic speech bubble */}
          <div className="bg-orange-100 border-3 border-orange-400 rounded-lg p-3 mb-6 relative">
            <p className="text-center text-orange-700 font-bold text-lg">
              ⚡ Transaction Interrupted! ⚡
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-orange-100"></div>
          </div>

          {/* Cancellation Details */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-4 mb-6 space-y-2">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Order ID:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300">{orderId}</span>
              </div>
            )}
            <div className="mt-3">
              <span className="text-gray-600 font-medium block mb-1">Reason:</span>
              <p className="text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-200">
                {getReasonMessage(reason)}
              </p>
            </div>
          </div>

          {/* Info message */}
          <p className="text-center text-gray-600 text-sm mb-6">
            No payment was processed. You can try registering again whenever you're ready.
            Your cart items are still saved!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/events" className="block w-full">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                COMPLETE REGISTRATION
              </button>
            </Link>
            <Link href="/" className="block w-full">
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                BACK TO HOME
              </button>
            </Link>
          </div>

          {/* Support link */}
          <p className="text-center text-gray-500 text-xs mt-4">
            Changed your mind? <Link href="/events" className="text-blue-500 hover:underline">Browse Events</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CancelledContent />
    </Suspense>
  );
}
