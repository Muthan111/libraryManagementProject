import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, setToken } from "../utils/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please provide email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "include",
      });

      if (res.status === 401) {
        setMessage("Invalid email or password.");
        return;
      }

      if (!res.ok) {
        setMessage("Unable to login right now.");
        return;
      }

      const data = await res.json();
      if (data?.access_token) {
        setToken(data.access_token);
        navigate("/");
      } else {
        setMessage("Login succeeded but no token returned.");
      }
    } catch (err) {
      setMessage("Login failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-box">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message && <p className="account-message">{message}</p>}
      </section>
    </main>
  );
};

export default Login;
