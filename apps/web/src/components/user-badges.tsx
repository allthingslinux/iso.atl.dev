"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type UserBadge = {
  badgeId: string;
  tier: number | null;
  earnedAt: string | null;
  badge: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    type: string;
    points: number | null;
  };
};

export function UserBadges({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/v1/badges/users/${userId}`)
      .then((r) => r.json())
      .then(setBadges)
      .catch(() => setBadges([]));
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 5).map((ub) => (
        <span
          key={ub.badgeId}
          className="text-sm cursor-default"
          title={`${ub.badge.name}${ub.tier ? ` (Tier ${ub.tier})` : ""}: ${ub.badge.description}`}
        >
          {ub.badge.icon || "🏅"}
        </span>
      ))}
      {badges.length > 5 && (
        <span className="text-xs text-zinc-500">+{badges.length - 5}</span>
      )}
    </div>
  );
}

export function BadgeList({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/v1/badges/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setBadges(data);
        setLoading(false);
      })
      .catch(() => {
        setBadges([]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading badges...</p>;
  }

  if (badges.length === 0) {
    return <p className="text-sm text-muted-foreground">No badges earned yet.</p>;
  }

  const grouped = badges.reduce((acc, ub) => {
    const type = ub.badge.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(ub);
    return acc;
  }, {} as Record<string, UserBadge[]>);

  const typeOrder = ["role", "tutorial", "achievement", "milestone", "secret", "special"];

  return (
    <div className="space-y-4">
      {typeOrder.map((type) => {
        const typeBadges = grouped[type];
        if (!typeBadges?.length) return null;

        return (
          <div key={type}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
              {type}
            </h4>
            <div className="flex flex-wrap gap-2">
              {typeBadges.map((ub) => (
                <div
                  key={ub.badgeId}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                  title={ub.badge.description || ""}
                >
                  <span className="text-lg">{ub.badge.icon || "🏅"}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {ub.badge.name}
                      {ub.tier && <span className="text-muted-foreground"> (T{ub.tier})</span>}
                    </p>
                    {ub.badge.points && (
                      <p className="text-xs text-muted-foreground">+{ub.badge.points * (ub.tier || 1)} pts</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
