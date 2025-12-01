"use client";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600">The page you were looking for doesn't exist.</p>
      </div>
    </main>
  );
}
