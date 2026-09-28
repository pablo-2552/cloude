plugins {
    id("com.android.application")
}

android {
    namespace = "com.cloudscreen"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.cloudscreen"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1"
    }
}

dependencies {
    implementation("org.jitsi:webrtc:124.0.0")
    implementation("org.java-websocket:Java-WebSocket:1.5.7")
}
