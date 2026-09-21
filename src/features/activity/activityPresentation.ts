export const ACTIVE_ACTIVITY_ORANGE = '#FF9F43';

type OutdoorActivityType = 'walking' | 'running' | 'cycling';
type HomeActivityIcon = 'play' | 'warning' | 'walk-outline' | 'speedometer-outline' | 'bicycle-outline';
interface HomeActivitySession { id: string; type: OutdoorActivityType; status: 'active' | 'interrupted' }

const outdoorIcons: Record<OutdoorActivityType, HomeActivityIcon> = {
  walking: 'walk-outline',
  running: 'speedometer-outline',
  cycling: 'bicycle-outline',
};

export interface HomeActivityCtaPresentation {
  title: string;
  icon: HomeActivityIcon;
  iconColor: string;
  borderColor: string;
  accessibilityLabel: string;
}

export function homeActivityCtaPresentation(
  session?: Pick<HomeActivitySession, 'type' | 'status'>,
): HomeActivityCtaPresentation {
  if (!session) {
    return {
      title: 'Start activity',
      icon: 'play',
      iconColor: '#C8FF4A',
      borderColor: '#668737',
      accessibilityLabel: 'Start activity',
    };
  }

  const interrupted = session.status === 'interrupted';
  return {
    title: 'Activity in progress',
    icon: interrupted ? 'warning' : outdoorIcons[session.type],
    iconColor: ACTIVE_ACTIVITY_ORANGE,
    borderColor: '#A9612E',
    accessibilityLabel: `${interrupted ? 'Interrupted' : 'Active'} ${session.type} activity in progress. Tap to return.`,
  };
}

export function activeActivityDestination(session: Pick<HomeActivitySession, 'id' | 'type'>) {
  return { pathname: '/activity/active' as const, params: { type: session.type, sessionId: session.id } };
}
