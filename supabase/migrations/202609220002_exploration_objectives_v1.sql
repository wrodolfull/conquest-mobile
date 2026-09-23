-- EXPLORATION + OBJECTIVES V1. Authoritative, additive, route-free projections.
create table public.zone_discoveries(
 user_id uuid not null references auth.users(id) on delete cascade,
 territory_id text not null references public.territories(id),
 first_activity_id uuid not null references public.activities(id),
 discovered_at timestamptz not null,
 primary key(user_id,territory_id)
);
create index zone_discoveries_user_time_idx on public.zone_discoveries(user_id,discovered_at);

-- Preserve discoveries already proven by the immutable positive influence ledger.
insert into public.zone_discoveries(user_id,territory_id,first_activity_id,discovered_at)
select distinct on (l.user_id,l.territory_id) l.user_id,l.territory_id,l.activity_id,l.created_at
from public.influence_ledger l where l.influence_delta>0
order by l.user_id,l.territory_id,l.created_at,l.id;

create table public.weekly_objective_rewards(
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start timestamptz not null,
 objective_key text not null check(objective_key in('explorer','influence','distance')),
 coins integer not null check(coins in(25,50)),
 triggering_activity_id uuid not null references public.activities(id),
 rewarded_at timestamptz not null default now(),
 primary key(user_id,week_start,objective_key)
);
create table public.player_achievements(
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_key text not null check(achievement_key in('first_footprint','explorer','pathfinder','cartographer','conqueror','centurion')),
 unlocked_at timestamptz not null default now(),
 primary key(user_id,achievement_key)
);
alter table public.zone_discoveries enable row level security;
alter table public.weekly_objective_rewards enable row level security;
alter table public.player_achievements enable row level security;
-- Deliberately no direct policies/grants. Owner-only security-definer RPCs expose aggregates.
revoke all on public.zone_discoveries,public.weekly_objective_rewards,public.player_achievements from anon,authenticated;

create function public.record_zone_discovery() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.influence_delta>0 then
  insert into public.zone_discoveries(user_id,territory_id,first_activity_id,discovered_at)
  values(new.user_id,new.territory_id,new.activity_id,new.created_at) on conflict do nothing;
 end if;
 return new;
end$$;
create trigger influence_ledger_discovers_zone after insert on public.influence_ledger for each row execute function public.record_zone_discovery();

