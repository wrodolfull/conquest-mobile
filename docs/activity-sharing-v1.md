# Activity sharing V1

Activity sharing is private by default. `createActivityShareModel` projects a completed local activity into a deliberately route-free value: it never receives a route option, its `includeRoute` marker is always `false`, and it includes no account or backend identifiers. A future route-sharing option must be explicit, opt-in, and modeled separately.

The native image flow is:

1. `ShareActivityCard` renders the reusable, route-free React Native view.
2. `react-native-view-shot` captures that view to a temporary PNG on the device. The image is not uploaded.
3. `expo-sharing` presents the Android or iOS native share sheet for that temporary file.

These are the two new native dependencies. `react-native-view-shot` is necessary to render a React Native view as an image; `expo-sharing` is necessary to reliably hand the local image file to the platform share sheet. They are not being added for text sharing. Because they contain native modules, an existing RUQEST development client must be rebuilt before this feature can run; no additional app config plugin is required.
