# Live territory visibility audit

## Authoritative chain

The source chain is intact: `complete-activity` computes globally floored influence,
`finalize_activity_transaction` writes each impact to `territory_influence`, a successful
client sync invalidates the region repository, and `get_world_regions` includes every
viewport cell with positive influence. Public region geometry is generated exclusively
from the authoritative territory polygons and never from an activity route.

The client visibility loss was at the RPC response boundary. PostgreSQL `bigint` fields
can arrive through PostgREST as decimal strings, while `isWorldRegionRow` previously
discarded every row unless all aggregate values were JavaScript numbers. The response
then legitimately mapped to an empty feature collection, so Mapbox had nothing to draw.
The parser now accepts finite decimal representations and normalizes them to numbers.

Development builds log one privacy-safe diagnostic per viewport response: region count,
owned/contested/rival counts, summed player influence, and whether the data came from the
server or the SQLite cache. It does not log viewport bounds, routes, identities, or secrets.

## Deployment parity finding

Repository source uses `floor(authoritative distance / 100)` globally and distributes the
remainder deterministically across traversed cells. The Edge Function and current database
finalizer migration agree: the function supplies already-distributed impacts and the
transaction persists and totals them without recalculation.

Consequently, a genuinely authoritative distance displayed as `0.32 km` (which rounds from
at least 315 metres) cannot produce only two points from the checked-in function. The
physical result is evidence that the deployed Edge Function is stale, or that the displayed
distance and influence came from different deployed revisions. This repository is not
linked to a Supabase project in the available environment, so remote function hashes and
migration history could not be queried. Deploy the current function and migrations, then
verify their versions before changing any economy rule. No compensating migration or
client-side authoritative write is appropriate.
