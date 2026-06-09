export interface KeyboardAvoidHeightParams {
  /** The full content height the embedded page has reported via update-height. */
  autoHeight: number;
  /** The widget container's top edge, in window coordinates (from measureInWindow). */
  containerTopY: number;
  /** The top edge of the keyboard, in the same coordinate space as containerTopY. */
  keyboardTopY: number;
  /** Smallest height we'll ever shrink the WebView to, so it never disappears. */
  minHeight?: number;
}

/**
 * Works out the height the comment WebView should render at while a field is
 * focused and the keyboard is up.
 *
 * The widget renders the whole comment UI (list + input) inside a single
 * WebView whose height normally tracks its full content height, so the page is
 * never internally scrollable and the keyboard simply overlays the bottom of
 * it. To give the focused field room to move above the keyboard we temporarily
 * shrink the WebView so its bottom edge sits at the top of the keyboard; the
 * now-overflowing page can then scroll the field into view.
 *
 * Returns `autoHeight` unchanged when the widget already fits entirely above
 * the keyboard (no capping needed).
 */
export function computeKeyboardAvoidHeight({
  autoHeight,
  containerTopY,
  keyboardTopY,
  minHeight = 120,
}: KeyboardAvoidHeightParams): number {
  const available = keyboardTopY - containerTopY;
  if (available >= autoHeight) {
    return autoHeight;
  }
  return Math.max(minHeight, available);
}

/**
 * Builds the script injected into the WebView to bridge keyboard handling.
 *
 * It reports when a text field inside the page gains/loses focus (so the native
 * side knows when to apply the height cap above) and exposes
 * `window.__fcScrollFocusedIntoView()` so the native side can pull the focused
 * field into the visible band once the WebView has been resized.
 */
export function buildKeyboardAvoidanceScript(instanceId: string): string {
  const id = JSON.stringify(instanceId);
  return `
(function () {
  if (window.__fcKbAvoidInstalled) { return; }
  window.__fcKbAvoidInstalled = true;
  var instanceId = ${id};
  function isTextField(el) {
    if (!el) { return false; }
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea') { return true; }
    if (el.isContentEditable) { return true; }
    if (tag === 'input') {
      var type = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'email', 'url', 'tel', 'password', 'number', ''].indexOf(type) !== -1;
    }
    return false;
  }
  function post(type) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, instanceId: instanceId }));
    } catch (e) {}
  }
  document.addEventListener('focusin', function (e) {
    if (isTextField(e.target)) { post('fc-input-focus'); }
  }, true);
  document.addEventListener('focusout', function (e) {
    if (isTextField(e.target)) { post('fc-input-blur'); }
  }, true);
  window.__fcScrollFocusedIntoView = function () {
    var el = document.activeElement;
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
      } catch (e) {
        el.scrollIntoView();
      }
    }
  };
})();
true;
`;
}
