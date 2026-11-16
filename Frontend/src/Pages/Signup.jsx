import { useState } from "react";
import { API_URL, styles } from "./authStyles";
import { BookLogo, GoogleButton } from "./AuthParts";

// Props: onSignupSuccess(email) -> called after account is created (e.g. go to Login)
//        onGoToLogin()          -> called when user clicks "Already have an account?"
export default function Signup({ onSignupSuccess, onGoToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (form.password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Something went wrong." });
      } else {
        setMessage({ type: "success", text: "Account created. Please log in." });
        if (onSignupSuccess) onSignupSuccess(form.email);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Cannot reach the server. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <BookLogo />
        <p style={styles.brand}>VERITAS DIARY</p>
        <h1 style={styles.title}>Start your private diary.</h1>
        <p style={styles.subtitle}>Create an account and keep your thoughts safe.</p>

        {message && <div style={styles.message(message.type)}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="name">NAME</label>
            <input id="name" name="name" type="text" placeholder="Your name" value={form.name}
              onChange={handleChange} style={styles.input} autoComplete="name" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">EMAIL</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email}
              onChange={handleChange} style={styles.input} autoComplete="email" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="phone">PHONE</label>
            <input id="phone" name="phone" type="tel" placeholder="Your phone number" value={form.phone}
              onChange={handleChange} style={styles.input} autoComplete="tel" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">PASSWORD</label>
            <div style={styles.passwordWrap}>
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters" value={form.password} onChange={handleChange}
                style={{ ...styles.input, paddingRight: 70 }} autoComplete="new-password" required />
              <button type="button" style={styles.toggle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Please wait..." : "Create account"}
          </button>
        </form>

        <GoogleButton />

        <button type="button" style={styles.switchBtn} onClick={onGoToLogin}>
          Already have an account? Log in
        </button>
        <p style={styles.note}>Your private and protected entries stay yours.</p>
      </div>
    </div>
  );
}