-- TERRITORY ENGINE V2: atomic simulation, influence-leader ownership, and safe organic display regions.
create index if not exists territories_geometry_gix on public.territories using gist(geometry);
create index if not exists territories_center_gix on public.territories using gist(center);

create or replace function public.get_territory_snapshot(territory_ids text[])
returns table(territory_id text,name text,geometry jsonb,owner_user_id uuid,owner_display_name text,owner_influence_points bigint,total_influence_points bigint,my_influence_points bigint,control_percentage double precision,status text)
language sql stable security definer set search_path='' as $$
 with scores as(
  select ti.territory_id,ti.user_id,ti.influence_points,
   dense_rank()over(partition by ti.territory_id order by ti.influence_points desc) score_rank,
   count(*)over(partition by ti.territory_id,ti.influence_points) tied,
   sum(ti.influence_points)over(partition by ti.territory_id)::bigint total
  from public.territory_influence ti where ti.territory_id=any(territory_ids) and ti.influence_points>0
 ), leaders as(select * from scores where score_rank=1)
 select t.id,t.name,extensions.st_asgeojson(t.geometry)::jsonb,
  case when l.tied=1 then l.user_id end,case when l.tied=1 then p.display_name end,
  coalesce(l.influence_points,0)::bigint,coalesce(l.total,0),coalesce(me.influence_points,0)::bigint,
  case when coalesce(l.total,0)=0 then 0 else l.influence_points::double precision/l.total*100 end,
  case when coalesce(l.total,0)=0 then 'neutral' when l.tied>1 then 'contested'
   when l.user_id=(select auth.uid()) then 'owned' when coalesce(me.influence_points,0)>0 then 'contested' else 'rival' end
 from public.territories t left join leaders l on l.territory_id=t.id
 left join public.profiles p on p.id=l.user_id and l.tied=1
 left join public.territory_influence me on me.territory_id=t.id and me.user_id=(select auth.uid())
 where t.id=any(territory_ids);
$$;
revoke all on function public.get_territory_snapshot(text[]) from public,anon;
grant execute on function public.get_territory_snapshot(text[]) to authenticated;

create function public.get_world_regions(west double precision,south double precision,east double precision,north double precision)
returns table(region_id text,owner_user_id uuid,owner_display_name text,geometry jsonb,total_influence bigint,owner_influence bigint,my_influence bigint,control_percentage double precision,territory_count bigint,status text)
language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null then raise exception 'authentication required'; end if;
 if west < -180 or east > 180 or south < -85 or north > 85 or west >= east or south >= north
    or east-west > .25 or north-south > .25 then raise exception 'viewport is invalid or exceeds 0.25 degrees'; end if;
 return query
 with viewport as(select extensions.st_makeenvelope(west,south,east,north,4326) box),
 scores as(
  select ti.territory_id,ti.user_id,ti.influence_points,
   dense_rank()over(partition by ti.territory_id order by ti.influence_points desc) score_rank,
   count(*)over(partition by ti.territory_id,ti.influence_points) tied,
   sum(ti.influence_points)over(partition by ti.territory_id)::bigint total
  from public.territory_influence ti join public.territories t on t.id=ti.territory_id cross join viewport v
  where ti.influence_points>0 and t.geometry && v.box and extensions.st_intersects(t.geometry,v.box)
 ), leaders as(select * from scores where score_rank=1), atomic as(
  select t.id,t.geometry,l.total,l.influence_points owner_points,coalesce(me.influence_points,0)::bigint mine,
   case when l.tied=1 then l.user_id end owner_id,
   case when l.tied>1 then 'contested' when l.user_id=(select auth.uid()) then 'owned'
        when coalesce(me.influence_points,0)>0 then 'contested' else 'rival' end relation
  from leaders l join public.territories t on t.id=l.territory_id
  left join public.territory_influence me on me.territory_id=t.id and me.user_id=(select auth.uid())
 ), grouped as(
  select owner_id,relation,array_agg(id order by id) ids,sum(total)::bigint total,sum(owner_points)::bigint owner_points,
   sum(mine)::bigint mine,count(*)::bigint cell_count,extensions.st_unaryunion(extensions.st_collect(geometry)) raw_geometry
  from atomic group by owner_id,relation
 ), organic as(
  select *,extensions.st_collectionextract(extensions.st_makevalid(extensions.st_transform(
    extensions.st_buffer(extensions.st_buffer(extensions.st_transform(raw_geometry,3857),18),-18),4326)),3) shaped
  from grouped
 )
 select pg_catalog.md5(coalesce(owner_id::text,'contested')||':'||array_to_string(ids,',')),owner_id,p.display_name,
  extensions.st_asgeojson(extensions.st_multi(extensions.st_simplifypreservetopology(shaped,.000025)))::jsonb,
  total,owner_points,mine,case when total=0 then 0 else owner_points::double precision/total*100 end,cell_count,relation
 from organic left join public.profiles p on p.id=owner_id where not extensions.st_isempty(shaped) and extensions.st_isvalid(shaped);
end $$;
comment on function public.get_world_regions(double precision,double precision,double precision,double precision) is
'Viewport-limited public display geometry derived only from authoritative territory polygons and aggregate influence. Never reads activity routes. Owner means current influence leader, not battle capture.';
revoke all on function public.get_world_regions(double precision,double precision,double precision,double precision) from public,anon;
grant execute on function public.get_world_regions(double precision,double precision,double precision,double precision) to authenticated;
