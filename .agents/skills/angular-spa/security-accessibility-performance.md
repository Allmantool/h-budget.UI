# Security, Accessibility, and Performance

## Security

Review for secrets/tokens in source or browser configuration, sensitive logging, unsafe HTML/URLs, sanitizer bypasses, direct DOM manipulation, dynamic script injection, open redirects, third-party scripts, source maps, dependency risks, and authorization assumptions. Do not disable Angular sanitization, call trust-bypass APIs without an explicit reviewed trust boundary, store secrets in browser-delivered files, or treat guards/UI visibility as authorization. User-facing errors must not reveal internal or sensitive detail.

## Accessibility

Target WCAG 2.2 AA unless a stronger repository requirement exists. Verify semantic HTML, keyboard operation, visible focus, dialog focus behavior, labels and associated errors, headings/landmarks, loading/live feedback, icon-only names, tables/charts, reduced motion, touch targets, and contrast. Use native controls where possible; do not make non-interactive elements clickable. Provide appropriate busy/expanded/selected/invalid state and a text or tabular alternative for meaningful chart data when required.

## Performance

Measure before optimizing. Consider route lazy loading, bundle impact, duplicate dependencies, CommonJS imports, images, change-detection hot paths, template allocations, repeat tracking, duplicate API calls, leaked browser resources, charts, large collections, state emissions, third-party import size, build budgets, and layout shifts. Do not raise a budget simply to hide a regression. Use focused imports, stable identity, cleanup, and derived-state memoization only where they solve observed work.
