// src/utils/nativeStatusBar.js
//
// No-op module — kept as an import target so existing imports don't
// break, but does nothing.
//
// Why: On Android 12+, Capacitor's StatusBar plugin calls are
// unreliable and conflict with the native Android theme XML. We now
// bake the status bar appearance (navy strip + light icons) directly
// into android/app/src/main/res/values/styles.xml at the OS theme
// level, which is the only approach that reliably works across
// Android versions. This file is intentionally empty so nothing
// overrides that.

export function updateStatusBarForTheme(/* theme */) {
    // intentionally empty
}
