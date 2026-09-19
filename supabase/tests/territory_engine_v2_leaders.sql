-- Run after migrations in a disposable/local database. This isolates the exact
-- one-row-per-territory algorithm used by both V2 RPCs.
begin;
create temporary table v2_test_influence(territory_id text,user_id uuid,influence_points bigint);
create temporary view v2_test_leader_summary as
with territory_scores as(
 select territory_id,sum(influence_points)::bigint total_influence,max(influence_points)::bigint top_influence
 from v2_test_influence where influence_points>0 group by territory_id
)
select ts.territory_id,ts.total_influence,ts.top_influence,count(*)::bigint leader_count,
 case when count(*)=1 then (array_agg(ti.user_id order by ti.user_id))[1] end owner_user_id
from territory_scores ts join v2_test_influence ti
 on ti.territory_id=ts.territory_id and ti.influence_points=ts.top_influence
group by ts.territory_id,ts.total_influence,ts.top_influence;

insert into v2_test_influence values
 ('territory-x','00000000-0000-0000-0000-00000000000a',100),
 ('territory-x','00000000-0000-0000-0000-00000000000b',100),
 ('territory-x','00000000-0000-0000-0000-00000000000c',20);
do $$declare r record; aggregated record;begin
 select * into strict r from v2_test_leader_summary where territory_id='territory-x';
 if r.total_influence<>220 or r.top_influence<>100 or r.leader_count<>2 or r.owner_user_id is not null then
  raise exception 'tied leader regression: %',row_to_json(r);
 end if;
 -- A join from this summary contributes exactly one atomic row/cell/geometry.
 if (select count(*) from v2_test_leader_summary where territory_id='territory-x')<>1 then
  raise exception 'tied territory was duplicated';
 end if;
 select count(*) cell_count,sum(ls.total_influence) total_influence,sum(me.influence_points) my_influence
 into strict aggregated from v2_test_leader_summary ls
 join v2_test_influence me on me.territory_id=ls.territory_id
  and me.user_id='00000000-0000-0000-0000-00000000000a'::uuid;
 if aggregated.cell_count<>1 or aggregated.total_influence<>220 or aggregated.my_influence<>100 then
  raise exception 'tied atomic contribution was duplicated: %',row_to_json(aggregated);
 end if;
end$$;

truncate v2_test_influence;
insert into v2_test_influence values
 ('territory-x','00000000-0000-0000-0000-00000000000a',101),
 ('territory-x','00000000-0000-0000-0000-00000000000b',100);
do $$declare r record;begin
 select * into strict r from v2_test_leader_summary where territory_id='territory-x';
 if r.total_influence<>201 or r.top_influence<>101 or r.leader_count<>1
    or r.owner_user_id<>'00000000-0000-0000-0000-00000000000a'::uuid then
  raise exception 'sole leader regression: %',row_to_json(r);
 end if;
end$$;
rollback;
