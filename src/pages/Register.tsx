import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { registerRequest } from "../api/auth";
import { Icon } from "../components/ui";
import { Icons } from "../components/icons";
import LogoMark from "../components/Logo";

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
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-[400px] rise">
                <div className="flex flex-col items-center gap-2.5 mb-6">
                    <div className="brand-mark size-[52px]">
                        <LogoMark size={34} />
                    </div>
                    <span className="brand-name font-display text-xl">Propora</span>
                </div>

                <div className="card overflow-hidden p-0">
                    <div className="h-1.5 bg-gradient-to-r from-secondary to-primary" />
                    <div className="p-6">
                        <h1 className="font-display text-[22px] m-0">Create your account</h1>
                        <p className="text-muted-foreground text-sm mt-1 mb-6">
                            Start managing your portfolio.
                        </p>

                        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                            <div className="field">
                                <label htmlFor="register-username">Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <Icon d={Icons.users} />
                                    </span>
                                    <input
                                        id="register-username"
                                        type="text"
                                        placeholder="jordan"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="register-email">Email</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <Icon d={Icons.mail} />
                                    </span>
                                    <input
                                        id="register-email"
                                        type="email"
                                        placeholder="you@propora.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="register-password">Password</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <Icon d={Icons.lock} />
                                    </span>
                                    <input
                                        id="register-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <Icon d={showPassword ? Icons.eyeOff : Icons.eye} />
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="bg-[#FEE2E2] text-[#B91C1C] text-[13px] font-semibold px-3 py-2.5 rounded-chip"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-teal justify-center mt-1.5"
                                disabled={submitting}
                            >
                                {submitting ? "Creating account..." : "Create account"}
                            </button>
                        </form>

                        <p className="text-muted-foreground text-sm mt-4 text-center">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
