import { colors } from '@/theme';
import type { LootRarity } from './lootRules';
export const rarityVisuals: Record<LootRarity,{label:string;color:string;glow:string}> = {
 common:{label:'COMMON',color:'#B8C2BF',glow:'rgba(184,194,191,0.14)'},
 uncommon:{label:'UNCOMMON',color:'#68D391',glow:'rgba(104,211,145,0.14)'},
 rare:{label:'RARE',color:colors.cyan,glow:'rgba(55,216,209,0.15)'},
 epic:{label:'EPIC',color:colors.violet,glow:'rgba(169,119,255,0.16)'},
 legendary:{label:'LEGENDARY',color:colors.gold,glow:'rgba(248,193,76,0.17)'},
};
