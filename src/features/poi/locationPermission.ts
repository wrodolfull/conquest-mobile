export type LocationPermissionAction='none'|'request'|'settings';
export function locationPermissionAction(checked:boolean,granted:boolean,canAskAgain:boolean):LocationPermissionAction{if(!checked||granted)return'none';return canAskAgain?'request':'settings'}
