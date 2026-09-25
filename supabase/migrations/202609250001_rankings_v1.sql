-- RANKING V1. Route-free, server-authoritative weekly projection and leaderboards.
create table public.weekly_ranking_stats(
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start timestamptz not null,
 outdoor_distance_meters double precision not null default 0 check(outdoor_distance_meters>=0),
 weekly_influence bigint not null default 0 check(weekly_influence>=0),
 new_zones bigint not null default 0 check(new_zones>=0),
 updated_at timestamptz not null default now(),
 primary key(user_id,week_start),
 check(week_start=date_trunc('week',week_start))
);
alter table public.weekly_ranking_stats enable row level security;
revoke all on public.weekly_ranking_stats from public,anon,authenticated;

-- Historical aggregate backfill. Each source is grouped independently before it is
-- combined, preventing the join multiplication that would double-count metrics.
insert into public.weekly_ranking_stats(user_id,week_start,outdoor_distance_meters,weekly_influence,new_zones)
select user_id,week_start,sum(distance)::double precision,sum(influence)::bigint,sum(zones)::bigint
from(
 select user_id,date_trunc('week',started_at) week_start,sum(distance_meters) distance,0::bigint influence,0::bigint zones
 from public.activities where activity_type in('walking','running','cycling') group by user_id,date_trunc('week',started_at)
 union all
 select user_id,date_trunc('week',created_at),0::double precision,sum(influence_delta)::bigint,0::bigint
 from public.influence_ledger group by user_id,date_trunc('week',created_at)
 union all
 select user_id,date_trunc('week',discovered_at),0::double precision,0::bigint,count(*)::bigint
 from public.zone_discoveries group by user_id,date_trunc('week',discovered_at)
) source group by user_id,week_start;

create index weekly_ranking_stats_order_idx on public.weekly_ranking_stats(week_start,outdoor_distance_meters desc,weekly_influence desc,new_zones desc,user_id);
create index profiles_city_region_normalized_idx on public.profiles(lower(btrim(city)),lower(btrim(region))) where city is not null and region is not null;

create function public.project_weekly_ranking_activity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.activity_type in('walking','running','cycling') then
  insert into public.weekly_ranking_stats(user_id,week_start,outdoor_distance_meters)
  values(new.user_id,date_trunc('week',new.started_at),new.distance_meters)
  on conflict(user_id,week_start) do update set outdoor_distance_meters=public.weekly_ranking_stats.outdoor_distance_meters+excluded.outdoor_distance_meters,updated_at=now();
 end if;
 return new;
end$$;
create trigger activity_projects_weekly_ranking after insert on public.activities for each row execute function public.project_weekly_ranking_activity();

create function public.project_weekly_ranking_influence() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.weekly_ranking_stats(user_id,week_start,weekly_influence)
 values(new.user_id,date_trunc('week',new.created_at),new.influence_delta)
 on conflict(user_id,week_start) do update set weekly_influence=public.weekly_ranking_stats.weekly_influence+excluded.weekly_influence,updated_at=now();
 return new;
end$$;
create trigger influence_projects_weekly_ranking after insert on public.influence_ledger for each row execute function public.project_weekly_ranking_influence();

create function public.project_weekly_ranking_discovery() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.weekly_ranking_stats(user_id,week_start,new_zones)
 values(new.user_id,date_trunc('week',new.discovered_at),1)
 on conflict(user_id,week_start) do update set new_zones=public.weekly_ranking_stats.new_zones+1,updated_at=now();
 return new;
end$$;
create trigger discovery_projects_weekly_ranking after insert on public.zone_discoveries for each row execute function public.project_weekly_ranking_discovery();

