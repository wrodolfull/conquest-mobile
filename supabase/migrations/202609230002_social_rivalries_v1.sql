-- SOCIAL + RIVALRIES V1. Additive, route-free social projections and inbox.
create table public.notifications(
 id uuid primary key default extensions.gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in('FRIEND_REQUEST','FRIEND_ACCEPTED','BATTLE_PRESSURE_RECEIVED','TERRITORY_CONTESTED','TERRITORY_LOST','RIVALRY_STARTED','ACHIEVEMENT_UNLOCKED','OBJECTIVE_COMPLETED')),
 actor_user_id uuid references auth.users(id) on delete set null,
 territory_id text references public.territories(id) on delete set null,
 battle_id uuid references public.territory_battles(id) on delete set null,
 source_key text not null check(char_length(source_key) between 1 and 180),
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'),
 created_at timestamptz not null default now(), read_at timestamptz,
 unique(user_id,type,source_key)
);
create index notifications_user_time_idx on public.notifications(user_id,created_at desc,id);
create index notifications_user_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;
create index if not exists territory_battles_pair_time_idx on public.territory_battles(least(attacker_user_id,defender_user_id),greatest(attacker_user_id,defender_user_id),created_at desc);
create index if not exists territory_influence_positive_user_territory_idx on public.territory_influence(user_id,territory_id) where influence_points>0;
create index if not exists activities_weekly_rank_idx on public.activities(user_id,started_at) where activity_type in('walking','running','cycling');

alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;

create function public.social_pair_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.friendships f where f.status='blocked' and ((f.requester_id=a and f.addressee_id=b) or(f.requester_id=b and f.addressee_id=a)))
$$;
revoke all on function public.social_pair_blocked(uuid,uuid) from public,anon,authenticated;

