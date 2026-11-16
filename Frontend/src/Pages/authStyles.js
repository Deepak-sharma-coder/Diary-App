// Shared styles + colors for Login and Signup (same look on both pages)
export const API_URL = "http://localhost:5000"; // change if backend runs elsewhere

export const colors = {
  bg: "#e4ded3",
  brown: "#755634",
  input: "#f3eee8", 
  border: "#e6dfd5",
  text: "#1f1b16",
  muted: "#7a736a",
};

export const styles = {
 page: {
  minHeight: "100vh",
  width: "100%",
  margin: 0,
  padding: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  boxSizing: "border-box",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  color: colors.text,
},
  card: { 
    width: "100%",
    maxWidth: "440px", 
    margin: '0'
  },

  logo: {
    width: 60, height: 60, borderRadius: 16, background: colors.brown,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: colors.brown, margin: "0 0 14px" },
  title: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 34, fontWeight: 400, lineHeight: 1.15, margin: "0 0 14px",
  },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 1.5, margin: "0 0 28px" },
  label: { display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px" },
  field: { marginBottom: 18 },
  input: {
    width: "100%", boxSizing: "border-box", padding: "16px 18px", fontSize: 16,
    color: colors.text, background: colors.input, border: `1px solid ${colors.border}`,
    borderRadius: 12, outline: "none",
  },
  passwordWrap: { position: "relative" },
  toggle: {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: colors.brown, fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  primaryBtn: {
    width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, color: "#fff",
    background: colors.brown, border: "none", borderRadius: 12, cursor: "pointer", marginTop: 4,
  },
  divider: {
    display: "flex", alignItems: "center", gap: 14, margin: "22px 0",
    color: colors.muted, fontSize: 12, letterSpacing: "0.1em",
  },
  line: { flex: 1, height: 1, background: colors.border },
  googleBtn: {
    width: "100%", padding: "15px", fontSize: 16, fontWeight: 500, color: colors.text,
    background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 12, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  },
  switchBtn: {
    display: "block", margin: "24px auto 10px", background: "none", border: "none",
    color: colors.brown, fontWeight: 700, fontSize: 15, cursor: "pointer",
  },
  note: { textAlign: "center", color: colors.muted, fontSize: 13, margin: 0 },
  message: (type) => ({
    padding: "12px 14px", borderRadius: 10, fontSize: 14, marginBottom: 16,
    background: type === "error" ? "#fbeaea" : "#e9f4ea",
    color: type === "error" ? "#9b2c2c" : "#2f6b3a",
  }),
};