import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">Marketplace</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/search" className="text-gray-700 hover:text-blue-600">
              Browse
            </Link>
            {user ? (
              <>
                <Link to="/sell" className="text-gray-700 hover:text-blue-600">
                  Sell
                </Link>
                <Link to="/messages" className="text-gray-700 hover:text-blue-600">
                  Messages
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-blue-600">
                  Orders
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600">
                  {user.firstName}
                </Link>
                <button
                  onClick={() => logout()}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}