create function public.get_weekly_leaderboard(p_scope text,p_limit integer default 20,p_after_rank bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 me uuid:=(select auth.uid()); ws timestamptz:=date_trunc('week',now()); page_size integer:=least(greatest(coalesce(p_limit,20),1),50);
 my_city text; my_region text; city_available boolean; result jsonb;
begin
 if me is null then raise exception 'authentication required'; end if;
 if p_scope not in('friends','city','global') then raise exception 'invalid ranking scope'; end if;
 select lower(btrim(city)),lower(btrim(region)) into my_city,my_region from public.profiles where id=me;
 city_available:=coalesce(my_city<>'',false) and coalesce(my_region<>'',false);

 with eligible as(
  select s.user_id,s.outdoor_distance_meters,s.weekly_influence,s.new_zones
  from public.weekly_ranking_stats s
  join public.profiles p on p.id=s.user_id
  join public.profile_privacy v on v.user_id=s.user_id
  where s.week_start=ws and (s.outdoor_distance_meters>0 or s.weekly_influence>0 or s.new_zones>0)
   and not public.social_pair_blocked(me,s.user_id)
   and case p_scope
    when 'global' then v.profile_visibility='public' and v.activity_visibility='public' and v.show_stats
    when 'city' then city_available and lower(btrim(p.city))=my_city and lower(btrim(p.region))=my_region and v.profile_visibility='public' and v.activity_visibility='public' and v.show_stats
    else s.user_id=me or (v.profile_visibility<>'private' and v.activity_visibility<>'private' and v.show_stats and exists(select 1 from public.friendships f where f.status='accepted' and ((f.requester_id=me and f.addressee_id=s.user_id)or(f.addressee_id=me and f.requester_id=s.user_id))))
   end
 ), ranked as(
  select e.*,row_number() over(order by outdoor_distance_meters desc,weekly_influence desc,new_zones desc,user_id asc)::bigint rank from eligible e
 ), page as(
  select * from ranked where rank>coalesce(p_after_rank,0) order by rank limit page_size+1
 ), visible_page as(select * from page order by rank limit page_size), my_stats as(
  select coalesce(s.outdoor_distance_meters,0) distance,coalesce(s.weekly_influence,0) influence,coalesce(s.new_zones,0) zones
  from (select 1) seed left join public.weekly_ranking_stats s on s.user_id=me and s.week_start=ws
 ), mine as(select m.*,r.rank,(r.user_id is not null) listed from my_stats m left join ranked r on r.user_id=me)
 select jsonb_build_object(
  'scope',p_scope,'scopeLabel',initcap(p_scope),'weekStart',ws,'weekEnd',ws+interval '7 days','cityAvailable',case when p_scope='city' then city_available else true end,
  'entries',coalesce((select jsonb_agg(jsonb_build_object('rank',x.rank,'userId',x.user_id,'username',p.username,'displayName',p.display_name,'avatarUrl',p.avatar_url,'distanceMeters',x.outdoor_distance_meters,'weeklyInfluence',x.weekly_influence,'newZones',x.new_zones,'isMe',x.user_id=me) order by x.rank) from visible_page x join public.profiles p on p.id=x.user_id),'[]'::jsonb),
  'nextCursor',case when (select count(*) from page)>page_size then (select max(rank) from visible_page) else null end,
  'myEntry',(select jsonb_build_object('rank',rank,'listed',listed,'userId',me,'username',p.username,'displayName',p.display_name,'avatarUrl',p.avatar_url,'distanceMeters',distance,'weeklyInfluence',influence,'newZones',zones,'isMe',true) from mine join public.profiles p on p.id=me)
 ) into result;
 return result;
end$$;

revoke all on function public.project_weekly_ranking_activity(),public.project_weekly_ranking_influence(),public.project_weekly_ranking_discovery() from public,anon,authenticated;
revoke all on function public.get_weekly_leaderboard(text,integer,bigint) from public,anon;
grant execute on function public.get_weekly_leaderboard(text,integer,bigint) to authenticated;
comment on table public.weekly_ranking_stats is 'Derived route-free weekly ranking projection. Authoritative source tables remain the source of truth; clients have no table access.';
comment on function public.get_weekly_leaderboard(text,integer,bigint) is 'A cursor page is a fresh weekly snapshot; ranks may shift between requests as authoritative activity arrives.';
