import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <div className="text-2xl font-bold text-gray-800">GenzTools</div>
        <Link
          to="/login"
          className="rounded bg-blue-500 px-4 py-2 font-bold text-white transition hover:bg-blue-600"
        >
          Login
        </Link>
      </nav>

      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">Welcome to GenzTools</h1>
        <p className="mb-12 text-xl text-gray-600">The ultimate toolkit for Gen Z creators and developers.</p>
        
        <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-lg bg-white p-8 shadow-md transition hover:shadow-lg">
            <div className="mb-4 text-4xl">🚀</div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Fast & Efficient</h3>
            <p className="text-gray-600">Build and deploy your ideas in record time with our optimized tools.</p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg bg-white p-8 shadow-md transition hover:shadow-lg">
            <div className="mb-4 text-4xl">🎨</div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Modern Design</h3>
            <p className="text-gray-600">Create stunning interfaces that resonate with the next generation.</p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg bg-white p-8 shadow-md transition hover:shadow-lg">
            <div className="mb-4 text-4xl">🔒</div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Secure & Reliable</h3>
            <p className="text-gray-600">Your data and projects are safe with our enterprise-grade security.</p>
          </div>
        </div>

        <div className="mt-16">
          <Link
            to="/login"
            className="inline-block rounded bg-gray-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-gray-800"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
}
