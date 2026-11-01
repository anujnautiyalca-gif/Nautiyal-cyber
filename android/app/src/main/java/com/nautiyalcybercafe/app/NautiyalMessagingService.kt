package com.nautiyalcybercafe.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlin.random.Random

/**
 * Native Firebase Cloud Messaging (FCM) Service for Nautiyal Cyber Cafe.
 * Delivers real-time notifications when an Admin publishes a new service,
 * updates an application status, verifies a UPI payment, or sends a chat message,
 * without requiring customers to reinstall or update the APK.
 */
class NautiyalMessagingService : FirebaseMessagingService() {

    companion object {
        const val CHANNEL_NEW_SERVICES = "new_services_channel"
        const val CHANNEL_APP_UPDATES = "application_updates_channel"
        const val CHANNEL_MESSAGES = "messages_channel"
        const val FIRESTORE_DB_ID = "ai-studio-f514ef87-d1c4-4c44-ac86-43d44e5ed926"

        fun createNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val servicesChannel = NotificationChannel(
                    CHANNEL_NEW_SERVICES,
                    "New Services & Announcements",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Instant alerts when Nautiyal Cyber Cafe publishes a new service or government form"
                    enableVibration(true)
                }

                val updatesChannel = NotificationChannel(
                    CHANNEL_APP_UPDATES,
                    "Application & Document Updates",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts when your application is processed, payment is verified, or completed PDF is ready"
                    enableVibration(true)
                }

                val messagesChannel = NotificationChannel(
                    CHANNEL_MESSAGES,
                    "Staff Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Direct messages from Nautiyal Cyber Cafe staff regarding your application"
                    enableVibration(true)
                }

                manager.createNotificationChannels(
                    listOf(servicesChannel, updatesChannel, messagesChannel)
                )
            }
        }

        fun showSystemNotification(
            context: Context,
            title: String,
            body: String,
            channelId: String = CHANNEL_NEW_SERVICES
        ) {
            createNotificationChannels(context)
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                Random.nextInt(10000),
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(Random.nextInt(100000), notification)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val currentUser = FirebaseAuth.getInstance().currentUser ?: return
        try {
            val db = FirebaseFirestore.getInstance(FirebaseApp.getInstance(), FIRESTORE_DB_ID)
            db.collection("users").document(currentUser.uid)
                .update("fcmToken", token.take(256))
        } catch (_: Exception) {
            // Token will also be synced on next login
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Nautiyal Cyber Cafe"
        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: "New service or application update available."
        val channelId = remoteMessage.data["channelId"] ?: CHANNEL_NEW_SERVICES

        showSystemNotification(applicationContext, title, body, channelId)
    }
}
