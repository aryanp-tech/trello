import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../services/authService";

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
    <main className="flex min-h-screen items-center justify-center bg-[#111214] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#34363a] bg-[#202225] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5798f5] text-xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Create a new password</h1>
          <p className="mt-2 text-sm text-white/55">
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
            className="w-full rounded-xl border border-[#45474d] bg-[#17181a] px-3.5 py-3 text-sm text-white outline-none focus:border-[#5798f5]"
            required
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            minLength={6}
            className="w-full rounded-xl border border-[#45474d] bg-[#17181a] px-3.5 py-3 text-sm text-white outline-none focus:border-[#5798f5]"
            required
          />
          {error && (
            <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">
              Password updated. Redirecting to sign in...
            </p>
          )}

          {/* // submit button for updating the password, disabled when loading or after success */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-[#5798f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4387e8] disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {/* // link to return to the login page after resetting the password */}
        <Link
          to="/login"
          className="mt-6 block text-center text-sm text-[#65a6ff] hover:underline"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
};

export default ResetPassword;
