create or replace function public.get_my_controlled_territory_cells()
returns table("territoryId" text,name text,q integer,r integer)
language sql stable security definer set search_path=''
as $$
 select t.id,t.name,t.q,t.r from public.territories t
 join public.territory_influence mine on mine.territory_id=t.id and mine.user_id=auth.uid()
 where auth.uid() is not null and mine.influence_points>0
 and not exists(select 1 from public.territory_influence rival where rival.territory_id=t.id and rival.user_id<>auth.uid() and rival.influence_points>=mine.influence_points)
 order by t.id
$$;
revoke all on function public.get_my_controlled_territory_cells() from public,anon;
grant execute on function public.get_my_controlled_territory_cells() to authenticated;