create function public.refresh_exploration_rewards(p_user_id uuid,p_activity_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare ws timestamptz:=date_trunc('week',now()); inserted integer; discoveries bigint; influence bigint; distance double precision; controlled bigint; total_inf bigint;
begin
 select count(*) into discoveries from public.zone_discoveries where user_id=p_user_id and discovered_at>=ws and discovered_at<ws+interval '7 days';
 select coalesce(sum(influence_delta),0) into influence from public.influence_ledger where user_id=p_user_id and created_at>=ws and created_at<ws+interval '7 days';
 select coalesce(sum(distance_meters),0) into distance from public.activities where user_id=p_user_id and activity_type in('walking','running','cycling') and started_at>=ws and started_at<ws+interval '7 days';
 if discoveries>=3 then insert into public.weekly_objective_rewards values(p_user_id,ws,'explorer',25,p_activity_id,now()) on conflict do nothing; get diagnostics inserted=row_count; if inserted=1 then update public.player_progress set coins=coins+25,updated_at=now() where user_id=p_user_id; end if; end if;
 if influence>=25 then insert into public.weekly_objective_rewards values(p_user_id,ws,'influence',25,p_activity_id,now()) on conflict do nothing; get diagnostics inserted=row_count; if inserted=1 then update public.player_progress set coins=coins+25,updated_at=now() where user_id=p_user_id; end if; end if;
 if distance>=5000 then insert into public.weekly_objective_rewards values(p_user_id,ws,'distance',50,p_activity_id,now()) on conflict do nothing; get diagnostics inserted=row_count; if inserted=1 then update public.player_progress set coins=coins+50,updated_at=now() where user_id=p_user_id; end if; end if;
 select coalesce(sum(influence_points),0) into total_inf from public.territory_influence where user_id=p_user_id;
 select count(*) into controlled from public.territory_influence mine where mine.user_id=p_user_id and mine.influence_points>0 and not exists(select 1 from public.territory_influence rival where rival.territory_id=mine.territory_id and (rival.influence_points>mine.influence_points or (rival.influence_points=mine.influence_points and rival.user_id<>mine.user_id)));
 select count(*) into discoveries from public.zone_discoveries where user_id=p_user_id;
 if discoveries>=1 then insert into public.player_achievements values(p_user_id,'first_footprint',now()) on conflict do nothing; end if;
 if discoveries>=10 then insert into public.player_achievements values(p_user_id,'explorer',now()) on conflict do nothing; end if;
 if discoveries>=25 then insert into public.player_achievements values(p_user_id,'pathfinder',now()) on conflict do nothing; end if;
 if discoveries>=50 then insert into public.player_achievements values(p_user_id,'cartographer',now()) on conflict do nothing; end if;
 if controlled>=10 then insert into public.player_achievements values(p_user_id,'conqueror',now()) on conflict do nothing; end if;
 if total_inf>=100 then insert into public.player_achievements values(p_user_id,'centurion',now()) on conflict do nothing; end if;
end$$;
create function public.activity_refresh_exploration() returns trigger language plpgsql security definer set search_path='' as $$begin perform public.refresh_exploration_rewards(new.user_id,new.activity_id);return new;end$$;
create trigger influence_ledger_refresh_exploration after insert on public.influence_ledger for each row execute function public.activity_refresh_exploration();
create function public.activity_refresh_distance_objective() returns trigger language plpgsql security definer set search_path='' as $$begin perform public.refresh_exploration_rewards(new.user_id,new.id);return new;end$$;
create trigger activity_refresh_distance_objective after insert on public.activities for each row execute function public.activity_refresh_distance_objective();
create function public.territory_influence_refresh_exploration() returns trigger language plpgsql security definer set search_path='' as $$declare aid uuid;begin select activity_id into aid from public.influence_ledger where user_id=new.user_id and territory_id=new.territory_id order by created_at desc limit 1;if aid is not null then perform public.refresh_exploration_rewards(new.user_id,aid);end if;return new;end$$;
create trigger territory_influence_refresh_exploration after insert or update on public.territory_influence for each row execute function public.territory_influence_refresh_exploration();

create function public.get_activity_exploration_result(p_user_id uuid,p_activity_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'newZonesDiscovered',coalesce((select jsonb_agg(jsonb_build_object('territoryId',d.territory_id,'territoryName',t.name) order by t.name) from public.zone_discoveries d join public.territories t on t.id=d.territory_id where d.user_id=p_user_id and d.first_activity_id=p_activity_id),'[]'::jsonb),
  'newZonesCount',(select count(*) from public.zone_discoveries d where d.user_id=p_user_id and d.first_activity_id=p_activity_id),
  'completedObjectives',coalesce((select jsonb_agg(jsonb_build_object('key',r.objective_key,'title',initcap(r.objective_key),'coins',r.coins) order by r.objective_key) from public.weekly_objective_rewards r where r.user_id=p_user_id and r.triggering_activity_id=p_activity_id),'[]'::jsonb));
$$;
revoke all on function public.get_activity_exploration_result(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_activity_exploration_result(uuid,uuid) to service_role;

create function public.get_my_exploration_summary() returns jsonb language sql stable security definer set search_path='' as $$
with bounds as(select date_trunc('week',now()) ws), stats as(select
 (select count(*) from public.zone_discoveries where user_id=(select auth.uid())) discovered,
 (select count(*) from public.zone_discoveries,bounds where user_id=(select auth.uid()) and discovered_at>=ws and discovered_at<ws+interval '7 days') new_week,
 (select coalesce(sum(influence_points),0) from public.territory_influence where user_id=(select auth.uid())) total_inf,
 (select count(*) from public.territory_influence mine where mine.user_id=(select auth.uid()) and mine.influence_points>0 and not exists(select 1 from public.territory_influence rival where rival.territory_id=mine.territory_id and (rival.influence_points>mine.influence_points or (rival.influence_points=mine.influence_points and rival.user_id<>mine.user_id)))) controlled,
 (select coalesce(sum(distance_meters),0) from public.activities,bounds where user_id=(select auth.uid()) and activity_type in('walking','running','cycling') and started_at>=ws and started_at<ws+interval '7 days') week_distance,
 (select coalesce(sum(influence_delta),0) from public.influence_ledger,bounds where user_id=(select auth.uid()) and created_at>=ws and created_at<ws+interval '7 days') week_influence)
select jsonb_build_object('weekStart',b.ws,'weekEnd',b.ws+interval '7 days','totalZonesDiscovered',s.discovered,'newZonesThisWeek',s.new_week,'zonesControlled',s.controlled,'totalInfluence',s.total_inf,'coins',p.coins,
 'objectives',jsonb_build_array(jsonb_build_object('key','explorer','title','Explorer','progress',s.new_week,'target',3,'coins',25,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='explorer')),jsonb_build_object('key','influence','title','Influence','progress',s.week_influence,'target',25,'coins',25,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='influence')),jsonb_build_object('key','distance','title','Distance','progress',s.week_distance,'target',5000,'coins',50,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='distance'))),
 'achievements',coalesce((select jsonb_agg(jsonb_build_object('key',achievement_key,'title',replace(initcap(achievement_key),'_',' '),'description',case achievement_key when 'first_footprint' then 'Discover 1 zone' when 'explorer' then 'Discover 10 zones' when 'pathfinder' then 'Discover 25 zones' when 'cartographer' then 'Discover 50 zones' when 'conqueror' then 'Control 10 zones at once' else 'Earn 100 total influence' end,'unlockedAt',unlocked_at) order by unlocked_at) from public.player_achievements where user_id=(select auth.uid())),'[]'::jsonb))
from bounds b cross join stats s join public.player_progress p on p.user_id=(select auth.uid());
$$;
revoke all on function public.get_my_exploration_summary() from public,anon;
grant execute on function public.get_my_exploration_summary() to authenticated;
comment on table public.zone_discoveries is 'Permanent first positive authoritative influence per player and zone; backfilled from positive influence_ledger history.';
comment on table public.weekly_objective_rewards is 'One idempotent automatic Coin grant per player, UTC server week, and objective. No direct client writes.';
