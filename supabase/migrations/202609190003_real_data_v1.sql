-- REAL DATA V1: truthful POIs, weekly summaries, and influence-derived territory ownership.
create table public.game_pois(
 id uuid primary key default gen_random_uuid(), external_source text, external_id text,
 type text not null check(type in('arena','training_ground')), name text not null check(char_length(name) between 1 and 120),
 location extensions.geometry(Point,4326) not null, enter_radius_meters integer not null default 75 check(enter_radius_meters between 10 and 500),
 exit_radius_meters integer not null default 100 check(exit_radius_meters between enter_radius_meters and 750), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(external_source,external_id)
);
create index game_pois_location_gix on public.game_pois using gist(location) where active;
alter table public.game_pois enable row level security;
create policy game_pois_read_active on public.game_pois for select to authenticated using(active);
revoke all on public.game_pois from anon; grant select on public.game_pois to authenticated;
create function public.get_nearby_game_pois(latitude double precision,longitude double precision,radius_meters integer default 2000)
returns table(id uuid,type text,name text,latitude double precision,longitude double precision,enter_radius_meters integer,exit_radius_meters integer,distance_meters double precision)
language sql stable security definer set search_path='' as $$
 select p.id,p.type,p.name,extensions.st_y(p.location),extensions.st_x(p.location),p.enter_radius_meters,p.exit_radius_meters,
 extensions.st_distance(p.location::extensions.geography,extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography)
 from public.game_pois p where p.active and latitude between -90 and 90 and longitude between -180 and 180 and radius_meters between 50 and 20000
 and extensions.st_dwithin(p.location::extensions.geography,extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography,radius_meters)
 order by 8 limit 100;
$$;
revoke all on function public.get_nearby_game_pois(double precision,double precision,integer) from public,anon;grant execute on function public.get_nearby_game_pois(double precision,double precision,integer) to authenticated;

create or replace function public.get_territory_snapshot(territory_ids text[]) returns table(territory_id text,name text,geometry jsonb,owner_user_id uuid,owner_display_name text,owner_influence_points bigint,total_influence_points bigint,my_influence_points bigint,control_percentage double precision,status text) language sql stable security definer set search_path='' as $$
 with ranked as(select ti.territory_id,ti.user_id,ti.influence_points,row_number()over(partition by ti.territory_id order by ti.influence_points desc,ti.user_id) rank,sum(ti.influence_points)over(partition by ti.territory_id)::bigint total from public.territory_influence ti where ti.territory_id=any(territory_ids)), owners as(select * from ranked where rank=1)
 select t.id,t.name,extensions.st_asgeojson(t.geometry)::jsonb,o.user_id,p.display_name,coalesce(o.influence_points,0)::bigint,coalesce(o.total,0),coalesce(m.influence_points,0)::bigint,case when coalesce(o.total,0)=0 then 0 else o.influence_points::double precision/o.total*100 end,
 case when coalesce(o.total,0)=0 then 'neutral' when o.user_id=(select auth.uid()) then 'player' when coalesce(m.influence_points,0)>0 then 'contested' else 'enemy' end
 from public.territories t left join owners o on o.territory_id=t.id left join public.profiles p on p.id=o.user_id left join public.territory_influence m on m.territory_id=t.id and m.user_id=(select auth.uid()) where t.id=any(territory_ids);
$$;
revoke all on function public.get_territory_snapshot(text[]) from public,anon;grant execute on function public.get_territory_snapshot(text[]) to authenticated;

create function public.get_my_weekly_summary() returns table(week_start timestamptz,week_end timestamptz,outdoor_distance_meters double precision,activity_count bigint,xp_earned bigint,influence_earned bigint) language sql stable security definer set search_path='' as $$
 with bounds as(select date_trunc('week',now()) s), mine as(select a.* from public.activities a,bounds b where a.user_id=(select auth.uid()) and a.started_at>=b.s and a.started_at<b.s+interval '7 days')
 select b.s,b.s+interval '7 days',coalesce(sum(m.distance_meters),0),count(m.id),coalesce(sum(m.xp_earned),0)::bigint,coalesce((select sum(i.influence_earned) from public.activity_territory_impacts i join mine a on a.id=i.activity_id),0)::bigint from bounds b left join mine m on true group by b.s;
$$;
revoke all on function public.get_my_weekly_summary() from public,anon;grant execute on function public.get_my_weekly_summary() to authenticated;

-- Extend the existing idempotent finalizer response without changing stored economy rules.
create or replace function public.activity_authoritative_result(p_activity_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('activityId',a.id,'distanceMeters',a.distance_meters,'xpEarned',a.xp_earned,'energyEarned',a.energy_earned,'influenceEarned',coalesce(sum(i.influence_earned),0),'territoryImpacts',coalesce(jsonb_agg(jsonb_build_object('territoryId',i.territory_id,'territoryName',t.name,'distanceMeters',i.distance_meters,'influenceEarned',i.influence_earned))filter(where i.territory_id is not null),'[]'::jsonb)) from public.activities a left join public.activity_territory_impacts i on i.activity_id=a.id left join public.territories t on t.id=i.territory_id where a.id=p_activity_id and a.user_id=(select auth.uid()) group by a.id;
$$;
revoke all on function public.activity_authoritative_result(uuid) from public,anon;grant execute on function public.activity_authoritative_result(uuid) to authenticated;
