import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ searchQuery, onSearchChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navbar component that displays the application logo, search bar, user profile button, and logout button
  return (
    <header className="w-full border-b border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-[#292c31] dark:bg-[#111214]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-sm font-bold text-white">
            T
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">Trello</div>
        </div>

        <div className="flex flex-1 items-center justify-center px-2">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700 dark:border-slate-600 dark:bg-[#2a2f3d] dark:text-slate-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-400 dark:text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-white"
            />
          </div>
        </div>

        {/* // User profile buttons if logged out shows login button */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-2 py-1.5 text-left hover:bg-slate-200 dark:border-slate-600 dark:bg-[#2a2f3d] dark:hover:bg-[#343a4b]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-xs font-bold text-white">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs text-slate-500 dark:text-slate-300">Signed in</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.username || "User"}
              </p>
            </div>
          </button>

            {/* // Logout button that calls */}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
