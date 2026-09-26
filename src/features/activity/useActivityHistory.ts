import { useCallback,useEffect,useRef,useState } from 'react';
import { activityRepository } from '@/services/storage/activityRepository';
import { activitySyncService } from '@/services/backend/activitySyncService';
import { serverActivityRepository } from '@/services/backend/serverActivityRepository';
import { mergeActivityHistory,type ActivityHistoryCursor,type ActivityHistoryItem } from './activityHistory';
export function useActivityHistory(userId?:string){const[items,setItems]=useState<ActivityHistoryItem[]>([]);const[server,setServer]=useState<ActivityHistoryItem[]>([]);const[cursor,setCursor]=useState<ActivityHistoryCursor|null>(null);const[loading,setLoading]=useState(true);const[loadingMore,setLoadingMore]=useState(false);const[serverFailed,setServerFailed]=useState(false);const busy=useRef(false);const serverRef=useRef<ActivityHistoryItem[]>([]);
 const combine=useCallback(async(next=serverRef.current)=>{if(!userId)return;setItems(mergeActivityHistory(next,await activityRepository.list(userId)))},[userId]);
 const refresh=useCallback(async(sync=true)=>{if(!userId||busy.current)return;busy.current=true;setLoading(true);try{if(sync)await activitySyncService.syncPending(userId,true);const page=await serverActivityRepository.listPage();serverRef.current=page.items;setServer(page.items);setCursor(page.nextCursor);setServerFailed(false);await combine(page.items)}catch{serverRef.current=[];setServerFailed(true);await combine([])}finally{busy.current=false;setLoading(false)}},[combine,userId]);
 const loadMore=useCallback(async()=>{if(!cursor||busy.current)return;busy.current=true;setLoadingMore(true);try{const page=await serverActivityRepository.listPage(cursor);const next=mergeActivityHistory([...server,...page.items],[]);serverRef.current=next;setServer(next);setCursor(page.nextCursor);setServerFailed(false);await combine(next)}catch{setServerFailed(true)}finally{busy.current=false;setLoadingMore(false)}},[combine,cursor,server]);
 useEffect(()=>activityRepository.subscribe(()=>void combine()),[combine]);
 return{items,loading,loadingMore,serverFailed,hasMore:cursor!==null,refresh,loadMore};}