create function public.create_social_notification(p_user_id uuid,p_type text,p_source_key text,p_actor_user_id uuid default null,p_territory_id text default null,p_battle_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_actor_user_id=p_user_id or (p_actor_user_id is not null and public.social_pair_blocked(p_user_id,p_actor_user_id)) then return; end if;
 insert into public.notifications(user_id,type,actor_user_id,territory_id,battle_id,source_key,metadata)
 values(p_user_id,p_type,p_actor_user_id,p_territory_id,p_battle_id,p_source_key,coalesce(p_metadata,'{}'::jsonb)) on conflict(user_id,type,source_key) do nothing;
end$$;
revoke all on function public.create_social_notification(uuid,text,text,uuid,text,uuid,jsonb) from public,anon,authenticated;

create function public.friendship_notification_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' and new.status='pending' then
  perform public.create_social_notification(new.addressee_id,'FRIEND_REQUEST','friendship:'||new.id,new.requester_id);
 elsif tg_op='UPDATE' and old.status='pending' and new.status='accepted' then
  perform public.create_social_notification(new.requester_id,'FRIEND_ACCEPTED','friendship:'||new.id,new.addressee_id);
 end if; return new;
end$$;
create trigger friendship_notifications after insert or update on public.friendships for each row execute function public.friendship_notification_trigger();

create function public.battle_notification_trigger() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text;
begin
 kind:=case new.result when 'pressure' then 'BATTLE_PRESSURE_RECEIVED' when 'contested' then 'TERRITORY_CONTESTED' else 'TERRITORY_LOST' end;
 -- The influence-row trigger also protects normal activity transitions. During a
 -- battle it runs before this immutable battle row exists, so replace that
 -- provisional transition event with the canonical battle-sourced event.
 delete from public.notifications where user_id=new.defender_user_id and type='TERRITORY_LOST' and actor_user_id=new.attacker_user_id and territory_id=new.territory_id and source_key like 'influence:%' and created_at>=transaction_timestamp();
 perform public.create_social_notification(new.defender_user_id,kind,'battle:'||new.id,new.attacker_user_id,new.territory_id,new.id,jsonb_build_object('result',new.result));
 perform public.refresh_rivalry_pair(new.attacker_user_id,new.defender_user_id);
 return new;
end$$;

create table public.rivalry_activation_state(
 user_low uuid not null references auth.users(id) on delete cascade,
 user_high uuid not null references auth.users(id) on delete cascade,
 active boolean not null default false, activated_at timestamptz, updated_at timestamptz not null default now(),
 primary key(user_low,user_high), check(user_low<user_high)
);
alter table public.rivalry_activation_state enable row level security;
revoke all on public.rivalry_activation_state from public,anon,authenticated;

create function public.is_active_rivalry(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select a<>b and not public.social_pair_blocked(a,b) and (
  (select count(*)>=2 from public.territory_battles x where ((x.attacker_user_id=a and x.defender_user_id=b)or(x.attacker_user_id=b and x.defender_user_id=a)) and x.created_at>=now()-interval '30 days')
  or exists(with shared as(select ma.territory_id,ma.influence_points ai,mb.influence_points bi from public.territory_influence ma join public.territory_influence mb on mb.territory_id=ma.territory_id and mb.user_id=b and mb.influence_points>0 where ma.user_id=a and ma.influence_points>0), eligible as(select s.*,(select max(influence_points) from public.territory_influence where territory_id=s.territory_id) top from shared s) select 1 from eligible having count(*)>=3 and bool_or(ai=top or bi=top))
 )
$$;
revoke all on function public.is_active_rivalry(uuid,uuid) from public,anon,authenticated;

create function public.refresh_rivalry_pair(a uuid,b uuid) returns void language plpgsql security definer set search_path='' as $$
declare lo uuid:=least(a,b); hi uuid:=greatest(a,b); was boolean:=false; now_active boolean;
begin
 if a is null or b is null or a=b then return; end if;
 select active into was from public.rivalry_activation_state where user_low=lo and user_high=hi for update;
 now_active:=public.is_active_rivalry(a,b);
 insert into public.rivalry_activation_state(user_low,user_high,active,activated_at) values(lo,hi,now_active,case when now_active then now() end)
 on conflict(user_low,user_high) do update set active=excluded.active,activated_at=case when excluded.active and not public.rivalry_activation_state.active then now() else public.rivalry_activation_state.activated_at end,updated_at=now();
 if now_active and not coalesce(was,false) then
  perform public.create_social_notification(a,'RIVALRY_STARTED','rivalry:'||lo||':'||hi||':'||date_trunc('second',now()),b);
  perform public.create_social_notification(b,'RIVALRY_STARTED','rivalry:'||lo||':'||hi||':'||date_trunc('second',now()),a);
 end if;
end$$;
-- Created after refresh_rivalry_pair so function-body validation is deterministic.
create trigger battle_notifications after insert on public.territory_battles for each row execute function public.battle_notification_trigger();

create function public.influence_social_transition_trigger() returns trigger language plpgsql security definer set search_path='' as $$
declare rival record; previous_leader uuid; previous_points bigint; old_points bigint:=0;
begin
 if tg_op='UPDATE' then old_points:=old.influence_points; end if;
 -- If this row overtook a sole competitor through normal activity, notify that prior leader.
 select user_id,influence_points into previous_leader,previous_points from public.territory_influence where territory_id=new.territory_id and user_id<>new.user_id order by influence_points desc,user_id limit 1;
 if previous_leader is not null and previous_points>old_points and new.influence_points>=previous_points
   and (select count(*) from public.territory_influence where territory_id=new.territory_id and user_id<>new.user_id and influence_points=previous_points)=1 then
  perform public.create_social_notification(previous_leader,'TERRITORY_LOST','influence:'||new.territory_id||':'||new.user_id||':'||new.influence_points,new.user_id,new.territory_id,null,jsonb_build_object('cause','activity'));
 end if;
 for rival in select user_id from public.territory_influence where territory_id=new.territory_id and user_id<>new.user_id and influence_points>0 loop perform public.refresh_rivalry_pair(new.user_id,rival.user_id); end loop;
 return new;
end$$;
create trigger influence_social_transitions after insert or update of influence_points on public.territory_influence for each row execute function public.influence_social_transition_trigger();

create function public.exploration_notification_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='player_achievements' then perform public.create_social_notification(new.user_id,'ACHIEVEMENT_UNLOCKED','achievement:'||new.achievement_key,null,null,null,jsonb_build_object('achievementKey',new.achievement_key));
 else perform public.create_social_notification(new.user_id,'OBJECTIVE_COMPLETED','objective:'||new.week_start||':'||new.objective_key,null,null,null,jsonb_build_object('objectiveKey',new.objective_key,'coins',new.coins)); end if;
 return new;
end$$;
create trigger new_achievement_notification after insert on public.player_achievements for each row execute function public.exploration_notification_trigger();
create trigger new_objective_notification after insert on public.weekly_objective_rewards for each row execute function public.exploration_notification_trigger();

create function public.get_my_social_summary() returns jsonb language sql stable security definer set search_path='' as $$
 with candidates as(select case when attacker_user_id=(select auth.uid()) then defender_user_id else attacker_user_id end rival from public.territory_battles where (attacker_user_id=(select auth.uid())or defender_user_id=(select auth.uid())) and created_at>=now()-interval '30 days' union select b.user_id from public.territory_influence a join public.territory_influence b on b.territory_id=a.territory_id and b.user_id<>a.user_id and b.influence_points>0 where a.user_id=(select auth.uid()) and a.influence_points>0), rival_count as(select count(*) n from candidates where public.is_active_rivalry((select auth.uid()),rival)), friendship_counts as(select count(*) filter(where f.status='accepted') friends,count(*) filter(where f.status='pending' and f.addressee_id=(select auth.uid())) pending from public.friendships f where f.requester_id=(select auth.uid()) or f.addressee_id=(select auth.uid())) select jsonb_build_object('friendsCount',fc.friends,'pendingRequests',fc.pending,'unreadNotifications',(select count(*) from public.notifications where user_id=(select auth.uid()) and read_at is null),'activeRivalries',rc.n) from friendship_counts fc cross join rival_count rc
$$;
create function public.get_my_notifications(p_limit integer default 30,p_before timestamptz default null) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'type',x.type,'actorUserId',x.actor_user_id,'actorUsername',p.username,'actorDisplayName',p.display_name,'actorAvatarUrl',p.avatar_url,'territoryId',x.territory_id,'territoryName',t.name,'battleId',x.battle_id,'metadata',x.metadata,'createdAt',x.created_at,'readAt',x.read_at) order by x.created_at desc),'[]'::jsonb) from(select * from public.notifications where user_id=(select auth.uid()) and(p_before is null or created_at<p_before) order by created_at desc limit least(greatest(p_limit,1),50))x left join public.profiles p on p.id=x.actor_user_id left join public.territories t on t.id=x.territory_id
$$;
create function public.mark_notification_read(p_notification_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin update public.notifications set read_at=coalesce(read_at,now()) where id=p_notification_id and user_id=(select auth.uid());if not found then raise exception 'notification unavailable';end if;end$$;
create function public.mark_all_notifications_read() returns void language sql volatile security definer set search_path='' as $$ update public.notifications set read_at=now() where user_id=(select auth.uid()) and read_at is null $$;

create function public.rivalry_snapshot(me uuid,them uuid) returns jsonb language sql stable security definer set search_path='' as $$
with battles as(select * from public.territory_battles where ((attacker_user_id=me and defender_user_id=them)or(attacker_user_id=them and defender_user_id=me)) and created_at>=now()-interval '30 days'), shared as(select a.territory_id,a.influence_points mine,b.influence_points theirs,(select max(influence_points) from public.territory_influence where territory_id=a.territory_id) top from public.territory_influence a join public.territory_influence b on b.territory_id=a.territory_id and b.user_id=them and b.influence_points>0 where a.user_id=me and a.influence_points>0), rel as(select status from public.friendships where (requester_id=me and addressee_id=them)or(requester_id=them and addressee_id=me))
select jsonb_build_object('rivalUserId',them,'username',p.username,'displayName',p.display_name,'avatarUrl',p.avatar_url,'level',case when v.show_level and v.profile_visibility<>'private' then g.level end,'battlesLast30Days',(select count(*) from battles),'myBattleWins',(select count(*) from battles where attacker_user_id=me and result='captured'),'theirBattleWins',(select count(*) from battles where attacker_user_id=them and result='captured'),'contestedBattles',(select count(*) from battles where result='contested'),'sharedTerritories',(select count(*) from shared),'territoriesILead',(select count(*) from shared where mine=top and theirs<top),'territoriesTheyLead',(select count(*) from shared where theirs=top and mine<top),'lastInteractionAt',(select max(created_at) from battles),'relationshipStatus',coalesce((select case when status='accepted' then 'friends' else 'none' end from rel),'none')) from public.profiles p join public.profile_privacy v on v.user_id=p.id left join public.player_progress g on g.user_id=p.id where p.id=them
$$;
revoke all on function public.rivalry_snapshot(uuid,uuid) from public,anon,authenticated;

create function public.get_my_rivalries(p_limit integer default 20,p_before timestamptz default null) returns jsonb language sql stable security definer set search_path='' as $$
 with candidates as(select case when attacker_user_id=(select auth.uid()) then defender_user_id else attacker_user_id end rival from public.territory_battles where (attacker_user_id=(select auth.uid())or defender_user_id=(select auth.uid())) and created_at>=now()-interval '30 days' union select b.user_id from public.territory_influence a join public.territory_influence b on b.territory_id=a.territory_id and b.user_id<>a.user_id and b.influence_points>0 where a.user_id=(select auth.uid()) and a.influence_points>0), rows as(select public.rivalry_snapshot((select auth.uid()),rival) item from candidates where public.is_active_rivalry((select auth.uid()),rival)) select coalesce(jsonb_agg(item order by item->>'lastInteractionAt' desc nulls last),'[]'::jsonb) from(select item from rows where p_before is null or nullif(item->>'lastInteractionAt','')::timestamptz<p_before order by item->>'lastInteractionAt' desc nulls last limit least(greatest(p_limit,1),50))x
$$;
create function public.get_rivalry_detail(p_target_user_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; clashes jsonb;begin if not public.is_active_rivalry((select auth.uid()),p_target_user_id) then raise exception 'rivalry unavailable';end if;result:=public.rivalry_snapshot((select auth.uid()),p_target_user_id);select coalesce(jsonb_agg(jsonb_build_object('battleId',b.id,'territoryId',b.territory_id,'territoryName',t.name,'result',b.result,'role',case when b.attacker_user_id=(select auth.uid()) then 'attack' else 'defense' end,'createdAt',b.created_at) order by b.created_at desc),'[]'::jsonb) into clashes from(select * from public.territory_battles where ((attacker_user_id=(select auth.uid()) and defender_user_id=p_target_user_id)or(defender_user_id=(select auth.uid()) and attacker_user_id=p_target_user_id)) order by created_at desc limit 20)b join public.territories t on t.id=b.territory_id;return result||jsonb_build_object('recentBattles',clashes);end$$;
create function public.get_rivalry_shared_territories(p_target_user_id uuid,p_limit integer default 20,p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;begin if not public.is_active_rivalry((select auth.uid()),p_target_user_id) then raise exception 'rivalry unavailable';end if;select coalesce(jsonb_agg(jsonb_build_object('territoryId',x.id,'territoryName',x.name,'myInfluence',x.mine,'theirInfluence',x.theirs,'leaderUserId',x.leader,'status',case when x.leaders>1 then 'tied' when x.leader=(select auth.uid()) then 'i_lead' when x.leader=p_target_user_id then 'they_lead' else 'other_leads' end) order by x.name,x.id),'[]'::jsonb) into result from(select t.id,t.name,a.influence_points mine,b.influence_points theirs,(array_agg(all_i.user_id order by all_i.user_id) filter(where all_i.influence_points=mx.top))[1] leader,count(*) filter(where all_i.influence_points=mx.top) leaders from public.territory_influence a join public.territory_influence b on b.territory_id=a.territory_id and b.user_id=p_target_user_id and b.influence_points>0 join public.territories t on t.id=a.territory_id join lateral(select max(influence_points) top from public.territory_influence where territory_id=a.territory_id)mx on true join public.territory_influence all_i on all_i.territory_id=a.territory_id where a.user_id=(select auth.uid()) and a.influence_points>0 group by t.id,t.name,a.influence_points,b.influence_points,mx.top order by t.name,t.id limit least(greatest(p_limit,1),50) offset greatest(p_offset,0))x;return result;end$$;

create function public.get_my_friends_weekly_leaderboard() returns jsonb language sql stable security definer set search_path='' as $$
with members as(select (select auth.uid()) id union select case when requester_id=(select auth.uid()) then addressee_id else requester_id end from public.friendships where status='accepted' and(requester_id=(select auth.uid())or addressee_id=(select auth.uid()))), allowed as(select m.id,(m.id=(select auth.uid()) or (v.show_stats and v.activity_visibility<>'private' and v.profile_visibility<>'private')) visible from members m join public.profile_privacy v on v.user_id=m.id where not public.social_pair_blocked((select auth.uid()),m.id)), stats as(select a.id,a.visible,case when a.visible then coalesce((select sum(distance_meters) from public.activities where user_id=a.id and activity_type in('walking','running','cycling') and started_at>=date_trunc('week',now())),0) end distance,case when a.visible then coalesce((select sum(influence_delta) from public.influence_ledger where user_id=a.id and created_at>=date_trunc('week',now())),0) end influence,case when a.visible then(select count(*) from public.zone_discoveries where user_id=a.id and discovered_at>=date_trunc('week',now())) end zones from allowed a), ranked as(select s.*,row_number()over(order by distance desc nulls last,influence desc nulls last,zones desc nulls last,id) rank from stats s), bounded as(select * from ranked order by rank limit 100)
select coalesce(jsonb_agg(jsonb_build_object('rank',b.rank,'userId',b.id,'username',p.username,'displayName',p.display_name,'avatarUrl',p.avatar_url,'distanceMeters',b.distance,'weeklyInfluence',b.influence,'newZones',b.zones,'statsVisible',b.visible) order by b.rank),'[]'::jsonb) from bounded b join public.profiles p on p.id=b.id
$$;

revoke all on function public.get_my_social_summary(),public.get_my_notifications(integer,timestamptz),public.mark_notification_read(uuid),public.mark_all_notifications_read(),public.get_my_rivalries(integer,timestamptz),public.get_rivalry_detail(uuid),public.get_rivalry_shared_territories(uuid,integer,integer),public.get_my_friends_weekly_leaderboard() from public,anon;
grant execute on function public.get_my_social_summary(),public.get_my_notifications(integer,timestamptz),public.mark_notification_read(uuid),public.mark_all_notifications_read(),public.get_my_rivalries(integer,timestamptz),public.get_rivalry_detail(uuid),public.get_rivalry_shared_territories(uuid,integer,integer),public.get_my_friends_weekly_leaderboard() to authenticated;
comment on table public.notifications is 'Owner-scoped structured in-app notifications. No client insert/update grants; source keys make delivery idempotent.';
