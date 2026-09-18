# CONQUEST

CONQUEST is a mobile location-based fitness strategy game.

## Core principles

Physical activity must always take priority over phone interaction.

Users should not need to interact with the phone while walking, running or cycling.

Outdoor activities generate:
- distance
- loot
- territorial influence
- battle resources

Indoor activities generate:
- Training Power
- loot
- Arena points
- battle resources

Gyms are Arenas.

Only outdoor movement generates territorial influence.

## Product loops

Outdoor:
Movement -> Distance -> Loot -> Influence -> Battle -> Territory

Indoor:
Workout -> Training Power -> Loot -> Arena -> Battle resources

## Tech

- React Native
- Expo
- TypeScript
- Expo Router

Backend:
- Supabase
- PostgreSQL
- PostGIS
- H3
- Health Connect
- HealthKit

## Development rules

- TypeScript strict mode
- Avoid any
- Reusable components
- Business rules outside UI components
- Mobile-first
- Android and iOS
- Run lint and typecheck before finishing tasks

## Current phase

Real GPS mobile prototype transitioning to a secure persistent backend.

Supabase backend infrastructure is intentionally part of the project. Persistent
game economy changes must be server-authoritative. Keep GPS and business rules
separate from UI components, and never make network availability a requirement
for recording a workout.
