create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,30}$'), display_name text not null check (char_length(display_name) between 1 and 60),
 avatar_url text check (avatar_url is null or char_length(avatar_url)<=2048), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.player_progress (
 user_id uuid primary key references auth.users(id) on delete cascade, level integer not null default 1 check(level>=1), xp bigint not null default 0 check(xp>=0), energy integer not null default 0 check(energy>=0), coins bigint not null default 0 check(coins>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activities (
 id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, client_activity_id text not null check(char_length(client_activity_id) between 1 and 128), activity_type text not null check(activity_type in ('walking','running','cycling','indoor')), started_at timestamptz not null, ended_at timestamptz not null, duration_seconds integer not null check(duration_seconds>=0), distance_meters double precision not null check(distance_meters>=0), xp_earned integer not null default 0 check(xp_earned>=0), energy_earned integer not null default 0 check(energy_earned>=0), route extensions.geometry(LineString,4326), route_point_count integer not null default 0 check(route_point_count>=0), created_at timestamptz not null default now(), unique(user_id,client_activity_id), check(ended_at>started_at)
);
create table public.territories (
 id text primary key check(id ~ '^local--?[0-9]+--?[0-9]+$'), q integer not null, r integer not null, name text not null, center extensions.geometry(Point,4326) not null, geometry extensions.geometry(Geometry,4326) not null, created_at timestamptz not null default now(), unique(q,r), check(extensions.geometrytype(geometry) in ('POLYGON','MULTIPOLYGON'))
);
create table public.territory_influence (
 territory_id text not null references public.territories(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, influence_points bigint not null default 0 check(influence_points>=0), updated_at timestamptz not null default now(), primary key(territory_id,user_id)
);
create table public.activity_territory_impacts (
 activity_id uuid not null references public.activities(id) on delete cascade, territory_id text not null references public.territories(id), distance_meters double precision not null check(distance_meters>=0), influence_earned integer not null check(influence_earned>=0), created_at timestamptz not null default now(), primary key(activity_id,territory_id)
);
create table public.influence_ledger (
 id uuid primary key default extensions.gen_random_uuid(), activity_id uuid not null references public.activities(id), user_id uuid not null references auth.users(id), territory_id text not null references public.territories(id), distance_meters double precision not null check(distance_meters>=0), influence_delta integer not null check(influence_delta>=0), reason text not null check(reason='activity'), created_at timestamptz not null default now(), unique(activity_id,territory_id,reason)
);
create index activities_user_id_idx on public.activities(user_id); create index territory_influence_user_idx on public.territory_influence(user_id); create index territory_influence_territory_idx on public.territory_influence(territory_id); create index influence_ledger_user_idx on public.influence_ledger(user_id); create index influence_ledger_territory_idx on public.influence_ledger(territory_id); create index influence_ledger_activity_idx on public.influence_ledger(activity_id); create index activity_impacts_territory_idx on public.activity_territory_impacts(territory_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,display_name,avatar_url) values(new.id,'player_'||substr(replace(new.id::text,'-',''),1,8),left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'name',''),'Player'),60),left(new.raw_user_meta_data->>'avatar_url',2048));
 insert into public.player_progress(user_id) values(new.id); return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.player_progress enable row level security; alter table public.activities enable row level security; alter table public.territories enable row level security; alter table public.territory_influence enable row level security; alter table public.activity_territory_impacts enable row level security; alter table public.influence_ledger enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "progress_select_own" on public.player_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "activities_select_own" on public.activities for select to authenticated using ((select auth.uid())=user_id);
create policy "territories_read_authenticated" on public.territories for select to authenticated using (true);
-- No client policies exist for influence, impacts, or ledger; only the safe RPC exposes aggregation.
revoke all on public.profiles,public.player_progress,public.activities,public.territories,public.territory_influence,public.activity_territory_impacts,public.influence_ledger from anon;
grant select on public.profiles,public.player_progress,public.activities,public.territories to authenticated; grant update(username,display_name,avatar_url) on public.profiles to authenticated;

