-- Store GPS gaps as disconnected route segments without losing historical routes.
alter table public.activities
 alter column route type extensions.geometry(MultiLineString,4326)
 using case
  when route is null then null
  else extensions.st_multi(route)
 end;

-- Replace the service-role-only finalizer without changing its rewards or idempotency behavior.
-- MultiLineString coordinates are nested by segment, so count every point in every segment.
create or replace function public.finalize_activity_transaction(p_user_id uuid,p_client_activity_id text,p_activity_type text,p_started_at timestamptz,p_ended_at timestamptz,p_distance_meters double precision,p_xp integer,p_energy integer,p_route jsonb,p_territories jsonb,p_impacts jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_activity uuid; v_existing public.activities%rowtype; item jsonb; reward record; chosen public.item_definitions%rowtype; v_loot jsonb; v_impacts jsonb; v_influence bigint;
begin
 select * into v_existing from public.activities where user_id=p_user_id and client_activity_id=p_client_activity_id;
 if found then
  select coalesce(jsonb_agg(jsonb_build_object('milestoneMeters',g.milestone_meters,'rarity',g.rarity,'item',jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'rarity',d.rarity,'category',d.category,'iconKey',d.icon_key)) order by g.milestone_meters),'[]'::jsonb) into v_loot from public.loot_grants g join public.item_definitions d on d.id=g.item_id where g.activity_id=v_existing.id;
  select coalesce(jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned)),'[]'::jsonb),coalesce(sum(i.influence_earned),0) into v_impacts,v_influence from public.activity_territory_impacts i join public.territories t on t.id=i.territory_id where i.activity_id=v_existing.id;
  return jsonb_build_object('activityId',v_existing.id,'duplicate',true,'distanceMeters',v_existing.distance_meters,'xpEarned',v_existing.xp_earned,'energyEarned',v_existing.energy_earned,'influenceEarned',v_influence,'territoryImpacts',v_impacts,'loot',v_loot);
 end if;
 insert into public.activities(user_id,client_activity_id,activity_type,started_at,ended_at,duration_seconds,distance_meters,xp_earned,energy_earned,route,route_point_count) values(p_user_id,p_client_activity_id,p_activity_type,p_started_at,p_ended_at,floor(extract(epoch from p_ended_at-p_started_at)),p_distance_meters,p_xp,p_energy,extensions.st_setsrid(extensions.st_geomfromgeojson(p_route),4326),(select coalesce(sum(jsonb_array_length(segment)),0)::integer from jsonb_array_elements(p_route->'coordinates') as route_segments(segment))) returning id into v_activity;
 for item in select * from jsonb_array_elements(p_territories) loop insert into public.territories(id,q,r,name,center,geometry) values(item->>'id',(item->>'q')::int,(item->>'r')::int,item->>'name',extensions.st_setsrid(extensions.st_geomfromgeojson(item->'center'),4326),extensions.st_setsrid(extensions.st_geomfromgeojson(item->'geometry'),4326)) on conflict(id) do nothing; end loop;
 for item in select * from jsonb_array_elements(p_impacts) loop
  insert into public.activity_territory_impacts values(v_activity,item->>'territoryId',(item->>'distanceMeters')::double precision,(item->>'influenceEarned')::int,now());
  insert into public.influence_ledger(activity_id,user_id,territory_id,distance_meters,influence_delta,reason) values(v_activity,p_user_id,item->>'territoryId',(item->>'distanceMeters')::double precision,(item->>'influenceEarned')::int,'activity');
  insert into public.territory_influence(territory_id,user_id,influence_points) values(item->>'territoryId',p_user_id,(item->>'influenceEarned')::int) on conflict(territory_id,user_id) do update set influence_points=public.territory_influence.influence_points+excluded.influence_points,updated_at=now();
 end loop;
 update public.player_progress set xp=xp+p_xp,energy=energy+p_energy,level=greatest(level,1+floor((xp+p_xp)/1000)),updated_at=now() where user_id=p_user_id;
 if p_activity_type in('walking','running','cycling') then
  for reward in select * from (values(1000,'common'),(2000,'uncommon'),(3000,'rare'),(5000,'epic'),(10000,'legendary')) as r(meters,rarity) where p_distance_meters>=r.meters loop
   select * into chosen from public.item_definitions d where d.active and d.rarity=reward.rarity order by pg_catalog.md5(v_activity::text||':'||reward.meters::text||':'||d.id) limit 1;
   if not found then raise exception 'No active catalog item for rarity %',reward.rarity; end if;
   insert into public.loot_grants(user_id,activity_id,item_id,rarity,milestone_meters) values(p_user_id,v_activity,chosen.id,reward.rarity,reward.meters);
   insert into public.player_inventory(user_id,item_id,quantity) values(p_user_id,chosen.id,1) on conflict(user_id,item_id) do update set quantity=public.player_inventory.quantity+1,last_acquired_at=now();
  end loop;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('milestoneMeters',g.milestone_meters,'rarity',g.rarity,'item',jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'rarity',d.rarity,'category',d.category,'iconKey',d.icon_key)) order by g.milestone_meters),'[]'::jsonb) into v_loot from public.loot_grants g join public.item_definitions d on d.id=g.item_id where g.activity_id=v_activity;
 select coalesce(jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned)),'[]'::jsonb),coalesce(sum(i.influence_earned),0) into v_impacts,v_influence from public.activity_territory_impacts i join public.territories t on t.id=i.territory_id where i.activity_id=v_activity;
 return jsonb_build_object('activityId',v_activity,'duplicate',false,'distanceMeters',p_distance_meters,'xpEarned',p_xp,'energyEarned',p_energy,'influenceEarned',v_influence,'territoryImpacts',v_impacts,'loot',v_loot);
exception when unique_violation then
 select * into v_existing from public.activities where user_id=p_user_id and client_activity_id=p_client_activity_id;
 select coalesce(jsonb_agg(jsonb_build_object('milestoneMeters',g.milestone_meters,'rarity',g.rarity,'item',jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'rarity',d.rarity,'category',d.category,'iconKey',d.icon_key)) order by g.milestone_meters),'[]'::jsonb) into v_loot from public.loot_grants g join public.item_definitions d on d.id=g.item_id where g.activity_id=v_existing.id;
 select coalesce(jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned)),'[]'::jsonb),coalesce(sum(i.influence_earned),0) into v_impacts,v_influence from public.activity_territory_impacts i join public.territories t on t.id=i.territory_id where i.activity_id=v_existing.id;
 return jsonb_build_object('activityId',v_existing.id,'duplicate',true,'distanceMeters',v_existing.distance_meters,'xpEarned',v_existing.xp_earned,'energyEarned',v_existing.energy_earned,'influenceEarned',v_influence,'territoryImpacts',v_impacts,'loot',v_loot);
end $$;
revoke all on function public.finalize_activity_transaction(uuid,text,text,timestamptz,timestamptz,double precision,integer,integer,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_activity_transaction(uuid,text,text,timestamptz,timestamptz,double precision,integer,integer,jsonb,jsonb,jsonb) to service_role;

