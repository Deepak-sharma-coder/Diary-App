// Small shared pieces used by both Login and Signup
import { styles } from "./authStyles";

export function BookLogo() {
  return (
    <div style={styles.logo}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 6.5C10.5 5 8 4.5 3 4.5v14c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-14c-5 0-7.5.5-9 2z" />
        <path d="M12 6.5v14" />
      </svg>
    </div>
  );
}

export function GoogleButton() {
  return (
    <>
      <div style={styles.divider}>
        <span style={styles.line} /> OR <span style={styles.line} />
      </div>
      {/* UI only: real Google login needs Google OAuth setup */}
      <button type="button" style={styles.googleBtn} onClick={() => alert("Google login is not set up yet.")}>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.5-9.5 6.5-16.2z" />
          <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.3v5.7C7.9 41.1 15.4 46 24 46z" />
          <path fill="#FBBC05" d="M11.6 28c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4v-5.7H4.3C2.8 17.2 2 20.5 2 24s.8 6.8 2.3 9.7L11.6 28z" />
          <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.3 30 2 24 2 15.4 2 7.9 6.9 4.3 14.3l7.3 5.7c1.7-5.3 6.6-9.2 12.4-9.2z" />
        </svg>
        Continue with Google
      </button>
    </>
  );
}