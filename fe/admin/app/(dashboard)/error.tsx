'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-6">
      <div className="text-center space-y-4">
        <h1 className="font-semibold text-lg md:text-2xl">
          Something went wrong
        </h1>
        <p className="text-gray-500">
          Sorry, an error occurred. Please try again later.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
