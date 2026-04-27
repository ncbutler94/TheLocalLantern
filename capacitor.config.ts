import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.ncbutler.locallantern',
    appName: 'The Local Lantern',
    webDir: 'build',
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: false,
            launchFadeOutDuration: 400,
            backgroundColor: '#0F2D52',
            showSpinner: false,
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
    // Note: @capgo/capacitor-social-login is configured at runtime via
    // SocialLogin.initialize() in src/utils/nativeGoogleAuth.js, not here.
};

export default config;