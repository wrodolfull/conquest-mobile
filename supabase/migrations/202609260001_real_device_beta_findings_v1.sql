-- REAL DEVICE BETA FINDINGS V1. Additive balance and privacy-safe account deletion support.
alter table public.territory_battle_config add column min_presence_ratio numeric not null default 0.25 check(min_presence_ratio>0 and min_presence_ratio<=1);

create or replace function public.get_territory_battle_state(p_territory_id text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); cfg public.territory_battle_config%rowtype; mine bigint:=0; required_influence bigint:=0; top_points bigint:=0; leaders integer:=0; leader uuid; energy_now integer:=0; available_at timestamptz; protected timestamptz; reason text;
begin
 if u is null then raise exception 'authentication required'; end if;
 if not exists(select 1 from public.territories where id=p_territory_id) then raise exception 'territory not found'; end if;
 select * into cfg from public.territory_battle_config where singleton;
 select coalesce(max(influence_points) filter(where user_id=u),0),coalesce(max(influence_points),0) into mine,top_points from public.territory_influence where territory_id=p_territory_id and influence_points>0;
 required_influence:=ceil(top_points*cfg.min_presence_ratio);
 select count(*),(array_agg(user_id order by user_id))[1] into leaders,leader from public.territory_influence where territory_id=p_territory_id and influence_points=top_points and top_points>0;
 select coalesce(p.energy,0) into energy_now from public.player_progress p where p.user_id=u;
 select max(b.battle_available_at) into available_at from public.territory_battles b where b.attacker_user_id=u and b.territory_id=p_territory_id and b.battle_available_at>now();
 select max(b.protected_until) into protected from public.territory_battles b where b.territory_id=p_territory_id and b.control_changed and b.protected_until>now();
 reason:=case when top_points=0 or leaders<>1 then 'NO_RIVAL_LEADER' when leader=u then 'OWN_TERRITORY' when mine=0 then 'NO_LOCAL_INFLUENCE'
  when mine<required_influence then 'INSUFFICIENT_PRESENCE'
  when not exists(select 1 from public.influence_ledger l where l.user_id=u and l.territory_id=p_territory_id and l.influence_delta>0 and l.created_at>=now()-cfg.recent_activity) then 'RECENT_ACTIVITY_REQUIRED'
  when energy_now<cfg.energy_cost then 'INSUFFICIENT_ENERGY' when available_at is not null then 'COOLDOWN' when protected is not null then 'PROTECTED' end;
 return jsonb_build_object('eligible',reason is null,'reason',reason,'energyCost',cfg.energy_cost,'influenceReward',cfg.influence_reward,'myInfluence',mine,'leaderInfluence',top_points,'requiredInfluence',required_influence,'currentEnergy',energy_now,'battleAvailableAt',available_at,'protectedUntil',protected);
end$$;


