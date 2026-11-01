package com.nautiyalcybercafe.app

import android.content.Context
import android.webkit.JavascriptInterface
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Native Android Notification & FCM Topic Bridge exposed to the WebView as `window.AndroidNotification`.
 * Enables instant Android notification delivery and topic subscription without APK updates.
 */
class NotificationBridge(private val context: Context) {

    @Volatile
    private var cachedFcmToken: String = ""

    init {
        try {
            FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
                cachedFcmToken = token ?: ""
            }
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, body: String, channelId: String) {
        val safeChannel = if (channelId.isNotBlank()) channelId else NautiyalMessagingService.CHANNEL_NEW_SERVICES
        NautiyalMessagingService.showSystemNotification(context, title, body, safeChannel)
    }

    @JavascriptInterface
    fun subscribeToTopic(topic: String) {
        if (topic.isBlank()) return
        try {
            val sanitizedTopic = topic.replace(Regex("[^a-zA-Z0-9-_.~%]"), "_")
            FirebaseMessaging.getInstance().subscribeToTopic(sanitizedTopic)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun getFcmToken(): String {
        return cachedFcmToken
    }
}
