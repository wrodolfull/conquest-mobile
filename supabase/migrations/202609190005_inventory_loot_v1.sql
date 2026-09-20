-- INVENTORY + LOOT V1. Additive, with no historical reward backfill.
create table public.item_definitions(
 id text primary key check(id ~ '^[a-z0-9_]{3,64}$'),
 name text not null check(char_length(name) between 1 and 80), description text,
 rarity text not null check(rarity in('common','uncommon','rare','epic','legendary','mythic')),
 category text not null default 'collectible' check(category='collectible'), icon_key text,
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.player_inventory(
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null references public.item_definitions(id), quantity integer not null default 0 check(quantity>=0),
 first_acquired_at timestamptz not null default now(), last_acquired_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create table public.loot_grants(
 id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 activity_id uuid not null references public.activities(id) on delete cascade, item_id text not null references public.item_definitions(id),
 rarity text not null check(rarity in('common','uncommon','rare','epic','legendary')),
 milestone_meters integer not null check(milestone_meters in(1000,2000,3000,5000,10000)),
 source_type text not null default 'activity_distance' check(source_type='activity_distance'), created_at timestamptz not null default now(),
 unique(activity_id,milestone_meters)
);
create index player_inventory_user_idx on public.player_inventory(user_id);
create index loot_grants_user_idx on public.loot_grants(user_id);
create index loot_grants_activity_idx on public.loot_grants(activity_id);

create function public.prevent_loot_grant_mutation() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'loot grants are immutable'; end $$;
create trigger loot_grants_immutable before update or delete on public.loot_grants for each row execute function public.prevent_loot_grant_mutation();

insert into public.item_definitions(id,name,description,rarity,category,icon_key) values
 ('field_marker','Field Marker','A weathered marker carried by explorers who keep moving beyond familiar ground.','common','collectible','flag'),
 ('pathfinder_token','Pathfinder Token','A small token commemorating the first steps of a longer expedition.','common','collectible','footsteps'),
 ('verdant_compass','Verdant Compass','A green-faced compass associated with routes reclaimed from the unknown.','uncommon','collectible','compass'),
 ('border_sigil','Border Sigil','An etched sign left by travelers at the edges of mapped territory.','uncommon','collectible','map'),
 ('wayfinder_prism','Wayfinder Prism','A clear blue relic that catches the light along distant horizons.','rare','collectible','navigate'),
 ('cartographers_seal','Cartographer''s Seal','A seal honoring those who turn hard-won journeys into shared knowledge.','rare','collectible','earth'),
 ('dominion_shard','Dominion Shard','A violet fragment recovered where determination meets unexplored ground.','epic','collectible','diamond'),
 ('horizon_beacon','Horizon Beacon','A luminous keepsake carried by players who press deep into the world.','epic','collectible','sparkles'),
 ('crown_of_routes','Crown of Routes','A golden relic celebrating a journey measured in resolve and distance.','legendary','collectible','trophy'),
 ('conquerors_astrolabe','Conqueror''s Astrolabe','A rare instrument said to remember every horizon its bearer has crossed.','legendary','collectible','globe');

alter table public.item_definitions enable row level security;
alter table public.player_inventory enable row level security;
alter table public.loot_grants enable row level security;
create policy item_definitions_read_active on public.item_definitions for select to authenticated using(active);
create policy player_inventory_read_own on public.player_inventory for select to authenticated using((select auth.uid())=user_id);
-- loot_grants has no direct client policy: owner-scoped reads use get_activity_loot.
revoke all on public.item_definitions,public.player_inventory,public.loot_grants from anon,authenticated;
grant select on public.item_definitions,public.player_inventory to authenticated;

create function public.get_my_inventory()
returns table(item_id text,name text,description text,rarity text,category text,icon_key text,quantity integer,first_acquired_at timestamptz,last_acquired_at timestamptz)
language sql stable security definer set search_path='' as $$
 select d.id,d.name,d.description,d.rarity,d.category,d.icon_key,i.quantity,i.first_acquired_at,i.last_acquired_at
 from public.player_inventory i join public.item_definitions d on d.id=i.item_id
 where i.user_id=(select auth.uid()) and i.quantity>0
 order by case d.rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end desc,d.name;
$$;
create function public.get_activity_loot(p_activity_id uuid)
returns table(milestone_meters integer,rarity text,item_id text,name text,description text,category text,icon_key text,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select g.milestone_meters,g.rarity,d.id,d.name,d.description,d.category,d.icon_key,g.created_at
 from public.loot_grants g join public.activities a on a.id=g.activity_id join public.item_definitions d on d.id=g.item_id
 where g.activity_id=p_activity_id and a.user_id=(select auth.uid()) order by g.milestone_meters;
$$;
revoke all on function public.get_my_inventory() from public,anon;
revoke all on function public.get_activity_loot(uuid) from public,anon;
grant execute on function public.get_my_inventory() to authenticated;
grant execute on function public.get_activity_loot(uuid) to authenticated;

-- Replace the existing service-role-only finalizer, preserving its signature and all existing effects.
create or replace function public.finalize_activity_transaction(p_user_id uuid,p_client_activity_id text,p_activity_type text,p_started_at timestamptz,p_ended_at timestamptz,p_distance_meters double precision,p_xp integer,p_energy integer,p_route jsonb,p_territories jsonb,p_impacts jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_activity uuid; v_existing public.activities%rowtype; item jsonb; reward record; chosen public.item_definitions%rowtype; v_loot jsonb; v_impacts jsonb; v_influence bigint;
begin
 select * into v_existing from public.activities where user_id=p_user_id and client_activity_id=p_client_activity_id;
 if found then
  select coalesce(jsonb_agg(jsonb_build_object('milestoneMeters',g.milestone_meters,'rarity',g.rarity,'item',jsonb_build_object('id',d.id,'name',d.name,'description',d.description,'rarity',d.rarity,'category',d.category,'iconKey',d.icon_key)) order by g.milestone_meters),'[]'::jsonb) into v_loot from public.loot_grants g join public.item_definitions d on d.id=g.item_id where g.activity_id=v_existing.id;
  select coalesce(jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned)),'[]'::jsonb),coalesce(sum(i.influence_earned),0) into v_impacts,v_influence from public.activity_territory_impacts i join public.territories t on t.id=i.territory_id where i.activity_id=v_existing.id;
  return jsonb_build_object('activityId',v_existing.id,'duplicate',true,'distanceMeters',v_existing.distance_meters,'xpEarned',v_existing.xp_earned,'energyEarned',v_existing.energy_earned,'influenceEarned',v_influence,'territoryImpacts',v_impacts,'loot',v_loot);
 end if;
 insert into public.activities(user_id,client_activity_id,activity_type,started_at,ended_at,duration_seconds,distance_meters,xp_earned,energy_earned,route,route_point_count) values(p_user_id,p_client_activity_id,p_activity_type,p_started_at,p_ended_at,floor(extract(epoch from p_ended_at-p_started_at)),p_distance_meters,p_xp,p_energy,extensions.st_setsrid(extensions.st_geomfromgeojson(p_route),4326),jsonb_array_length(p_route->'coordinates')) returning id into v_activity;
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

comment on table public.loot_grants is 'Immutable authoritative rewards. Inventory + Loot V1 starts at migration deployment; historical activities are intentionally not backfilled.';
