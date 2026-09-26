-- Owner-only, account-persistent activity history. Exact routes are excluded from list results.
create index activities_owner_history_idx on public.activities(user_id,ended_at desc,id desc);

create function public.get_my_activity_history(p_cursor_ended_at timestamptz default null,p_cursor_id uuid default null,p_page_size integer default 10) returns jsonb
language sql stable security definer set search_path='' as $$
with page as(
 select a.* from public.activities a
 where a.user_id=(select auth.uid()) and a.activity_type in('walking','running','cycling')
 and (p_cursor_ended_at is null or (a.ended_at,a.id)<(p_cursor_ended_at,p_cursor_id))
 order by a.ended_at desc,a.id desc limit least(greatest(p_page_size,1),50)+1
), visible as(select * from page order by ended_at desc,id desc limit least(greatest(p_page_size,1),50)), last_row as(select * from visible order by ended_at,id limit 1)
select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('activityId',v.id,'clientActivityId',v.client_activity_id,'activityType',v.activity_type,'startedAt',v.started_at,'endedAt',v.ended_at,'durationSeconds',v.duration_seconds,'distanceMeters',v.distance_meters,'xpEarned',v.xp_earned,'energyEarned',v.energy_earned,'influenceEarned',coalesce((select sum(i.influence_earned) from public.activity_territory_impacts i where i.activity_id=v.id),0),'territoryCount',(select count(*) from public.activity_territory_impacts i where i.activity_id=v.id)) order by v.ended_at desc,v.id desc) from visible v),'[]'::jsonb),'nextCursor',case when (select count(*) from page)>least(greatest(p_page_size,1),50) then (select jsonb_build_object('endedAt',ended_at,'activityId',id) from last_row) else null end);
$$;

create function public.get_my_activity_detail(p_activity_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
select jsonb_build_object('activityId',a.id,'clientActivityId',a.client_activity_id,'activityType',a.activity_type,'startedAt',a.started_at,'endedAt',a.ended_at,'durationSeconds',a.duration_seconds,'distanceMeters',a.distance_meters,'xpEarned',a.xp_earned,'energyEarned',a.energy_earned,'routePointCount',a.route_point_count,'influenceEarned',coalesce((select sum(i.influence_earned) from public.activity_territory_impacts i where i.activity_id=a.id),0),'territoryCount',(select count(*) from public.activity_territory_impacts i where i.activity_id=a.id),'route',case when a.route is null then null else extensions.st_asgeojson(a.route)::jsonb end,
'territoryImpacts',coalesce((select jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned) order by t.name) from public.activity_territory_impacts i join public.territories t on t.id=i.territory_id where i.activity_id=a.id),'[]'::jsonb),
'loot',coalesce((select jsonb_agg(jsonb_build_object('milestoneMeters',g.milestone_meters,'rarity',g.rarity,'item',jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'rarity',d.rarity,'category',d.category,'iconKey',d.icon_key)) order by g.milestone_meters) from public.loot_grants g join public.item_definitions d on d.id=g.item_id where g.activity_id=a.id),'[]'::jsonb),
'newZonesDiscovered',coalesce((select jsonb_agg(jsonb_build_object('territoryId',z.territory_id,'territoryName',t.name) order by t.name) from public.zone_discoveries z join public.territories t on t.id=z.territory_id where z.user_id=(select auth.uid()) and z.first_activity_id=a.id),'[]'::jsonb),
'completedObjectives',coalesce((select jsonb_agg(jsonb_build_object('key',r.objective_key,'title',replace(initcap(r.objective_key),'_',' '),'coins',r.coins) order by r.objective_key) from public.weekly_objective_rewards r where r.user_id=(select auth.uid()) and r.triggering_activity_id=a.id),'[]'::jsonb))
from public.activities a where a.id=p_activity_id and a.user_id=(select auth.uid()) and a.activity_type in('walking','running','cycling');
$$;
revoke all on function public.get_my_activity_history(timestamptz,uuid,integer),public.get_my_activity_detail(uuid) from public,anon;
grant execute on function public.get_my_activity_history(timestamptz,uuid,integer),public.get_my_activity_detail(uuid) to authenticated;
comment on function public.get_my_activity_history(timestamptz,uuid,integer) is 'Owner-only keyset-paginated outdoor activity summaries; deliberately route-free.';
comment on function public.get_my_activity_detail(uuid) is 'Owner-only authoritative activity detail, including the owner private MultiLineString route.';
