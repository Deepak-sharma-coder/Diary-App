import { Svg, BookIcon, UserIcon, LockIcon, LinkIcon } from "./AddDiary";
import "./style.css";

/* ---------- logged-in user ---------- */
// Reads the user your login page saved in localStorage under "user".
export const getLoggedInUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u && (u.name || u.email)) {
      return { name: u.name || "User", email: u.email || "" };
    }
  } catch {
    /* ignore bad data */
  }
  return { name: "Guest", email: "" };
};

/* ---------- icons used only on this page ---------- */
const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);

const ShieldCheckIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

const ChevronRightIcon = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
    <path d="M16 16l4-4-4-4" />
    <path d="M20 12H9" />
  </Svg>
);

/* ---------- bottom navigation (shared with Diary.jsx) ---------- */
export const BottomNav = ({ active, onDiary, onAdd, onProfile }) => (
  <nav className="bottom-nav">
    <button
      className={`bottom-nav-item${active === "diary" ? " active" : ""}`}
      onClick={onDiary}
    >
      <BookIcon size={26} />
      Diary
    </button>
    <button className="bottom-nav-fab" aria-label="New entry" onClick={onAdd}>
      +
    </button>
    <button
      className={`bottom-nav-item${active === "profile" ? " active" : ""}`}
      onClick={onProfile}
    >
      <UserIcon size={26} />
      Profile
    </button>
  </nav>
);

const ACCOUNT_ROWS = (email) => [
  { key: "email", Icon: MailIcon, title: "Email address", sub: email || "Not available" },
  { key: "pin", Icon: LockIcon, title: "Protected entries", sub: "4-digit PIN" },
  { key: "share", Icon: LinkIcon, title: "Public sharing", sub: "Share links only" },
];

const Profile = ({ user, onSignOut, onDiary, onAdd }) => {
  const initial = (user.name || "?").charAt(0).toUpperCase();

  return (
    <div className="pf-page">
      {/* User details */}
      <div className="pf-user-card">
        <div className="pf-avatar">{initial}</div>
        <div>
          <h1 className="pf-name">{user.name}</h1>
          {user.email && <p className="pf-email">{user.email}</p>}
        </div>
      </div>

      {/* Privacy promise */}
      <h2 className="pf-section-label">Privacy promise</h2>
      <div className="pf-promise">
        <span className="pf-promise-icon">
          <ShieldCheckIcon size={30} />
        </span>
        <span>
          Your entries are yours. Private pages never leave your account, and protected
          pages require your separate PIN.
        </span>
      </div>

      {/* Account */}
      <h2 className="pf-section-label">Account</h2>
      <div className="pf-list">
        {ACCOUNT_ROWS(user.email).map(({ key, Icon, title, sub }) => (
          <button key={key} className="pf-row">
            <span className="pf-row-icon">
              <Icon size={22} />
            </span>
            <span className="pf-row-text">
              <p className="pf-row-title">{title}</p>
              <p className="pf-row-sub">{sub}</p>
            </span>
            <span className="pf-chevron">
              <ChevronRightIcon size={22} />
            </span>
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button className="pf-sign-out" onClick={onSignOut}>
        <LogoutIcon size={20} />
        Sign out
      </button>

      <p className="pf-footer">Veritas Diary · A quiet place to return to</p>

      <BottomNav active="profile" onDiary={onDiary} onAdd={onAdd} onProfile={() => {}} />
    </div>
  );
};

export default Profile;