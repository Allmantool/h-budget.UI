# Accounting desktop workspace refinement

## Status

Verified — follow-up regression repair (2026-09-15)

## Problem

The Accounting route is already hosted in a flexible shell, but it places the
route content inside multiple nested, padded surfaces before each routed page
adds another hero or card. The resulting visual frame makes a wide data
workspace appear artificially narrow and wastes vertical space.

## Scope

- Keep the application shell as a navigation rail plus a flexible main track.
- Remove duplicate Accounting page chrome and use one `Accounts and payments`
  page heading.
- Make the account landing page a compact, keyboard-operable account list with
  adjacent Open and Edit actions.
- Compact the active-account header, totals status, history actions and filter
  layout while preserving existing query and editor behavior.
- Keep the existing in-flow editor: use a 26--34rem detail rail from 1700px,
  where the remaining transaction workspace can still accommodate the table;
  retain the full-width stacked layout below it.

## Acceptance criteria

- Desktop route content uses the available main-shell track with only modest
  outer gutters and no nested route-content card.
- Account rows expose account identity, currency, balance, Open and Edit
  actions without radio-list selection semantics.
- At wide desktop widths, filters form two balanced rows and the table fills
  the transaction work surface; narrow breakpoints retain the existing table
  and mobile-card transitions.
- Existing navigation, account selection, dialog, query, payment-editor and
  datepicker behavior remains covered by focused tests and full regression
  gates.

## Editor and history refinement

- On viewports at least 1700px wide, an active account opens and retains the
  right-side editor rail in new-payment mode. Save, cancel, and delete return
  that rail to a clean new-payment form; the history does not display a second
  desktop Add payment control while the rail is open.
- The editor host and editor surface must size to their content; neither may
  force a full-height rail.
- While an already-open editor is in create mode, the history must not offer a
  second Add payment action or reset that draft.
- Transaction rows remain keyboard-operable edit affordances, while the
  explicit pencil action stops propagation and opens one edit session.
- A paged history response is the authoritative source for each visible row.
  Its record must populate the existing operation state before the selected id
  is processed, so selecting a row initializes the edit form with its amount,
  category, contractor, date, and comment. Reference-data arrival must not
  erase that selection while its options are still pending.
- The Material table wrapper and its rows fill their inline-size; flexible
  descriptive columns consume remaining room and the action column trails the
  surface.

## Verification status

| Criterion                                              | Evidence                                                                      | Status  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- | ------- |
| Paged row selection uses the row record for edit state | 61 focused Karma specs, including service and form-population regressions     | Pass    |
| Persistent desktop editor workflow                     | 61 focused Karma specs, including rail-opening and cancel-transition tests    | Pass    |
| True browser layout and interaction measurements       | Local non-TLS server at 1920px: row/table edges align at x=1365               | Pass    |

## Follow-up audit (2026-09-15)

### Confirmed

- At a 1920px browser viewport, the active-account route already opens an in-flow
  right rail in create mode. It has no backdrop, focus trap, or fixed overlay.
- Selecting a row in that active rail leaves the editor in `New payment` mode.
  `PaymentsHistoryComponent.selectRow` treats an `await router.navigate(...)`
  result of `false` as a failed open. Angular returns `false` for navigation to
  the current `right_sidebar:operations` outlet, so it exits before dispatching
  `SetActiveAccountingOperation`.
- The rendered history is a native Material table. At 1920px its wrapper is
  1078px and its table host is 1076px, but its header/data row is only 1009px;
  the Actions cell ends at x=1297 while the table's trailing edge is x=1365.
  Existing `mat-row`/`mat-header-row` flex selectors do not match the rendered
  `tr` elements, and flex column declarations therefore have no effect.
- The editor derives payment direction from category reference data. It observes
  selected-operation and operation-store changes, but not category/contractor
  arrival, which can leave an edit form initialized before its required options
  are available.

### Follow-up requirements

- **REQ-001:** A selection commits in an already-open editor without redundant
  auxiliary-route navigation, switches immediately to edit/loading state, and
  keeps dirty-form protection before replacement.
- **REQ-002:** Edit initialization waits for the selected operation's required
  category and non-empty contractor references, then populates stable ID form
  controls. A selection from another account must not populate the current form.
- **REQ-003:** The native table's header and data rows consume the table width;
  bounded numeric/action columns and flexible descriptive columns use one
  table-layout strategy.

### Follow-up test strategy

1. Add deterministic component regressions for selecting through an already-open
   rail, reference-data-late initialization, loading state, and account mismatch.
2. Add rendered-table style assertions for the native table layout strategy.
3. Verify the interaction and geometry in the local non-TLS development server
   at 1920px; do not bypass the existing invalid TLS certificate.

## Verification notes

- TDD note: the new persistent-rail selection and late-reference-data
  regressions initially failed, then passed with the smallest state and form
  initialization repair. The focused suite contains 61 successful specs.
- Browser verification used the local non-TLS development server at 1920px
  after the default TLS development endpoint rejected the certificate. Row and
  header widths now equal the 1076px table width; their actions edge and the
  table trailing edge both measure x=1365. Expense, income, keyboard, pencil,
  cancel, and clean-new-form flows passed without saving or deleting data.
- Final quality gates: `npm run typecheck`, `npm run format:check`,
  `git diff --check`, `npm run lint`, `npm run test:ci`, and
  `npm run build:prod`. Lint has zero errors and 357 existing warnings; the
  production build retains one existing initial-bundle budget warning
  (2.29 MB, 289.85 kB above the 2.00 MB warning threshold).
