# RUQEST data sources

Runtime data belongs to exactly one category: **STATIC**, **LOCAL DEVICE**, **SERVER**, or explicitly gated **DEV FIXTURE**. Server economy data remains authoritative; caches are last-known snapshots, never successful offline mutations.

| Feature | Current source | Desired source | Authority | Offline behavior | Status |
|---|---|---|---|---|---|
| Player identity / profile | Supabase `profiles` | Same | SERVER | Existing context retains last loaded state | Live |
| XP, level, energy | `player_progress` | Same | SERVER | Last loaded UI only | Live |
| Activity catalog / navigation | `src/config/game.ts` | Same | STATIC | Fully available | Live |
| Active GPS route / diagnostics | SQLite | Same | LOCAL DEVICE | Recording continues | Live |
| Pending completed activity | SQLite | Same until accepted | LOCAL DEVICE | Queued; economy labelled estimated | Live |
| Accepted completed activity | `activities` and completion response | Same | SERVER | Authoritative result persisted locally | Live |
| Territory geography | Viewport-limited `get_world_regions` PostGIS aggregates | Same | SERVER | SQLite last-known region cache, labelled cached | Live V2 |
| Territory influence / V1 owner | `territory_influence` via safe RPC | Same | SERVER | Cached snapshot, no offline ownership writes | Live V1 |
| Weekly progress | Accepted server activities via RPC | Same | SERVER | Last-known cache plus separately labelled pending distance | Live V1 |
| Nearby POIs | `game_pois` via spatial RPC | Same | SERVER | Empty on failure; no generated fallback | Live V1 |
| Arena ranking | None | Future defined Arena economy | SERVER | Honest unavailable state | Not implemented |
| Indoor economy | DEV-only prototype | Future HealthKit/Health Connect rules | SERVER | No production award | Not implemented |
| Inventory | None | Future economy tables/APIs | SERVER | Honest empty state | Not implemented |
| Battles | None | Future battle service | SERVER | Honest coming-soon state | Not implemented |
| Rankings | None | Future explicitly defined leaderboard | SERVER | Honest unavailable state | Not implemented |
| Distance milestones | Local thresholds | Same until rewards exist | STATIC | Shows milestones, never persisted loot | Live concept |

## Territory ownership V1

The owner is the sole user with the greatest authoritative `influence_points`. Equal top scores have no owner and are deterministically **contested**; database row order never breaks a tie. Control is `leading influence / total influence × 100`, while all influence fields are points. No influence means neutral and produces no world overlay. “Owner” means current influence leader, **not** battle-confirmed permanent capture.
