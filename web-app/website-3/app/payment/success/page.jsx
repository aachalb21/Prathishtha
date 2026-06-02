'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');

  return (
    <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Comic-style card */}
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
          {/* Success burst effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
          
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-500 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 text-black" style={{ fontFamily: 'var(--font-bangers)' }}>
            PAYMENT SUCCESS!
          </h1>
          
          {/* Comic speech bubble */}
          <div className="bg-yellow-300 border-3 border-black rounded-lg p-3 mb-6 relative">
            <p className="text-center text-black font-bold text-lg">
              🎉 BOOM! You're registered! 🎉
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-yellow-300"></div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-4 mb-6 space-y-2">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Order ID:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300">{orderId}</span>
              </div>
            )}
            {txnId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Transaction ID:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300">{txnId}</span>
              </div>
            )}
          </div>

          {/* Info message */}
          <p className="text-center text-gray-600 text-sm mb-6">
            A confirmation email has been sent to your registered email address. 
            You can view your registered events in your dashboard.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard" className="block w-full">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                GO TO DASHBOARD
              </button>
            </Link>
            <Link href="/events" className="block w-full">
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                EXPLORE MORE EVENTS
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
