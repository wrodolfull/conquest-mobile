-- SOCIAL V1: harden and complete the existing friendship foundation.
-- This migration is additive/data-safe: it preserves profiles, progress, activities,
-- territory data, and existing friendship rows.

create index if not exists friendships_pending_addressee_idx
  on public.friendships(addressee_id, created_at desc) where status = 'pending';
create index if not exists friendships_status_participants_idx
  on public.friendships(status, requester_id, addressee_id);

-- Friendship state is RPC-only. Revoke before replacing every state transition.
revoke all on public.friendships from anon, authenticated;

-- PostgreSQL requires a drop when an argument name or TABLE return shape changes.
drop function if exists public.accept_friend_request(uuid);
drop function if exists public.search_players(text);

create or replace function public.send_friend_request(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := (select auth.uid()); existing public.friendships%rowtype;
begin
  if caller is null then raise exception using errcode='42501', message='authentication required'; end if;
  if target_user_id is null or target_user_id = caller then raise exception using errcode='22023', message='cannot friend self'; end if;
  if not exists(select 1 from public.profiles where id=target_user_id) then raise exception using errcode='P0002', message='player not found'; end if;
  select * into existing from public.friendships
    where least(requester_id,addressee_id)=least(caller,target_user_id)
      and greatest(requester_id,addressee_id)=greatest(caller,target_user_id) for update;
  if found then
    if existing.status='blocked' then raise exception using errcode='42501', message='relationship unavailable'; end if;
    if existing.status='accepted' then raise exception using errcode='23505', message='already friends'; end if;
    if existing.requester_id=target_user_id then raise exception using errcode='23505', message='incoming request exists'; end if;
    raise exception using errcode='23505', message='request already sent';
  end if;
  insert into public.friendships(requester_id,addressee_id,status) values(caller,target_user_id,'pending');
end $$;

create or replace function public.accept_friend_request(request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception using errcode='42501', message='authentication required'; end if;
  update public.friendships set status='accepted',updated_at=now()
    where id=request_id and addressee_id=(select auth.uid()) and status='pending';
  if not found then raise exception using errcode='42501', message='request unavailable'; end if;
end $$;

create or replace function public.decline_friend_request(request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.friendships where id=request_id and addressee_id=(select auth.uid()) and status='pending';
  if not found then raise exception using errcode='42501', message='request unavailable'; end if;
end $$;

create or replace function public.cancel_friend_request(request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.friendships where id=request_id and requester_id=(select auth.uid()) and status='pending';
  if not found then raise exception using errcode='42501', message='request unavailable'; end if;
end $$;

create or replace function public.remove_friend(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.friendships where status='accepted' and
    ((requester_id=(select auth.uid()) and addressee_id=target_user_id) or
     (addressee_id=(select auth.uid()) and requester_id=target_user_id));
  if not found then raise exception using errcode='P0002', message='friendship not found'; end if;
end $$;

create or replace function public.block_player(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := (select auth.uid()); existing public.friendships%rowtype;
begin
  if caller is null then raise exception using errcode='42501', message='authentication required'; end if;
  if target_user_id is null or target_user_id=caller then raise exception using errcode='22023', message='cannot block self'; end if;
  select * into existing from public.friendships where
    least(requester_id,addressee_id)=least(caller,target_user_id) and
    greatest(requester_id,addressee_id)=greatest(caller,target_user_id) for update;
  if found and existing.status='blocked' and existing.requester_id<>caller then
    -- Do not reveal or replace another player's block.
    raise exception using errcode='42501', message='relationship unavailable';
  end if;
  delete from public.friendships where
    least(requester_id,addressee_id)=least(caller,target_user_id) and
    greatest(requester_id,addressee_id)=greatest(caller,target_user_id);
  insert into public.friendships(requester_id,addressee_id,status) values(caller,target_user_id,'blocked');
end $$;

create or replace function public.unblock_player(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.friendships where requester_id=(select auth.uid()) and addressee_id=target_user_id and status='blocked';
  if not found then raise exception using errcode='P0002', message='blocked player not found'; end if;
end $$;

create or replace function public.get_relationship(target_user_id uuid)
returns table(request_id uuid, relationship_status text)
language sql stable security definer set search_path = '' as $$
  select f.id, case
    when f.status='accepted' then 'friends'
    when f.status='pending' and f.requester_id=(select auth.uid()) then 'outgoing_pending'
    when f.status='pending' then 'incoming_pending'
    when f.status='blocked' and f.requester_id=(select auth.uid()) then 'blocked_by_me'
    else 'restricted' end
  from public.friendships f where (f.requester_id=(select auth.uid()) and f.addressee_id=target_user_id)
    or (f.addressee_id=(select auth.uid()) and f.requester_id=target_user_id)
  union all select null::uuid,'none' where not exists(select 1 from public.friendships f where
    (f.requester_id=(select auth.uid()) and f.addressee_id=target_user_id) or
    (f.addressee_id=(select auth.uid()) and f.requester_id=target_user_id)) limit 1
$$;

create or replace function public.search_players(search_query text)
returns table(id uuid,username text,display_name text,avatar_url text,level integer,relationship_status text,request_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.id,p.username,p.display_name,p.avatar_url,
    case when v.show_level and (v.profile_visibility='public' or f.status='accepted') then g.level end,
    case when f.status='accepted' then 'friends' when f.status='pending' and f.requester_id=(select auth.uid()) then 'outgoing_pending'
      when f.status='pending' then 'incoming_pending' else 'none' end,f.id
  from public.profiles p join public.profile_privacy v on v.user_id=p.id
  left join public.player_progress g on g.user_id=p.id
  left join public.friendships f on (f.requester_id=(select auth.uid()) and f.addressee_id=p.id) or (f.addressee_id=(select auth.uid()) and f.requester_id=p.id)
  where (select auth.uid()) is not null and char_length(trim(search_query))>=3 and p.id<>(select auth.uid())
    and (p.username ilike '%'||trim(search_query)||'%' or p.display_name ilike '%'||trim(search_query)||'%')
    and coalesce(f.status<>'blocked',true)
  order by case when lower(p.username)=lower(trim(leading '@' from search_query)) then 0 else 1 end,p.username limit 20
$$;

create or replace function public.get_my_social_list()
returns table(request_id uuid,user_id uuid,username text,display_name text,avatar_url text,level integer,preferred_activities text[],relationship_status text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select f.id,p.id,p.username,p.display_name,p.avatar_url,
    case when v.show_level then g.level end,
    case when v.profile_visibility<>'private' then p.preferred_activities end,
    case when f.status='accepted' then 'friends' when f.requester_id=(select auth.uid()) then 'outgoing_pending' else 'incoming_pending' end,
    f.created_at
  from public.friendships f
  join public.profiles p on p.id=case when f.requester_id=(select auth.uid()) then f.addressee_id else f.requester_id end
  join public.profile_privacy v on v.user_id=p.id left join public.player_progress g on g.user_id=p.id
  where (f.requester_id=(select auth.uid()) or f.addressee_id=(select auth.uid())) and f.status in('pending','accepted')
  order by f.created_at desc
$$;

create or replace function public.get_my_social_counts()
returns table(friends_count bigint,pending_request_count bigint)
language sql stable security definer set search_path = '' as $$
  select count(*) filter(where status='accepted'),count(*) filter(where status='pending' and addressee_id=(select auth.uid()))
  from public.friendships where requester_id=(select auth.uid()) or addressee_id=(select auth.uid())
$$;

create or replace function public.get_blocked_players()
returns table(user_id uuid,username text,display_name text,avatar_url text)
language sql stable security definer set search_path = '' as $$
  select p.id,p.username,p.display_name,p.avatar_url from public.friendships f join public.profiles p on p.id=f.addressee_id
  where f.requester_id=(select auth.uid()) and f.status='blocked' order by f.updated_at desc
$$;

-- Replace the identity RPC so minimum identity always remains discoverable, private
-- fields require the correct visibility tier, block direction is not disclosed, and
-- only safe aggregates (never activity rows or route geometry) leave the database.
drop function if exists public.get_player_profile(uuid);
create function public.get_player_profile(target_user_id uuid)
returns table(id uuid,username text,display_name text,avatar_url text,bio text,preferred_activities text[],city text,region text,level integer,xp bigint,total_distance double precision,total_activities bigint,territories_count bigint,total_influence bigint,relationship_status text,request_id uuid,friends_count bigint)
language sql stable security definer set search_path = '' as $$
with rel as(select * from public.friendships where (requester_id=(select auth.uid()) and addressee_id=target_user_id) or(addressee_id=(select auth.uid()) and requester_id=target_user_id) limit 1),
access as(select (select auth.uid())=target_user_id self,coalesce((select status='accepted' from rel),false) friend,coalesce((select status='blocked' from rel),false) blocked),
stats as(select count(*) n,coalesce(sum(distance_meters),0)::double precision d from public.activities where user_id=target_user_id),
inf as(select count(*) filter(where influence_points>0) c,coalesce(sum(influence_points),0) i from public.territory_influence where user_id=target_user_id),
fc as(select count(*) n from public.friendships where status='accepted' and (requester_id=target_user_id or addressee_id=target_user_id))
select p.id,p.username,p.display_name,p.avatar_url,
 case when a.self or(not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then p.bio end,
 case when a.self or(not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then p.preferred_activities end,
 case when a.self or(not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then p.city end,
 case when a.self or(not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then p.region end,
 case when a.self or(v.show_level and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then pg.level end,
 case when a.self or(v.show_stats and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then pg.xp end,
 case when a.self or(v.show_stats and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then s.d end,
 case when a.self or(v.show_stats and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then s.n end,
 case when a.self or(v.show_territories and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then i.c end,
 case when a.self or(v.show_territories and not a.blocked and(v.profile_visibility='public' or(v.profile_visibility='friends' and a.friend))) then i.i end,
 case when a.self then 'self' when exists(select 1 from rel where status='blocked' and requester_id=(select auth.uid())) then 'blocked_by_me'
   when exists(select 1 from rel where status='blocked') then 'restricted' when exists(select 1 from rel where status='accepted') then 'friends'
   when exists(select 1 from rel where status='pending' and requester_id=(select auth.uid())) then 'outgoing_pending'
   when exists(select 1 from rel where status='pending') then 'incoming_pending' else 'none' end,
 (select id from rel),fc.n
from public.profiles p join public.profile_privacy v on v.user_id=p.id left join public.player_progress pg on pg.user_id=p.id
cross join access a cross join stats s cross join inf i cross join fc where p.id=target_user_id and (select auth.uid()) is not null
$$;

revoke all on function public.send_friend_request(uuid),public.accept_friend_request(uuid),public.decline_friend_request(uuid),public.cancel_friend_request(uuid),public.remove_friend(uuid),public.block_player(uuid),public.unblock_player(uuid),public.get_relationship(uuid),public.search_players(text),public.get_my_social_list(),public.get_my_social_counts(),public.get_blocked_players(),public.get_player_profile(uuid) from public,anon;
grant execute on function public.send_friend_request(uuid),public.accept_friend_request(uuid),public.decline_friend_request(uuid),public.cancel_friend_request(uuid),public.remove_friend(uuid),public.block_player(uuid),public.unblock_player(uuid),public.get_relationship(uuid),public.search_players(text),public.get_my_social_list(),public.get_my_social_counts(),public.get_blocked_players(),public.get_player_profile(uuid) to authenticated;
