plugins {
    id("com.android.application")
}

android {
    namespace = "com.piratequiz.prototype"
    compileSdk = 35

    signingConfigs {
        create("piratesDebug") {
            storeFile = rootProject.file("ci/pirates-v1.keystore")
            storePassword = "piratesv1"
            keyAlias = "piratesdebug"
            keyPassword = "piratesv1"
        }
    }

    defaultConfig {
        applicationId = "com.piratequiz.prototype"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("piratesDebug")
        }
    }
}
