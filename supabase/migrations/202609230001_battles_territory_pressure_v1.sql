-- BATTLES + TERRITORY PRESSURE V1. Battles add auditable pressure to the existing influence total.
create table public.territory_battle_config(
 singleton boolean primary key default true check(singleton),
 energy_cost integer not null check(energy_cost>0), influence_reward integer not null check(influence_reward>0),
 cooldown interval not null check(cooldown>interval '0'), capture_protection interval not null check(capture_protection>interval '0'),
 recent_activity interval not null check(recent_activity>interval '0')
);
insert into public.territory_battle_config values(true,20,2,interval '12 hours',interval '6 hours',interval '7 days');

create table public.territory_battles(
 id uuid primary key default extensions.gen_random_uuid(), client_battle_id uuid not null,
 territory_id text not null references public.territories(id), attacker_user_id uuid not null references auth.users(id), defender_user_id uuid not null references auth.users(id),
 attacker_influence_before bigint not null check(attacker_influence_before>0), defender_influence_before bigint not null check(defender_influence_before>0),
 attacker_influence_after bigint not null check(attacker_influence_after>=attacker_influence_before), defender_influence_after bigint not null check(defender_influence_after=defender_influence_before),
 energy_spent integer not null check(energy_spent>0), influence_awarded integer not null check(influence_awarded>0),
 result text not null check(result in('pressure','contested','captured')), control_changed boolean not null,
 battle_available_at timestamptz not null, protected_until timestamptz, response jsonb not null, created_at timestamptz not null default now(),
 unique(attacker_user_id,client_battle_id)
);
create index territory_battles_attacker_time_idx on public.territory_battles(attacker_user_id,created_at desc);
create index territory_battles_defender_time_idx on public.territory_battles(defender_user_id,created_at desc);
create index territory_battles_cooldown_idx on public.territory_battles(attacker_user_id,territory_id,created_at desc);
create index territory_battles_protection_idx on public.territory_battles(territory_id,protected_until desc) where control_changed;

alter table public.territory_battle_config enable row level security;
alter table public.territory_battles enable row level security;
revoke all on public.territory_battle_config,public.territory_battles from public,anon,authenticated;

create function public.reject_battle_mutation() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'battle history is immutable'; end$$;
create trigger territory_battles_immutable before update or delete on public.territory_battles for each row execute function public.reject_battle_mutation();

create function public.get_territory_battle_state(p_territory_id text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); cfg public.territory_battle_config%rowtype; mine bigint:=0; top_points bigint:=0; leaders integer:=0; leader uuid; energy_now integer:=0; available_at timestamptz; protected timestamptz; reason text;
begin
 if u is null then raise exception 'authentication required'; end if;
 if not exists(select 1 from public.territories where id=p_territory_id) then raise exception 'territory not found'; end if;
 select * into cfg from public.territory_battle_config where singleton;
 select coalesce(max(influence_points) filter(where user_id=u),0),coalesce(max(influence_points),0) into mine,top_points from public.territory_influence where territory_id=p_territory_id and influence_points>0;
 select count(*),(array_agg(user_id order by user_id))[1] into leaders,leader from public.territory_influence where territory_id=p_territory_id and influence_points=top_points and top_points>0;
 select coalesce(p.energy,0) into energy_now from public.player_progress p where p.user_id=u;
 select max(b.battle_available_at) into available_at from public.territory_battles b where b.attacker_user_id=u and b.territory_id=p_territory_id and b.battle_available_at>now();
 select max(b.protected_until) into protected from public.territory_battles b where b.territory_id=p_territory_id and b.control_changed and b.protected_until>now();
 reason:=case when top_points=0 or leaders<>1 then 'NO_RIVAL_LEADER' when leader=u then 'OWN_TERRITORY' when mine=0 then 'NO_LOCAL_INFLUENCE'
  when mine*2<top_points then 'INSUFFICIENT_PRESENCE'
  when not exists(select 1 from public.influence_ledger l where l.user_id=u and l.territory_id=p_territory_id and l.influence_delta>0 and l.created_at>=now()-cfg.recent_activity) then 'RECENT_ACTIVITY_REQUIRED'
  when energy_now<cfg.energy_cost then 'INSUFFICIENT_ENERGY' when available_at is not null then 'COOLDOWN' when protected is not null then 'PROTECTED' end;
 return jsonb_build_object('eligible',reason is null,'reason',reason,'energyCost',cfg.energy_cost,'influenceReward',cfg.influence_reward,'myInfluence',mine,'leaderInfluence',top_points,'currentEnergy',energy_now,'battleAvailableAt',available_at,'protectedUntil',protected);
