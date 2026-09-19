# Territory Engine V2 architecture and migration audit

## Previous production flow

Accepted GPS samples were retained as a private activity route. Both provisional client traversal and `complete-activity` converted coordinates into deterministic Web-Mercator axial `q/r` cells (`local-q-r`, 190 m radius). Completion validated distance and speed, generated any encountered atomic polygons, and the privileged idempotent transaction wrote the private activity, per-cell impacts, ledger, cumulative `territory_influence`, and progression. Home then generated 19 local cell candidates, requested snapshots by those IDs, and rendered each returned atomic polygon. `TerritoryCard` described one cell. Real Data V1 had retired fictional owners, but ties were silently resolved by UUID row order and long segments were assigned wholly by one midpoint.

## V2 flow

Atomic IDs, q/r, centers, polygons, influence accounting, and privileged persistence remain the simulation layer. Accepted long segments are subdivided into at most 20 m deterministic pieces before midpoint classification, so crossings allocate geodesic segment distance among encountered cells. The server remains authoritative after sync and the 100 m = 1 point economy is unchanged.

For display, `get_world_regions` spatially filters authoritative influenced cells to a bounded viewport. A grouped `territory_scores` calculation finds total and top influence, then `leader_summary` collapses all players at that top score into exactly one row per atomic territory. The sole highest scorer is the current influence-leader owner; multiple highest scorers produce an ownerless contested cell without duplicating totals, caller influence, geometry, or cell count. It groups display state, collects and unary-unions cell polygons, performs conservative metric morphological closing, repairs and validates topology, simplifies, and emits Polygon/MultiPolygon-safe GeoJSON. This display region ID is a deterministic hash of the sorted cell set and controller but is deliberately not a gameplay identity.

Home debounces completed map movements, suppresses duplicate viewport requests, skips map viewports beyond the server's 0.25-degree local-world limit without clearing existing regions, retains the 24 most recent SQLite viewport entries, and renders exterior rings plus holes. Untouched areas produce no overlay. Cache fallback is explicitly labelled and never fabricated as live. Production does not generate/render cells; the atomic overlay exists only when both `__DEV__` and the explicit environment flag are true.

World geometry reads territory polygons and aggregate influence only. It never reads or returns `activities.route`; another player can learn controlled aggregate cells but not the route within them. Private own-route rendering remains confined to the activity result flow.
