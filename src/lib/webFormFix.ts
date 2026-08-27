const STYLE_ID = 'lime-input-text-color-fix';

// Mobile Safari/Chrome, in dark mode, can apply their own native form-control
// text color to <input>/<textarea> elements — overriding the author's CSS
// `color` for the actual typed glyphs (cursor and value still behave
// normally, the text itself just renders invisible against a light
// background). `color-scheme: light` stops most of that theming outright.
//
// The remaining WebKit-specific gap is `-webkit-text-fill-color`, which
// controls the visible glyph color independently of `color` once the browser
// has picked its own scheme. Relying on the CSS `currentColor` keyword for
// that non-standard property isn't reliable across WebKit versions, so
// instead we read each field's actual resolved `color` in JS and set
// `-webkit-text-fill-color` to that literal value directly.
//
// A field with `autoFocus` (e.g. the post composer) can receive its first
// focus event before our listeners below have had a chance to run on it, so
// focus/input events alone aren't enough — a MutationObserver also fixes
// every input/textarea the instant it's inserted into the DOM, before any
// interaction happens at all.
export function fixElement(el: Element | EventTarget | null) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  // Per-element color-scheme, not just the html-level rule below — some WebKit
  // versions re-derive a form control's dark-mode theming from ancestor
  // stacking/compositing context rather than purely the root, so belt-and-suspenders.
  el.style.setProperty('color-scheme', 'light');
  const resolvedColor = getComputedStyle(el).color;
  el.style.setProperty('-webkit-text-fill-color', resolvedColor, 'important');
  el.style.setProperty('opacity', '1');
}

// Same fix, but with the target color passed in literally instead of read via
// getComputedStyle(). Use this for a specific known-broken field (e.g. the
// composer) where the field's color is a fixed, known value — a hardcoded
// value can't be wrong because of a computed-style timing race the way the
// dynamic version above can. Don't use this for fields whose color varies
// (e.g. AuthScreen's white-on-dark inputs) — pass the real color, not a
// guess, or it'll paint text the wrong color instead of just invisible text.
export function fixElementWithColor(el: Element | EventTarget | null, hexColor: string) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  el.style.setProperty('color-scheme', 'light');
  el.style.setProperty('-webkit-text-fill-color', hexColor, 'important');
  el.style.setProperty('opacity', '1');
}

export function injectInputTextColorFix() {
  if (typeof document === 'undefined') return;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    // The html-level rule is the primary defense; the `currentColor` rule is a
    // synchronous CSS-only fallback for the instant between an autoFocus field
    // mounting and our JS listeners below getting a chance to run on it — it's
    // not fully reliable by itself on every WebKit build (hence still doing the
    // JS-computed literal-color fix too), but it's a free first line of defense.
    style.textContent = `
      html { color-scheme: light; }
      input, textarea { -webkit-text-fill-color: currentColor; color-scheme: light; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('focusin', e => fixElement(e.target), true);
  document.addEventListener('input', e => fixElement(e.target), true);
  document.addEventListener('compositionupdate', e => fixElement(e.target), true);
  document.addEventListener('compositionend', e => fixElement(e.target), true);
  document.querySelectorAll('input, textarea').forEach(fixElement);

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        fixElement(node);
        node.querySelectorAll?.('input, textarea').forEach(fixElement);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
