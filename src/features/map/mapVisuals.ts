import type { MapTerritory, TerritoryOwner } from '@/features/territories/types';

const ownerColors: Record<TerritoryOwner, string> = {
  Rodolfo: '#BDFB46', Lucas: '#4D8CFF', Mariana: '#A977FF', Bruno: '#FF625B', Neutral: '#A2ADA9',
};

export function territoryVisual(territory: MapTerritory) {
  const color = ownerColors[territory.owner];
  return {
    fillColor: `${color}${territory.status === 'neutral' ? '1F' : '42'}`,
    strokeColor: territory.status === 'contested' ? '#FFF4C7' : `${color}D9`,
    strokeWidth: territory.status === 'contested' ? 3 : 1.4,
  };
}
