# myportfolio

Personal portfolio site for **Geoffrey Njuguna (Jeff)** — Computer Science graduate and
web/software developer based in Kenya.

Live: <https://jeffboss315.github.io/myportfolio/>

## Stack

Plain HTML, CSS and JavaScript — no build step, no framework, no runtime dependencies.

| File | Purpose |
| --- | --- |
| `index.html` | Markup, inline SVG icon sprite, JSON-LD, pre-paint theme bootstrap |
| `style.css` | All styling, light/dark themes, accent custom properties |
| `script.js` | Behaviour — project data, filters, command palette, form, animations |

## How the interactive layer is wired

Two conventions carry most of the behaviour, and both exist because of the same
trap: `transition` and `animation` are single properties, so a rule that sets one
does not add to what an element already had — it replaces it.

**JS writes custom properties, CSS owns the rule.** Tilt, the pointer glow and the
magnetic social links all set `--tilt-x`, `--gx`, `--mag-x` and so on; the
`transform`, `translate` and `transition` that consume them are declared once in
the stylesheet. Nothing in `script.js` writes `style.transform` or
`style.transition` directly, because doing so silently deletes whatever list the
component declared for itself.

**Entrances are animations, not transitions.** `.reveal` uses `@keyframes
reveal-in` with `backwards` fill and a `--reveal-delay` stagger. That leaves each
component's own `transition` intact for its hover state, and the delay only
reaches the entrance rather than sitting on the element for the rest of the
session. `.has-revealed` marks an entrance as spent so it cannot replay.

The theme fade works the same way: `--theme-fade` is a *value* every themed
component pastes in front of its own transition list, not a rule that overrides
them.

## Editing content

Projects live in the `PROJECTS` array at the top of `script.js`. Leave `demo` as `''`
and no "Live Demo" link renders. Every project modal offers "Ask me for a demo".
`repo` is kept for reference only — source-code links are not shown on the site.

- `tags` — one or more filter keys from `FILTERS` (`web`, `fintech`, `desktop`, `ai`,
  `media`). Filter chips show live counts and hide when empty.
- `platforms` — shown on the card cover and in the modal (`Web`, `Windows`, `Android`…).
- `features` — bullet list in the detail modal.
- `featured: true` — adds a "Featured" ribbon.

The hero stats and the "N of those builds" line in the Journey section are counted
from this array, so they never go stale.

To receive contact-form messages by email, set `FORM_ENDPOINT` in `script.js` to a
Formspree (or Web3Forms) URL. While it is empty the form validates and then opens the
visitor's mail client with the message pre-filled.

## Running locally

Serve the folder over HTTP — opening `index.html` directly works, but `file://` blocks
clipboard and history APIs. The VS Code Live Server extension is preconfigured on port
5504 in `.vscode/settings.json`.

## Browser support

The page works everywhere and gets better where the browser can do more. Each of
these has a plain fallback that is what the site did before:

| Feature | Where supported | Otherwise |
| --- | --- | --- |
| View Transitions | theme swap is one circular wipe | the per-element colour fade |
| `animation-timeline: scroll()` | progress bar driven by the compositor | the existing scroll listener |
| `animation-timeline: view()` | the timeline spine fills as you read | the static gradient spine |
| `inert` | the closed mobile drawer leaves the tab order | drawer links stay reachable |

`prefers-reduced-motion`, `prefers-contrast: more` and `@media print` are all
handled — the printed page drops every control, prints in ink on white, and
writes link addresses out beside their link text.

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which publishes the repository
to GitHub Pages.
