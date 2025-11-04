// components/FavoriteButton.tsx
import React, { ReactNode } from "react";

type Props = {
  agentId: string;
  initialIsFavorite?: boolean;
  className?: string;
  onToggle?: (isFavorite: boolean) => void;

  /** Необязательно. Свои иконки для состояний on/off */
  iconOn?: ReactNode;
  iconOff?: ReactNode;
};

const DefaultIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      d="M12 21s-6.5-4.35-9.18-7.03A5.5 5.5 0 1112 6.3a5.5 5.5 0 119.18 7.67C18.5 16.65 12 21 12 21z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const FavoriteButton: React.FC<Props> = ({
  agentId,
  initialIsFavorite = false,
  className = "",
  onToggle,
  iconOn,
  iconOff,
}) => {
  const [fav, setFav] = React.useState(initialIsFavorite);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => setFav(initialIsFavorite), [initialIsFavorite]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/agents/by-id/${agentId}/favorite`, { method: "POST" });
      const data = await r.json().catch(() => ({} as any));
      if (!r.ok || !data?.ok) throw new Error(data?.error || "toggle failed");
      setFav(Boolean(data.isFavorite));
      onToggle?.(Boolean(data.isFavorite));
    } catch (e) {
      console.error("Favorite toggle failed", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={fav ? "Удалить из избранного" : "В избранное"}
      title={fav ? "Удалить из избранного" : "В избранное"}
      onClick={toggle}
      disabled={busy}
      className={`
    inline-flex items-center justify-center
    p-0 m-0 bg-transparent border-none
    hover:text-primary transition
    focus:outline-none focus:ring-0
  `}
    >
      {fav ? iconOn ?? <DefaultIcon filled /> : iconOff ?? <DefaultIcon />}
    </button>
  );
};

export default FavoriteButton;
