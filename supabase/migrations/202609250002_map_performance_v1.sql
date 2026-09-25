-- MAP PERFORMANCE & LEVEL OF DETAIL V1
-- Restrict influence aggregation to the spatially indexed visible territory set.
-- territories_geometry_gix was created by 202609190004_territory_engine_v2.sql.

create or replace function public.get_world_regions(
  west double precision,
  south double precision,
  east double precision,
  north double precision
)
returns table(
  region_id text,
  zone_name text,
  owner_user_id uuid,
  owner_display_name text,
  geometry jsonb,
  total_influence bigint,
  owner_influence bigint,
  my_influence bigint,
  control_percentage double precision,
  territory_count bigint,
  status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  if west < -180
     or east > 180
     or south < -85
     or north > 85
     or west >= east
     or south >= north
     or east - west > 0.25
     or north - south > 0.25
  then
    raise exception 'viewport is invalid or exceeds 0.25 degrees';
  end if;

  return query
  with viewport as (
    select extensions.st_makeenvelope(west, south, east, north, 4326) as box
  ),
  visible_territories as materialized (
    select t.id, t.name, t.geometry as territory_geometry
    from public.territories t
    cross join viewport v
    where t.geometry OPERATOR(extensions.&&) v.box
      and extensions.st_intersects(t.geometry, v.box)
    order by t.id
    limit 2000
  ),
  relevant_influence as (
    select ti.territory_id, ti.user_id, ti.influence_points
    from visible_territories vt
    join public.territory_influence ti on ti.territory_id = vt.id
    where ti.influence_points > 0
  ),
  scores as (
    select ri.territory_id, sum(ri.influence_points)::bigint as total,
      max(ri.influence_points)::bigint as top
    from relevant_influence ri
    group by ri.territory_id
  ),
  leaders as (
    select s.territory_id, s.total, s.top, count(*)::bigint as leader_count,
      case when count(*) = 1 then (array_agg(ri.user_id order by ri.user_id))[1] else null end as owner_id
    from scores s
    join relevant_influence ri on ri.territory_id = s.territory_id and ri.influence_points = s.top
    group by s.territory_id, s.total, s.top
  ),
  zones as (
    select vt.id as territory_id, vt.name as territory_name,
      vt.territory_geometry, l.total, l.top, l.leader_count, l.owner_id,
      coalesce(me.influence_points, 0)::bigint as mine,
      case
        when l.leader_count > 1 then 'contested'
        when l.owner_id = (select auth.uid()) then 'owned'
        when coalesce(me.influence_points, 0) > 0 then 'contested'
        else 'rival'
      end as relation
    from visible_territories vt
    join leaders l on l.territory_id = vt.id
    left join public.territory_influence me on me.territory_id = vt.id and me.user_id = (select auth.uid())
  ),
  softened as (
    select z.territory_id, z.territory_name, z.total, z.top, z.leader_count,
      z.owner_id, z.mine, z.relation,
      extensions.st_collectionextract(
        extensions.st_makevalid(
          extensions.st_transform(
            extensions.st_buffer(extensions.st_buffer(extensions.st_transform(z.territory_geometry, 3857), 8), -8),
            4326
          )
        ),
        3
      ) as shaped
    from zones z
  )
  select s.territory_id, s.territory_name, s.owner_id, p.display_name,
    extensions.st_asgeojson(s.shaped)::jsonb, s.total, s.top, s.mine,
    case when s.total = 0 then 0::double precision else s.top::double precision / s.total::double precision * 100 end,
    1::bigint, s.relation
  from softened s
  left join public.profiles p on p.id = s.owner_id
  where not extensions.st_isempty(s.shaped) and extensions.st_isvalid(s.shaped);
end;
$$;

comment on function public.get_world_regions(double precision, double precision, double precision, double precision) is
'Returns up to 2000 authoritative atomic Territory Zones V3 intersecting a validated viewport. Uses the spatially indexed visible territory set before aggregate influence and never exposes activity routes or raw GPS data.';

revoke all on function public.get_world_regions(double precision, double precision, double precision, double precision) from public, anon;
grant execute on function public.get_world_regions(double precision, double precision, double precision, double precision) to authenticated;
