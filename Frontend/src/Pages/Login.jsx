import { useState } from "react";
import { API_URL, styles } from "./authStyles";
import { BookLogo } from "./AuthParts";
// import GoogleAuthButton from "./GoogleAuthButton";

// Props: onLogin(user) -> called after successful login
//        onGoToSignup()  -> called when user clicks "Create an account"
export default function Login({ onLogin, onGoToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Something went wrong." });
      } else {
        // Save the logged-in user so the Diary and Profile pages can show it
        localStorage.setItem(
          "user",
          JSON.stringify({ name: data.user.name, email: data.user.email })
        );
        if (data.token) localStorage.setItem("token", data.token);

        setMessage({ type: "success", text: "Welcome back!" });
        if (onLogin) onLogin(data.user);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Cannot reach the server. Is the backend running?" } ,err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <BookLogo />
        <p style={styles.brand}>VERITAS DIARY</p>
        <h1 style={styles.title}>A quiet place for your thoughts.</h1>
        <p style={styles.subtitle}>Keep the moments that matter, with privacy that feels effortless.</p>

        {message && <div style={styles.message(message.type)}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">EMAIL</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email}
              onChange={handleChange} style={styles.input} autoComplete="email" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">PASSWORD</label>
            <div style={styles.passwordWrap}>
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                placeholder="Your password" value={form.password} onChange={handleChange}
                style={{ ...styles.input, paddingRight: 70 }} autoComplete="current-password" required />
              <button type="button" style={styles.toggle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Please wait..." : "Enter diary"}
          </button>
        </form>

        {/* <GoogleAuthButton onLogin={onLogin} /> */}

        <button type="button" style={styles.switchBtn} onClick={onGoToSignup}>
          New here? Create an account
        </button>
        <p style={styles.note}>Your private and protected entries stay yours.</p>
      </div>
    </div>
  );
}