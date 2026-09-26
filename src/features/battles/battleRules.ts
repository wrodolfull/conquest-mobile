export const BATTLE_ENERGY_COST = 20;
export const BATTLE_INFLUENCE_REWARD = 2;
export const BATTLE_COOLDOWN_HOURS = 12;
export const CAPTURE_PROTECTION_HOURS = 6;
export const BATTLE_RECENT_ACTIVITY_DAYS = 7;

export type BattleIneligibleReason = 'OWN_TERRITORY'|'NO_RIVAL_LEADER'|'NO_LOCAL_INFLUENCE'|'INSUFFICIENT_PRESENCE'|'RECENT_ACTIVITY_REQUIRED'|'INSUFFICIENT_ENERGY'|'COOLDOWN'|'PROTECTED';
export type BattleResultKind = 'pressure'|'contested'|'captured';
export interface BattleState { eligible:boolean; reason:BattleIneligibleReason|null; energyCost:number; influenceReward:number; myInfluence:number; leaderInfluence:number; requiredInfluence:number; currentEnergy:number; battleAvailableAt:string|null; protectedUntil:string|null }
export interface BattleResult { battleId:string; result:BattleResultKind; territoryId:string; territoryName:string; energySpent:number; energyRemaining:number; influenceAwarded:number; myInfluenceBefore:number; myInfluenceAfter:number; leaderInfluenceBefore:number; statusAfter:'owned'|'contested'|'rival'; controlChanged:boolean; battleAvailableAt:string; protectedUntil:string|null }
export interface BattleHistoryItem { battleId:string; territoryId:string; territoryName:string; role:'attack'|'defense'; result:BattleResultKind; influenceAwarded:number; controlChanged:boolean; createdAt:string }

export function battleUnavailableCopy(state:BattleState,now=Date.now()):{title:string;detail:string}|null {
 if(state.eligible)return null;
 switch(state.reason){
  case'INSUFFICIENT_PRESENCE':return{title:'BUILD MORE INFLUENCE',detail:`${state.myInfluence} / ${state.requiredInfluence} required`};
  case'RECENT_ACTIVITY_REQUIRED':return{title:'RETURN TO THIS ZONE',detail:'Earn activity influence here again to Battle'};
  case'INSUFFICIENT_ENERGY':return{title:'NEED MORE ENERGY',detail:`${state.energyCost} Energy required`};
  case'COOLDOWN':return{title:'BATTLE COOLDOWN',detail:`Available in ${formatRemaining(state.battleAvailableAt,now)}`};
  case'PROTECTED':return{title:'TERRITORY PROTECTED',detail:`Protection ends in ${formatRemaining(state.protectedUntil,now)}`};
  case'NO_LOCAL_INFLUENCE':return{title:'ESTABLISH PRESENCE',detail:'Earn activity influence here before Battle'};
  default:return{title:'BATTLE UNAVAILABLE',detail:'This territory has no sole rival leader'};
 }
}
export function expectedBattleResult(state:Pick<BattleState,'myInfluence'|'leaderInfluence'|'influenceReward'>):BattleResultKind{return state.myInfluence+state.influenceReward>state.leaderInfluence?'captured':state.myInfluence+state.influenceReward===state.leaderInfluence?'contested':'pressure';}
export function formatRemaining(value:string|null,now=Date.now()):string {const minutes=Math.max(0,Math.ceil(((value?Date.parse(value):now)-now)/60000));return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`;}