create function public.get_territory_snapshot(territory_ids text[]) returns table(territory_id text,name text,geometry jsonb,owner_user_id uuid,owner_display_name text,total_influence bigint,my_influence bigint) language sql stable security definer set search_path='' as $$
 with totals as(select ti.territory_id,sum(ti.influence_points)::bigint total from public.territory_influence ti where ti.territory_id=any(territory_ids) group by ti.territory_id)
 select t.id,t.name,extensions.st_asgeojson(t.geometry)::jsonb,null::uuid,null::text,coalesce(x.total,0),coalesce(m.influence_points,0)
 from public.territories t left join totals x on x.territory_id=t.id left join public.territory_influence m on m.territory_id=t.id and m.user_id=(select auth.uid()) where t.id=any(territory_ids);
$$;
revoke all on function public.get_territory_snapshot(text[]) from public,anon; grant execute on function public.get_territory_snapshot(text[]) to authenticated;

create function public.finalize_activity_transaction(p_user_id uuid,p_client_activity_id text,p_activity_type text,p_started_at timestamptz,p_ended_at timestamptz,p_distance_meters double precision,p_xp integer,p_energy integer,p_route jsonb,p_territories jsonb,p_impacts jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_activity uuid; v_existing public.activities%rowtype; item jsonb;
begin
 select * into v_existing from public.activities where user_id=p_user_id and client_activity_id=p_client_activity_id;
 if found then return jsonb_build_object('activityId',v_existing.id,'duplicate',true,'distanceMeters',v_existing.distance_meters,'xpEarned',v_existing.xp_earned,'energyEarned',v_existing.energy_earned); end if;
 insert into public.activities(user_id,client_activity_id,activity_type,started_at,ended_at,duration_seconds,distance_meters,xp_earned,energy_earned,route,route_point_count) values(p_user_id,p_client_activity_id,p_activity_type,p_started_at,p_ended_at,floor(extract(epoch from p_ended_at-p_started_at)),p_distance_meters,p_xp,p_energy,extensions.st_setsrid(extensions.st_geomfromgeojson(p_route),4326),jsonb_array_length(p_route->'coordinates')) returning id into v_activity;
 for item in select * from jsonb_array_elements(p_territories) loop insert into public.territories(id,q,r,name,center,geometry) values(item->>'id',(item->>'q')::int,(item->>'r')::int,item->>'name',extensions.st_setsrid(extensions.st_geomfromgeojson(item->'center'),4326),extensions.st_setsrid(extensions.st_geomfromgeojson(item->'geometry'),4326)) on conflict(id) do nothing; end loop;
 for item in select * from jsonb_array_elements(p_impacts) loop
  insert into public.activity_territory_impacts values(v_activity,item->>'territoryId',(item->>'distanceMeters')::double precision,(item->>'influenceEarned')::int,now());
  insert into public.influence_ledger(activity_id,user_id,territory_id,distance_meters,influence_delta,reason) values(v_activity,p_user_id,item->>'territoryId',(item->>'distanceMeters')::double precision,(item->>'influenceEarned')::int,'activity');
  insert into public.territory_influence(territory_id,user_id,influence_points) values(item->>'territoryId',p_user_id,(item->>'influenceEarned')::int) on conflict(territory_id,user_id) do update set influence_points=public.territory_influence.influence_points+excluded.influence_points,updated_at=now();
 end loop;
 update public.player_progress set xp=xp+p_xp,energy=energy+p_energy,level=greatest(level,1+floor((xp+p_xp)/1000)),updated_at=now() where user_id=p_user_id;
 return jsonb_build_object('activityId',v_activity,'duplicate',false,'distanceMeters',p_distance_meters,'xpEarned',p_xp,'energyEarned',p_energy);
exception when unique_violation then select * into v_existing from public.activities where user_id=p_user_id and client_activity_id=p_client_activity_id; return jsonb_build_object('activityId',v_existing.id,'duplicate',true,'distanceMeters',v_existing.distance_meters,'xpEarned',v_existing.xp_earned,'energyEarned',v_existing.energy_earned); end $$;
revoke all on function public.finalize_activity_transaction(uuid,text,text,timestamptz,timestamptz,double precision,integer,integer,jsonb,jsonb,jsonb) from public,anon,authenticated; grant execute on function public.finalize_activity_transaction(uuid,text,text,timestamptz,timestamptz,double precision,integer,integer,jsonb,jsonb,jsonb) to service_role;
