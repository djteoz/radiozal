"use client";

import { useHistory } from "./history-context";
import { StationGrid } from "./station-grid";

export function RecentlyPlayed() {
  const { history } = useHistory();

  if (history.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">🕐 Недавно слушали</h2>
      <StationGrid stations={history.slice(0, 6)} />
    </section>
  );
}
