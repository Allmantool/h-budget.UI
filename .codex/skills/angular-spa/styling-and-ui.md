# Styling, UI, and Template Standards

This file is the authoritative standard for application-owned HTML, CSS, and SCSS in this workspace. It complements, but does not repeat, [components and templates](components-and-templates.md) for component responsibility and [security, accessibility, and performance](security-accessibility-performance.md) for the WCAG 2.2 AA baseline.

## Scope and workflow

Apply this standard whenever a change creates or materially changes a template, stylesheet, inline style binding, Angular Material presentation, or other user-facing UI. Before implementation, inspect the component boundary, nearby templates/styles, existing shared UI primitives, global styles/theme configuration, and reusable tokens. Design the BEM block and its meaningful states before writing selectors.

During implementation, prefer semantic HTML, component-owned styles, low-specificity selectors, stable layouts, and established Material APIs. After implementation, review every changed `.html`, `.css`, and `.scss` file with the checklist below, correct violations, then run proportionate validation. Do not create a competing convention or a utility framework.

## BEM naming is mandatory by default

Application-owned classes generated for new UI must use BEM:

```scss
.account-card {
}
.account-card__header {
}
.account-card--selected {
}
.account-card__field--invalid {
}
```

A **block** is a meaningful, independently understandable UI concept. Name it for its domain or responsibility, such as `.payment-account`, `.currency-rates-grid`, or `.account-card`; do not use vague blocks such as `.container`, `.wrapper`, `.content`, `.left`, `.red`, or `.big` unless they are an intentionally documented reusable primitive.

An **element** is a part owned by the block and uses one `__` separator. Name responsibility rather than incidental markup: `.account-card__title`, not `.account-card__header__title`. BEM describes ownership, not the complete DOM path.

A **modifier** is a meaningful visual or presentation variant and uses `--`: `.account-card--compact` or `.account-card__field--invalid`. Use a native state when it already expresses the behavior (`button:disabled`, `:focus-visible`, `input:invalid`). Angular presentation state may use a BEM modifier, for example `[class.account-card--editing]="isEditing()"`; never introduce unowned generic states such as `.active`, `.open`, `.selected`, or `.error`.

```html
<article class="account-card account-card--selected">
	<header class="account-card__header">
		<h3 class="account-card__title">{{ account.name }}</h3>
	</header>
	<div class="account-card__balance">...</div>
	<footer class="account-card__actions">...</footer>
</article>
```

```scss
.account-card {
	display: grid;
	gap: var(--spacing-md);

	&__header {
		display: flex;
		justify-content: space-between;
	}

	&__actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	&--selected {
		outline: 2px solid var(--selection-outline);
	}
}
```

Do not apply BEM to Angular Material, third-party, framework-generated, or documented utility-system classes. Do use BEM for the application wrapper around such controls. A host selector may establish a component's display without adding a duplicate block wrapper:

```scss
:host {
	display: block;
}
```

### Incremental adoption

New application-owned classes follow BEM. When substantially modifying a component, move the touched styling toward this standard only when low risk and within scope. A small fix must not rename an entire legacy class hierarchy; a broad legacy migration requires a dedicated task with regression validation.

## HTML and ownership

Prefer the native semantic element that represents the content or action: landmarks, headings, `form`/`fieldset`/`label`, `button`, `a`, table elements, and lists before generic `div` wrappers. Use a native button for an action and an anchor for navigation; do not make non-interactive elements clickable. Every wrapper needs a semantic, layout, accessibility, Angular Material, or BEM-ownership reason.

Keep feature presentation in its component stylesheet. Global styles are only for genuinely global baseline/layout, typography, theme tokens, documented utilities, Material theme configuration, and technically required overlays. Parents must not reach into a child's internal presentation; expose an input, presentation variant, supported custom property, or documented theming contract instead.

Before creating a common UI treatment, look for established local primitives (buttons, form fields, dialogs, loaders, error/empty states, navigation, tables, and typography). Reuse one that fits; do not force an unsuitable abstraction.

## Selector and stylesheet architecture

Prefer a single BEM class selector. Avoid selectors that couple styling to tag names, DOM depth, sibling order, or positional pseudo-classes when a class or native semantic state expresses ownership. Do not use ID selectors for styling or increase specificity as the first conflict-resolution tool.

SCSS nesting is normally at most two levels and must not mirror DOM nesting. BEM `&__element` and `&--modifier` syntax is encouraged because it compiles to flat class selectors; nested descendants remain exceptional. Do not use Sass just to hide ordinary CSS, and review a disproportionately complex stylesheet even when it remains below the existing 250-line design signal.

