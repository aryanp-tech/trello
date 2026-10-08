import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../../services/authService";
import ThemeToggle from "../../../components/common/ThemeToggle";

const ResetPassword = () => {
  // reset password page that allows users to set a new password using a token from the reset email

  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(token, { password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 900);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // reset password form that collects the new password and confirmation, with validation and error handling
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 transition-colors dark:bg-[#111214]">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-colors dark:border-[#34363a] dark:bg-[#202225]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-md shadow-blue-500/20 dark:bg-[#5798f5]">
            ✓
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create a new password</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            minLength={6}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-[#45474d] dark:bg-[#17181a] dark:text-white dark:focus:border-[#5798f5]"
            required
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            minLength={6}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-[#45474d] dark:bg-[#17181a] dark:text-white dark:focus:border-[#5798f5]"
            required
          />
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
              Password updated. Redirecting to sign in...
            </p>
          )}

          {/* // submit button for updating the password, disabled when loading or after success */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-[#5798f5] dark:hover:bg-[#4387e8]"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {/* // link to return to the login page after resetting the password */}
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-blue-600 hover:underline dark:text-[#65a6ff]"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
};

export default ResetPassword;