create or replace function public.refresh_exploration_rewards(p_user_id uuid,p_activity_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare ws timestamptz:=date_trunc('week',now()); inserted integer; discoveries bigint; influence bigint; distance double precision; controlled bigint; total_inf bigint;
begin
 select count(*) into discoveries from public.zone_discoveries where user_id=p_user_id and discovered_at>=ws and discovered_at<ws+interval '7 days';
 select coalesce(sum(influence_delta),0) into influence from public.influence_ledger where user_id=p_user_id and created_at>=ws and created_at<ws+interval '7 days';
 select coalesce(sum(distance_meters),0) into distance from public.activities where user_id=p_user_id and activity_type in('walking','running','cycling') and started_at>=ws and started_at<ws+interval '7 days';
 if discoveries>=3 then insert into public.weekly_objective_rewards values(p_user_id,ws,'explorer',25,p_activity_id,now()) on conflict do nothing; get diagnostics inserted=row_count; if inserted=1 then update public.player_progress set coins=coins+25,updated_at=now() where user_id=p_user_id; end if; end if;
 if influence>=50 then insert into public.weekly_objective_rewards values(p_user_id,ws,'influence',25,p_activity_id,now()) on conflict do nothing; get diagnostics inserted=row_count; if inserted=1 then update public.player_progress set coins=coins+25,updated_at=now() where user_id=p_user_id; end if; end if;
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

create or replace function public.get_my_exploration_summary() returns jsonb language sql stable security definer set search_path='' as $$
with bounds as(select date_trunc('week',now()) ws), stats as(select
 (select count(*) from public.zone_discoveries where user_id=(select auth.uid())) discovered,
 (select count(*) from public.zone_discoveries,bounds where user_id=(select auth.uid()) and discovered_at>=ws and discovered_at<ws+interval '7 days') new_week,
 (select coalesce(sum(influence_points),0) from public.territory_influence where user_id=(select auth.uid())) total_inf,
 (select count(*) from public.territory_influence mine where mine.user_id=(select auth.uid()) and mine.influence_points>0 and not exists(select 1 from public.territory_influence rival where rival.territory_id=mine.territory_id and (rival.influence_points>mine.influence_points or (rival.influence_points=mine.influence_points and rival.user_id<>mine.user_id)))) controlled,
 (select coalesce(sum(distance_meters),0) from public.activities,bounds where user_id=(select auth.uid()) and activity_type in('walking','running','cycling') and started_at>=ws and started_at<ws+interval '7 days') week_distance,
 (select coalesce(sum(influence_delta),0) from public.influence_ledger,bounds where user_id=(select auth.uid()) and created_at>=ws and created_at<ws+interval '7 days') week_influence)
select jsonb_build_object('weekStart',b.ws,'weekEnd',b.ws+interval '7 days','totalZonesDiscovered',s.discovered,'newZonesThisWeek',s.new_week,'zonesControlled',s.controlled,'totalInfluence',s.total_inf,'coins',p.coins,
 'objectives',jsonb_build_array(jsonb_build_object('key','explorer','title','Explorer','progress',s.new_week,'target',3,'coins',25,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='explorer')),jsonb_build_object('key','influence','title','Influence','progress',s.week_influence,'target',50,'coins',25,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='influence')),jsonb_build_object('key','distance','title','Distance','progress',s.week_distance,'target',5000,'coins',50,'rewardedAt',(select rewarded_at from public.weekly_objective_rewards where user_id=(select auth.uid()) and week_start=b.ws and objective_key='distance'))),
 'achievements',coalesce((select jsonb_agg(jsonb_build_object('key',achievement_key,'title',replace(initcap(achievement_key),'_',' '),'description',case achievement_key when 'first_footprint' then 'Discover 1 zone' when 'explorer' then 'Discover 10 zones' when 'pathfinder' then 'Discover 25 zones' when 'cartographer' then 'Discover 50 zones' when 'conqueror' then 'Control 10 zones at once' else 'Earn 100 total influence' end,'unlockedAt',unlocked_at) order by unlocked_at) from public.player_achievements where user_id=(select auth.uid())),'[]'::jsonb))
from bounds b cross join stats s join public.player_progress p on p.user_id=(select auth.uid());
$$;

-- Preserve battle facts while erasing a deleted participant's identity.
create or replace function public.reject_battle_mutation() returns trigger language plpgsql set search_path='' as $$
begin
 if (old.attacker_user_id is not distinct from new.attacker_user_id or new.attacker_user_id is null)
    and (old.defender_user_id is not distinct from new.defender_user_id or new.defender_user_id is null)
    and (new.attacker_user_id is distinct from old.attacker_user_id or new.defender_user_id is distinct from old.defender_user_id) then return new; end if;
 raise exception 'battle history is immutable';
end$$;
alter table public.territory_battles alter column attacker_user_id drop not null, alter column defender_user_id drop not null;
alter table public.territory_battles drop constraint territory_battles_attacker_user_id_fkey, drop constraint territory_battles_defender_user_id_fkey;
alter table public.territory_battles add constraint territory_battles_attacker_user_id_fkey foreign key(attacker_user_id) references auth.users(id) on delete set null, add constraint territory_battles_defender_user_id_fkey foreign key(defender_user_id) references auth.users(id) on delete set null;
