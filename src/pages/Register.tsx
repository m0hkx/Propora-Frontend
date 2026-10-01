import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { registerRequest } from "../api/auth";
import { Icon } from "../components/ui";
import { Icons } from "../components/icons";

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const user = await registerRequest(username, email, password);

            login(user);

            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <h1 className="auth-title">Set up your workspace</h1>
            <p className="auth-sub">Create an account to start adding properties and tenants.</p>

            <form onSubmit={handleRegister}>
                <div className="auth-fields">
                    <div className="auth-row">
                        <label htmlFor="register-username" className="auth-row-label">Username</label>
                        <input
                            id="register-username"
                            type="text"
                            placeholder="jordan"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="auth-row-input"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="auth-row">
                        <label htmlFor="register-email" className="auth-row-label">Email</label>
                        <input
                            id="register-email"
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
                        <label htmlFor="register-password" className="auth-row-label">Password</label>
                        <input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-row-input pr-18"
                            autoComplete="new-password"
                            minLength={8}
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
                    {submitting ? "Creating account…" : "Create account"}
                    {submitting ? null : <Icon icon={Icons.arrowRight} />}
                </button>
            </form>

            <p className="auth-alt">
                Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
        </>
    );
}
