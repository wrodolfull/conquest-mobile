import type { MapTerritory } from '@/features/territories/types';
const RIVAL_PALETTE=['#40D9FF','#A977FF','#FF9B4A','#FF625B','#4D8CFF'] as const;
export function rivalColor(ownerUserId:string):string{let hash=2166136261;for(let i=0;i<ownerUserId.length;i+=1){hash^=ownerUserId.charCodeAt(i);hash=Math.imul(hash,16777619);}return RIVAL_PALETTE[(hash>>>0)%RIVAL_PALETTE.length]!;}
export function territoryVisual(t:MapTerritory){const color=t.status==='neutral'?'#A2ADA9':t.status==='player'?'#BDFB46':rivalColor(t.ownerUserId!);return{fillColor:`${color}${t.status==='neutral'?'1F':'42'}`,strokeColor:t.status==='contested'?'#FFF4C7':`${color}D9`,strokeWidth:t.status==='contested'?3:1.4};}
