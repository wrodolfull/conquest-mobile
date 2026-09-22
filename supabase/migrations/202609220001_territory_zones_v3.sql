-- TERRITORY ZONES V3: viewport-bounded, tappable atomic zones.
-- Existing deterministic territories and authoritative influence tables are reused.
drop function if exists public.get_world_regions(double precision,double precision,double precision,double precision);
create function public.get_world_regions(west double precision,south double precision,east double precision,north double precision)
returns table(region_id text,zone_name text,owner_user_id uuid,owner_display_name text,geometry jsonb,total_influence bigint,owner_influence bigint,my_influence bigint,control_percentage double precision,territory_count bigint,status text)
language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null then raise exception 'authentication required'; end if;
 if west < -180 or east > 180 or south < -85 or north > 85 or west >= east or south >= north
    or east-west > .25 or north-south > .25 then raise exception 'viewport is invalid or exceeds 0.25 degrees'; end if;
 return query
 with viewport as(select extensions.st_makeenvelope(west,south,east,north,4326) box),
 relevant_influence as(
  select ti.territory_id,ti.user_id,ti.influence_points
  from public.territory_influence ti join public.territories t on t.id=ti.territory_id cross join viewport v
  where ti.influence_points>0 and t.geometry && v.box and extensions.st_intersects(t.geometry,v.box)
 ), scores as(
  select ri.territory_id,sum(ri.influence_points)::bigint total,max(ri.influence_points)::bigint top
  from relevant_influence ri group by ri.territory_id
 ), leaders as(
  select s.territory_id,s.total,s.top,count(*)::bigint leader_count,
   case when count(*)=1 then (array_agg(ri.user_id order by ri.user_id))[1] end owner_id
  from scores s join relevant_influence ri on ri.territory_id=s.territory_id and ri.influence_points=s.top
  group by s.territory_id,s.total,s.top
 ), zones as(
  select t.id,t.name,t.geometry,l.total,l.top,l.leader_count,l.owner_id,coalesce(me.influence_points,0)::bigint mine,
   case when l.leader_count>1 then 'contested' when l.owner_id=(select auth.uid()) then 'owned'
        when coalesce(me.influence_points,0)>0 then 'contested' else 'rival' end relation
  from leaders l join public.territories t on t.id=l.territory_id
  left join public.territory_influence me on me.territory_id=t.id and me.user_id=(select auth.uid())
  order by t.id limit 2000
 ), softened as(
  select *,extensions.st_collectionextract(extensions.st_makevalid(extensions.st_transform(
    extensions.st_buffer(extensions.st_buffer(extensions.st_transform(geometry,3857),8),-8),4326)),3) shaped
  from zones
 )
 select z.id,z.name,z.owner_id,p.display_name,extensions.st_asgeojson(z.shaped)::jsonb,z.total,z.top,z.mine,
  case when z.total=0 then 0 else z.top::double precision/z.total*100 end,1::bigint,z.relation
 from softened z left join public.profiles p on p.id=z.owner_id
 where not extensions.st_isempty(z.shaped) and extensions.st_isvalid(z.shaped);
end $$;
comment on function public.get_world_regions(double precision,double precision,double precision,double precision) is
'At most 2000 authoritative atomic zones intersecting a validated viewport. Exposes aggregate influence and softened zone geometry only; never activity routes.';
revoke all on function public.get_world_regions(double precision,double precision,double precision,double precision) from public,anon;
grant execute on function public.get_world_regions(double precision,double precision,double precision,double precision) to authenticated;