end$$;

create function public.start_territory_battle(p_territory_id text,p_client_battle_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); cfg public.territory_battle_config%rowtype; existing jsonb; state jsonb; defender uuid; mine bigint; rival bigint; after_points bigint; remaining integer; outcome text; changed boolean; battle_id uuid:=extensions.gen_random_uuid(); available_at timestamptz; protected timestamptz; territory_name text; payload jsonb;
begin
 if u is null then raise exception 'authentication required'; end if;
 -- Serialize retries before reading the idempotency key, then serialize all changes for the zone.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_client_battle_id::text,0));
 select b.response into existing from public.territory_battles b where b.attacker_user_id=u and b.client_battle_id=p_client_battle_id;
 if existing is not null then return existing; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_territory_id,0));
 perform 1 from public.territories where id=p_territory_id for update;
 if not found then raise exception 'territory not found'; end if;
 perform 1 from public.territory_influence where territory_id=p_territory_id for update;
 perform 1 from public.player_progress where user_id=u for update;
 if not found then raise exception 'player progress not found'; end if;
 state:=public.get_territory_battle_state(p_territory_id);
 if not (state->>'eligible')::boolean then raise exception 'BATTLE_INELIGIBLE:%',state->>'reason' using errcode='P0001'; end if;
 select * into cfg from public.territory_battle_config where singleton;
 select ti.user_id,ti.influence_points into defender,rival from public.territory_influence ti where ti.territory_id=p_territory_id order by ti.influence_points desc limit 1;
 select influence_points into mine from public.territory_influence where territory_id=p_territory_id and user_id=u for update;
 update public.player_progress set energy=energy-cfg.energy_cost,updated_at=now() where user_id=u and energy>=cfg.energy_cost returning energy into remaining;
 if not found then raise exception 'BATTLE_INELIGIBLE:INSUFFICIENT_ENERGY' using errcode='P0001'; end if;
 after_points:=mine+cfg.influence_reward;
 update public.territory_influence set influence_points=after_points,updated_at=now() where territory_id=p_territory_id and user_id=u;
 outcome:=case when after_points>rival then 'captured' when after_points=rival then 'contested' else 'pressure' end; changed:=outcome='captured';
 available_at:=now()+cfg.cooldown; protected:=case when changed then now()+cfg.capture_protection end;
 select name into territory_name from public.territories where id=p_territory_id;
 payload:=jsonb_build_object('battleId',battle_id,'result',outcome,'territoryId',p_territory_id,'territoryName',territory_name,'energySpent',cfg.energy_cost,'energyRemaining',remaining,'influenceAwarded',cfg.influence_reward,'myInfluenceBefore',mine,'myInfluenceAfter',after_points,'leaderInfluenceBefore',rival,'statusAfter',case when changed then 'owned' when outcome='contested' then 'contested' else 'rival' end,'controlChanged',changed,'battleAvailableAt',available_at,'protectedUntil',protected);
 insert into public.territory_battles values(battle_id,p_client_battle_id,p_territory_id,u,defender,mine,rival,after_points,rival,cfg.energy_cost,cfg.influence_reward,outcome,changed,available_at,protected,payload,now());
 return payload;
end$$;

create function public.get_my_battle_history(p_limit integer default 10,p_before timestamptz default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('battleId',x.id,'territoryId',x.territory_id,'territoryName',x.name,'role',case when x.attacker_user_id=(select auth.uid()) then 'attack' else 'defense' end,'result',x.result,'influenceAwarded',x.influence_awarded,'controlChanged',x.control_changed,'createdAt',x.created_at) order by x.created_at desc),'[]'::jsonb)
 from(select b.*,t.name from public.territory_battles b join public.territories t on t.id=b.territory_id where (b.attacker_user_id=(select auth.uid()) or b.defender_user_id=(select auth.uid())) and (p_before is null or b.created_at<p_before) order by b.created_at desc limit least(greatest(p_limit,1),25)) x;
$$;
revoke all on function public.get_territory_battle_state(text),public.start_territory_battle(text,uuid),public.get_my_battle_history(integer,timestamptz) from public,anon;
grant execute on function public.get_territory_battle_state(text),public.start_territory_battle(text,uuid),public.get_my_battle_history(integer,timestamptz) to authenticated;
comment on table public.territory_battles is 'Immutable, route-free battle pressure audit. Activity influence remains exclusively in influence_ledger.';
