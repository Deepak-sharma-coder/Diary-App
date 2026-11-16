import { useState, useRef } from "react";
import "./style.css";

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const Svg = ({ size = 18, children }) => (
  <svg {...base} width={size} height={size}>
    {children}
  </svg>
);

export const LinkIcon = (p) => (
  <Svg {...p}>
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.4 4.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.43-1.4" />
  </Svg>
);

export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export const EyeOffIcon = (p) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3.2 3.7M6.3 7.6A15 15 0 0 0 3 12s4 6 9 6a9.5 9.5 0 0 0 3.4-.6" />
  </Svg>
);

export const RefreshIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </Svg>
);

export const BookIcon = (p) => (
  <Svg {...p}>
    <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
    <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Svg>
);

export const CameraIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const EditIcon = (p) => (
  <Svg {...p}>
    <path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
    <path d="M18.5 3.5l2 2L12 14l-3 1 1-3z" />
  </Svg>
);

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

const MOODS = ["Reflective", "Grateful", "Calm", "Heavy", "Joyful"];

const PRIVACY = [
  { key: "private", title: "Private", desc: "Only you can see this entry.", Icon: EyeOffIcon },
  { key: "protected", title: "Protected", desc: "Only you, after your 4-digit PIN.", Icon: LockIcon },
  { key: "public", title: "Public", desc: "Anyone with its share link can read it.", Icon: LinkIcon },
];

// Hash the PIN so the 4 digits are never stored as plain text
export const hashPin = async (pin) => {
  const data = new TextEncoder().encode(`diary-pin:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Shrink photos so they fit in browser storage
const readAndResize = (file, maxSize = 1000) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

/*
  AddDiary is used for both creating and editing.
  - New entry:  <AddDiary onClose={...} onSave={...} />
  - Edit entry: <AddDiary entry={existingEntry} onClose={...} onSave={...} />
*/
const AddDiary = ({ onClose, onSave, entry }) => {
  const isEdit = Boolean(entry);
  const hadPin = isEdit && entry.visibility === "protected" && Boolean(entry.pinHash);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "Reflective");
  const [tags, setTags] = useState(entry?.tags?.join(", ") ?? "");
  const [photos, setPhotos] = useState(entry?.photos ?? []);
  const [visibility, setVisibility] = useState(entry?.visibility ?? "private");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    try {
      const urls = await Promise.all(files.map((f) => readAndResize(f)));
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      setError("One of the photos could not be read. Try a different image.");
    }
    e.target.value = ""; // lets the same file be picked again
  };

  const handleSave = async () => {
    setError("");

    if (!title.trim() && !content.trim()) {
      setError("Write a title or a few lines before saving.");
      return;
    }

    // Work out which PIN hash this entry should end up with
    let pinHash = null;
    if (visibility === "protected") {
      if (pin.length === 4) {
        pinHash = await hashPin(pin);
      } else if (hadPin && pin.length === 0) {
        pinHash = entry.pinHash; // keep the existing PIN
      } else {
        setError(
          hadPin
            ? "Enter a new 4-digit PIN, or leave it empty to keep the current one."
            : "Enter a 4-digit PIN to protect this entry."
        );
        return;
      }
    }

    setSaving(true);
    const now = new Date().toISOString();
    const saved = {
      id: entry?.id ?? Date.now(),
      date: entry?.date ?? now,
      ...(isEdit && { updatedAt: now }),
      title: title.trim() || "Untitled",
      content: content.trim(),
      mood,
      tags: tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
      photos,
      visibility,
      pinHash,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="ad-page">
      <header className="ad-topbar">
        <button className="ad-close-btn" onClick={onClose} aria-label="Close">
          <CloseIcon size={24} />
        </button>
        <span className="ad-top-title">{isEdit ? "Edit entry" : "New entry"}</span>
        <button className="ad-save-btn" onClick={handleSave} disabled={saving}>
          Save
        </button>
      </header>

      <div className="ad-body">
        <input
          className="ad-title-input"
          placeholder="Give this moment a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="ad-textarea"
          placeholder="What is present for you today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <span className="ad-label">How does it feel?</span>
        <div className="ad-mood-row">
          {MOODS.map((m) => (
            <button
              key={m}
              className={`ad-mood-btn${mood === m ? " active" : ""}`}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <span className="ad-label">Tags</span>
        <input
          className="ad-text-input"
          placeholder="gratitude, work, home"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <p className="ad-hint">Separate tags with commas.</p>

        <span className="ad-label">Photos</span>
        <div className="ad-photo-row">
          {photos.map((src, i) => (
            <div key={i} className="ad-thumb">
              <img src={src} alt="" className="ad-thumb-img" />
              <button
                className="ad-thumb-remove"
                aria-label="Remove photo"
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
          <button className="ad-add-photo" onClick={() => fileRef.current.click()}>
            <CameraIcon size={22} />
            Add
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handlePhotos}
          />
        </div>

        <span className="ad-label">Privacy</span>
        <div className="ad-privacy-list">
          {PRIVACY.map(({ key, title: t, desc, Icon }) => {
            const active = visibility === key;
            return (
              <button
                key={key}
                className={`ad-privacy-btn${active ? " active" : ""}`}
                onClick={() => {
                  setVisibility(key);
                  if (key !== "protected") setPin("");
                }}
              >
                <span className="ad-privacy-icon">
                  <Icon size={22} />
                </span>
                <span className="ad-privacy-text">
                  <p className="ad-privacy-title">{t}</p>
                  <p className="ad-privacy-desc">{desc}</p>
                </span>
                {active && (
                  <span className="ad-check">
                    <CheckIcon size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {visibility === "protected" && (
          <>
            <label className="ad-pin-label" htmlFor="entry-pin">
              {hadPin ? "NEW 4-DIGIT PIN (OPTIONAL)" : "4-DIGIT PIN"}
            </label>
            <input
              id="entry-pin"
              className="ad-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {hadPin && <p className="ad-hint">Leave empty to keep your current PIN.</p>}
          </>
        )}

        {error && <p className="ad-error">{error}</p>}
      </div>
    </div>
  );
};

export default AddDiary;