Resolve a styling problem in this order: understand ownership and semantics; reuse an existing primitive/token; fix the local layout and BEM-owned style; use a supported component/theming API; add the smallest scoped override; then use justified specificity or, only as a last resort, documented `!important`. Comments explain non-obvious **why** (browser workarounds, third-party overrides, intentional stability constraints), never merely restate a selector.

`!important` is prohibited by default. Use it only for a narrowly scoped external override after analyzing selector ownership, when no reasonable alternative exists, and document the reason beside the rule. Never use it as a first response.

Do not add `::ng-deep` by default. Resolve presentation through semantic/local layout, public component inputs, supported CSS custom properties, or Angular Material theming APIs first. If a scoped global override is necessary, make it deliberate and documented. `::ng-deep` is a documented last resort only when no supported alternative exists.

Use component SCSS/CSS rather than inline `style`, `[style.*]`, or `[ngStyle]` for presentation. A dynamic style binding is acceptable only when the value is genuinely runtime data and cannot be represented as a finite, semantic BEM/native state; keep its ownership local and preserve non-color state communication.

## Tokens, layout, and responsive behavior

Reuse existing semantic tokens and theme values for repeated spacing, typography, color, radius, shadow, breakpoint, z-index, and motion decisions. This repository currently has a small global baseline and a prebuilt Material theme rather than a documented global token system; do not create a parallel token framework incidentally. Reuse a local component token in its scope and propose shared token architecture only when a separate, justified task authorizes it. Do not turn every one-off value into a token.

Use Flexbox for one-dimensional layout, Grid for two-dimensional layout, `gap` for child spacing, logical properties where they improve robustness, and intrinsic sizing (`minmax`, `clamp`, min/max sizes) where they express the design. Avoid absolute positioning, negative margins, transforms, fixed coordinates, and viewport-sized reusable components for normal layout. Use existing breakpoints when present; otherwise add a breakpoint because content fails, not for a device brand or arbitrary number. Components should adapt to their container (`width: 100%` and appropriate bounds) rather than assume the viewport.

State changes must not accidentally move surrounding content. Reserve border/indicator space or use outline, inset shadow, color, opacity, or a pseudo-element when a state should retain size. Treat loading, validation, selected, expanded, focus, and icon visibility as layout-stability cases; a deliberate size change must be clear UX, not a styling side effect.

## Angular Material and interaction quality

Use Angular Material's supported inputs, structure, theme/token APIs, and accessibility behavior before selecting Material internals. Scope any necessary global Material override to the owning feature/theme and document why the public API was insufficient. Do not style undocumented MDC/Material internals from arbitrary feature components.

UI is incomplete without keyboard and state behavior. Preserve a clearly visible `:focus-visible` indicator; never remove browser focus without an equally visible replacement. Consider relevant default, hover, focus-visible, active, selected, disabled, loading, invalid/error, success, empty, and read-only states, without inventing states that do not apply. Hover feedback must not be the only way to discover an action. Communicate meaningful state with more than color, use accessible names and associated errors, maintain logical headings/landmarks, and honor reduced motion where animation is meaningful.

Use spacing, typography, and hierarchy deliberately. Keep controls consistent, place validation feedback near its field, make asynchronous progress/success/failure understandable, and use progressive disclosure instead of presenting secondary options prematurely. Follow the accessibility standard for contrast, touch targets, dialogs, live feedback, tables, charts, and other WCAG requirements.

## Required UI diff self-review

For every changed UI diff, verify and correct the following before reporting completion:

- [ ] Application-owned classes use BEM with clear block ownership; modifiers are meaningful and elements do not mirror DOM depth.
- [ ] Native, Angular, and presentation states use the clearest semantic mechanism.
- [ ] Semantic elements are used and no wrapper, inline style, or structural selector is unnecessary.
- [ ] Selectors are low-specificity and stylesheet nesting is shallow.
- [ ] No undocumented `!important`, `::ng-deep`, third-party internal override, or feature-global style was added.
- [ ] Styles remain component-owned and reuse an existing suitable primitive, token, or Material API where available.
- [ ] Layout uses robust Grid/Flexbox/intrinsic sizing and does not jump between states.
- [ ] Responsive container behavior and relevant interaction states were considered.
- [ ] Keyboard operation, visible focus, accessible names/errors, contrast, non-color state cues, and reduced motion were considered.
- [ ] The result is simpler than reasonable alternatives and does not introduce a utility or token framework speculatively.

## Automation boundary

The current Stylelint configuration runs only for CSS and does not enforce BEM. Do not add packages or a fragile partial BEM rule as part of ordinary UI work. The generation workflow and required self-review enforce this standard today; assess Stylelint/SCSS parser support in a dedicated tooling task if automated enforcement becomes worthwhile.
