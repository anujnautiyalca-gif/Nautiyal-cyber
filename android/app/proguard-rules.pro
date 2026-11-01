# ProGuard / R8 Optimization & Keep Rules for Nautiyal Cyber Cafe Android App

# Keep JavascriptInterface bridges used by synchronized WebView & BiometricPrompt
-keepclassmembers class com.nautiyalcybercafe.app.BiometricBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.nautiyalcybercafe.app.NotificationBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Firestore Data Models for serialization
-keep class com.nautiyalcybercafe.app.data.** { *; }

# Firebase & Google Play Services rules
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
-keepattributes Signature,InnerClasses,EnclosingMethod,RuntimeVisibleAnnotations
