import * as Location from 'expo-location';
// Installed by the development-build profile; Expo Go does not provide this native module.
// eslint-disable-next-line import/no-unresolved
import * as TaskManager from 'expo-task-manager';
import { processPoint, routeDistanceMeters } from '@/features/activity/tracking';
import { fromLocation } from './locationTrackingOptions';
import { activeActivityRepository, activityPointRepository, loadTrackingState } from '@/services/storage/activeActivityRepository';

export const CONQUEST_OUTDOOR_LOCATION_TASK = 'CONQUEST_OUTDOOR_LOCATION_TASK';

interface LocationTaskData { locations: Location.LocationObject[] }

TaskManager.defineTask<LocationTaskData>(CONQUEST_OUTDOOR_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations.length) return;
  const session = await activeActivityRepository.get();
  if (!session || session.status !== 'active') return;
  let state = await loadTrackingState(session);
  for (const location of data.locations.sort((a, b) => a.timestamp - b.timestamp)) {
    const result = processPoint(state, fromLocation(location)); state = result.state;
    for (const item of result.decisions) {
      if (item.point.timestamp !== location.timestamp) await activityPointRepository.resolve(session.id, item.point, item.decision.accepted, item.decision.reason);
      else await activityPointRepository.append(session.id, [{ point: item.point, accepted: item.decision.accepted, provisional: Boolean(item.decision.provisional), reason: item.decision.reason }]);
    }
  }
  await activeActivityRepository.update({ id: session.id, phase: state.phase, distanceMeters: routeDistanceMeters(state.accepted) });
});
