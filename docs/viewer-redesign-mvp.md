# Viewer Redesign MVP

Date: 2026-06-04

## Preserved Product Model

- The cybersecurity domain model stays in `data/store.json`.
- Domain lanes, product instances, product types, and public edges are not rewritten by the MVP.
- The viewer still renders one active domain page at a time and keeps the existing module -> practicum -> product course structure.

## UI Direction

- Treat the public viewer as a domain atlas, not as an editor canvas.
- Keep the interface calm, dense, and readable for cybersecurity portfolio navigation.
- Use a neutral operational surface with a small set of semantic accents:
  - blue for modules,
  - amber for practicums and management courses,
  - green for product exploitation courses,
  - cyan for navigation focus and active states.

## MVP Changes

- Added global map metrics in the header: domains, visible elements, and public links.
- Removed search from the public viewer to keep the domain atlas focused on navigation and filtering.
- Added a compact domain rail with per-domain content counts in the sidebar.
- Added a persistent context inspector for the hovered or selected node.
- Kept export actions and domain paging in place.
- Added drag-to-pan on the active map and Ctrl/Meta + wheel zoom while regular wheel movement still switches domains.
- Added a dedicated viewer CSS layer in `app/styles/viewer.css` so the public viewing experience can evolve without destabilizing the editor.

## BEM And Motion Layer

- The public viewer now uses `viewer` as the primary BEM block.
- New elements include `viewer__topbar`, `viewer__workspace`, `viewer__sidebar`, `viewer__board`, `viewer__domain-stage`, `viewer__canvas`, `viewer__inspector`, and related BEM modifiers.
- Legacy classes such as `viewer-domain-workspace`, `viewer-domain-item`, `viewer-controls--board`, and `canvas-card--viewer` remain in markup as compatibility selectors for existing tests and editor-adjacent styles.
- Domain switching is controlled through `viewer__domain-stage--next`, `viewer__domain-stage--prev`, and `viewer__domain-stage--jump`.
- Wheel and pager buttons update the active domain immediately while CSS handles the cinematic entrance using `transform` and `opacity`.
- Dragging the canvas pans the map; Ctrl/Meta + wheel zooms the React Flow viewport.
- Motion uses `prefers-reduced-motion` to disable animated transitions for users who request reduced motion.

## UX Improvements To Continue

- Add a compact route list mode for users who need table-like comparison.
- Add saved views for role-based audiences such as IB, IB/IT, Dev, and Management.
- Add a selected-route highlight that dims unrelated nodes and edges.
- Add mobile-specific map controls if the public viewer is expected to be used heavily on phones.
