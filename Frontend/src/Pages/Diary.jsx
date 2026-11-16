import { useState, useMemo, useEffect } from "react";
import Profile, { BottomNav, getLoggedInUser } from "./Profile";

import AddDiary, {
  hashPin,
  LinkIcon,
  LockIcon,
  EyeOffIcon,
  RefreshIcon,
  SunIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
} from "./AddDiary";

import "./style.css";

const FILTERS = ["All", "Private", "Protected", "Public"];
const STORAGE_KEY = "diary_entries";

const visibilityIcon = {
  public: <LinkIcon />,
  protected: <LockIcon />,
  private: <EyeOffIcon />,
};

const loadEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const formatEntryDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* Shows one entry. Protected entries ask for the PIN first.
   Edit and Delete only appear once the entry is unlocked. */
const EntryViewer = ({ entry, onClose, onEdit, onDelete }) => {
  const needsPin = entry.visibility === "protected";
  const [unlocked, setUnlocked] = useState(!needsPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUnlock = async () => {
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }
    if ((await hashPin(pin)) === entry.pinHash) {
      setUnlocked(true);
      setError("");
    } else {
      setError("That PIN is incorrect. Try again.");
      setPin("");
    }
  };

  return (
    <div className="dy-overlay" onClick={onClose}>
      <div className="dy-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dy-modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon size={22} />
        </button>

        <span className="dy-entry-date">
          {formatEntryDate(entry.date)}
          {entry.updatedAt && " · edited"}
        </span>
        <h2 className="dy-modal-title">{entry.title}</h2>

        {unlocked ? (
          <>
            <p className="dy-modal-body">{entry.content || "No text in this entry."}</p>

            {entry.photos?.length > 0 && (
              <div className="dy-photo-grid">
                {entry.photos.map((src, i) => (
                  <img key={i} src={src} alt="" className="dy-photo" />
                ))}
              </div>
            )}

            <div className="dy-meta-row">
              {entry.mood && <span className="dy-mood">{entry.mood}</span>}
              {entry.tags?.map((t) => (
                <span key={t} className="dy-tag">
                  #{t}
                </span>
              ))}
            </div>

            {confirmDelete ? (
              <div className="dy-confirm-box">
                <p className="dy-confirm-text">Delete this entry? This cannot be undone.</p>
                <div className="dy-confirm-actions">
                  <button className="dy-cancel-btn" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                  <button className="dy-confirm-delete-btn" onClick={() => onDelete(entry.id)}>
                    Yes, delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="dy-action-row">
                <button className="dy-edit-btn" onClick={() => onEdit(entry)}>
                  <EditIcon size={18} />
                  Edit
                </button>
                <button className="dy-delete-btn" onClick={() => setConfirmDelete(true)}>
                  <TrashIcon size={18} />
                  Delete
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="dy-pin-label" htmlFor="unlock-pin">
              4-DIGIT PIN
            </label>
            <input
              id="unlock-pin"
              className="dy-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            {error && <p className="dy-error">{error}</p>}
            <button className="dy-primary-btn" onClick={handleUnlock}>
              Unlock entry
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Diary = ({ onSignOut }) => {
  const [entries, setEntries] = useState(loadEntries);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [openEntry, setOpenEntry] = useState(null);
  const [view, setView] = useState("diary"); // "diary" or "profile"

  const user = getLoggedInUser();
  const userName = user.name.split(" ")[0]; // first name for the greeting

  // Save every change so entries survive a page refresh
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      console.warn("Could not save entries: browser storage is full.");
    }
  }, [entries]);

  const visibleEntries = useMemo(() => {
    if (filter === "All") return entries;
    return entries.filter((e) => e.visibility === filter.toLowerCase());
  }, [entries, filter]);

  // New entry goes to the top; an existing id replaces that entry in place
  const handleSave = (saved) =>
    setEntries((prev) =>
      prev.some((e) => e.id === saved.id)
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [saved, ...prev]
    );

  const handleDelete = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setOpenEntry(null);
  };

  const handleEdit = (entry) => {
    setOpenEntry(null);
    setEditingEntry(entry);
  };

  const closeEditor = () => {
    setShowAdd(false);
    setEditingEntry(null);
  };

  // Early returns go after all the hooks above
  if (showAdd || editingEntry) {
    return (
      <AddDiary
        key={editingEntry?.id ?? "new"}
        entry={editingEntry}
        onClose={closeEditor}
        onSave={handleSave}
      />
    );
  }

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (onSignOut) onSignOut();
    else window.location.reload();
  };

  if (view === "profile") {
    return (
      <Profile
        user={user}
        onSignOut={handleSignOut}
        onDiary={() => setView("diary")}
        onAdd={() => {
          setView("diary");
          setShowAdd(true);
        }}
      />
    );
  }

  const formattedDate = new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="dy-page">
      <div className="dy-header">
        <div>
          <span className="dy-date">{formattedDate}</span>
          <h1 className="dy-heading">
            {greeting}, {userName}.
          </h1>
        </div>
        <div className="dy-avatar">{userName.charAt(0).toUpperCase()}</div>
      </div>

      <div className="dy-room">
        <div className="dy-room-icon">
          <SunIcon size={22} />
        </div>
        <div>
          <p className="dy-room-title">Make room for today</p>
          <p className="dy-room-sub">A few honest lines can change how you see the day.</p>
        </div>
      </div>

      <div className="dy-entries-header">
        <h2 className="dy-entries-title">Your entries</h2>
        <button
          className="dy-icon-btn"
          aria-label="Refresh entries"
          onClick={() => setEntries(loadEntries())}
        >
          <RefreshIcon size={22} />
        </button>
      </div>

      <div className="dy-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`dy-filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {visibleEntries.length === 0 ? (
        <p className="dy-empty">
          {filter === "All"
            ? "No entries yet. Tap + to write your first one."
            : `No ${filter.toLowerCase()} entries yet.`}
        </p>
      ) : (
        <ul className="dy-list">
          {visibleEntries.map((entry) => {
            const locked = entry.visibility === "protected";
            return (
              <li key={entry.id} className="dy-card" onClick={() => setOpenEntry(entry)}>
                <span className="dy-card-date">{formatEntryDate(entry.date)}</span>
                <span className="dy-card-icon">{visibilityIcon[entry.visibility]}</span>

                <h3 className="dy-card-title">{entry.title}</h3>
                <p className="dy-card-body">
                  {locked ? "Protected entry · tap to unlock" : entry.content}
                </p>

                {(entry.mood || entry.tags?.length > 0) && (
                  <div className="dy-meta-row">
                    {entry.mood && <span className="dy-mood">{entry.mood}</span>}
                    {entry.tags?.map((t) => (
                      <span key={t} className="dy-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button className="dy-write-btn" onClick={() => setShowAdd(true)}>
        <EditIcon size={20} />
        Write a new entry
      </button>

      <BottomNav
        active="diary"
        onDiary={() => {}}
        onAdd={() => setShowAdd(true)}
        onProfile={() => setView("profile")}
      />

      {openEntry && (
        <EntryViewer
          entry={openEntry}
          onClose={() => setOpenEntry(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Diary;