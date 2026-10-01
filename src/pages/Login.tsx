import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { loginRequest } from "../api/auth";
import { Icon } from "../components/ui";
import { Icons } from "../components/icons";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const user = await loginRequest(email, password);

            login(user);

            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <h1 className="auth-title">Open your portfolio</h1>
            <p className="auth-sub">Sign in with the email you registered with.</p>

            <form onSubmit={handleLogin}>
                <div className="auth-fields">
                    <div className="auth-row">
                        <label htmlFor="login-email" className="auth-row-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-row-input"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-row">
                        <label htmlFor="login-password" className="auth-row-label">Password</label>
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-row-input pr-18"
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="auth-toggle"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && <div role="alert" className="auth-error">{error}</div>}

                <button type="submit" className="auth-submit" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                    {submitting ? null : <Icon icon={Icons.arrowRight} />}
                </button>
            </form>

            <p className="auth-alt">
                New to Propora? <Link to="/register" className="auth-link">Create an account</Link>
            </p>
        </>
    );
}
