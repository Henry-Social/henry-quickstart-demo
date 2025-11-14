"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-[#44c57e]">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">We couldn&apos;t load this page</h1>
        <p className="mt-2 text-gray-600">{error.message || "Unknown error"}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-[#44c57e] px-4 py-2 text-white hover:bg-[#3aaa6a]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
