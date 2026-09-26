import * as Location from 'expo-location';
// Installed by the development-build profile; Expo Go does not provide this native module.
import * as TaskManager from 'expo-task-manager';
import { ingestNativeLocations } from './locationIngestion';

export const CONQUEST_OUTDOOR_LOCATION_TASK = 'CONQUEST_OUTDOOR_LOCATION_TASK';

interface LocationTaskData { locations: Location.LocationObject[] }

TaskManager.defineTask<LocationTaskData>(CONQUEST_OUTDOOR_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations.length) return;
  await ingestNativeLocations(data.locations);
});
