import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-700">404</h1>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
   <a
  href="/"
  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium"
>
  Go Home
</a>

      </div>
    </div>
  );
}