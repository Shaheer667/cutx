# CUTX review notes

Main blocking issue found in the uploaded project: `src/hooks/useEditor.ts` was truncated and started in the middle of the keyboard handler, so the file could not parse at all. It has been restored with the complete editor hook.

Also kept/verified the modular editor structure and the preview/playhead wiring:
- V1 `onTimeUpdate` updates timeline `currentTime`, so the playhead can move during playback.
- V1/V2 `onLoadedMetadata` handlers seek to the correct source time when media switches.
- V2 is cleared from preview when there is no V2 clip at the current timeline time.
- Clicking a timeline gap clears V1 preview instead of leaving a stale frame.
- Existing drag, trim, snapping, split, delete, ripple, zoom, resize, undo/redo logic remains in the hook.

The archive intentionally does not contain `node_modules` or `.next`. Run `npm install` (or `npm ci`) and then `npm run dev` in your local project.
