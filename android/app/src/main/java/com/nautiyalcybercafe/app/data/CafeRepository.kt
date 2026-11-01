package com.nautiyalcybercafe.app.data

import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import java.time.Instant
import kotlin.random.Random

data class ServiceModel(
    val id: String = "",
    val name: String = "",
    val category: String = "Govt Identity",
    val description: String = "",
    val fee: Double = 0.0,
    val active: Boolean = true,
    val processingTime: String = "2-3 Business Days",
    val instructions: String = "",
    val requiredDocuments: List<String> = emptyList(),
    val createdAt: String = ""
)

data class DocumentAttachmentModel(
    val id: String = "",
    val name: String = "",
    val fileName: String = "",
    val fileType: String = "",
    val dataUrl: String = "",
    val uploadedAt: String = ""
)

data class CompletedDocumentModel(
    val id: String = "",
    val name: String = "",
    val fileName: String = "",
    val fileType: String = "",
    val dataUrl: String = "",
    val uploadedAt: String = "",
    val adminUid: String = "",
    val adminName: String = ""
)

data class ApplicationModel(
    val id: String = "",
    val applicationId: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val customerEmail: String = "",
    val serviceId: String = "",
    val serviceName: String = "",
    val status: String = "Pending",
    val fee: Double = 0.0,
    val paymentStatus: String = "unpaid",
    val paymentUpiRef: String = "",
    val paymentScreenshotUrl: String = "",
    val submittedDocuments: List<DocumentAttachmentModel> = emptyList(),
    val completedDocuments: List<CompletedDocumentModel> = emptyList(),
    val adminNotes: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
)

data class ChatMessageModel(
    val id: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderRole: String = "customer",
    val content: String = "",
    val timestamp: String = ""
)

data class AnnouncementModel(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val category: String = "Announcement",
    val actionUrl: String = "",
    val senderName: String = "Nautiyal Cyber Cafe",
    val createdAt: String = ""
)

/**
 * Shared Backend Repository connecting the Native Kotlin + Jetpack Compose Android App
 * to the exact same Cloud Firestore database ("ai-studio-f514ef87-d1c4-4c44-ac86-43d44e5ed926")
 * and Firebase Authentication used by the Web Application.
 */
object CafeRepository {

    const val OWNER_EMAIL = "anujnautiyal.ca@gmail.com"
    const val DATABASE_ID = "ai-studio-f514ef87-d1c4-4c44-ac86-43d44e5ed926"

    val auth: FirebaseAuth
        get() = FirebaseAuth.getInstance()

    val db: FirebaseFirestore
        get() = FirebaseFirestore.getInstance(FirebaseApp.getInstance(), DATABASE_ID)

    // ----------------- AUTHENTICATION (SEPARATE CUSTOMER & ADMIN LOGIN) -----------------

    suspend fun loginCustomer(email: String, password: String): Result<Boolean> = runCatching {
        auth.signInWithEmailAndPassword(email.trim(), password).await()
        syncFcmTokenAndTopics()
        true
    }

    suspend fun registerCustomer(
        name: String,
        phone: String,
        email: String,
        password: String,
        address: String
    ): Result<Boolean> = runCatching {
        val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
        val uid = result.user?.uid ?: error("Registration failed")
        val now = Instant.now().toString()
        val profile = mapOf(
            "uid" to uid,
            "name" to name.trim().take(100),
            "phone" to phone.trim().take(20),
            "email" to email.trim().take(120),
            "address" to address.trim().take(300),
            "role" to "customer",
            "createdAt" to now,
            "updatedAt" to now
        )
        db.collection("users").document(uid).set(profile).await()
        syncFcmTokenAndTopics()
        true
    }

    suspend fun loginAdmin(email: String, password: String): Result<Boolean> = runCatching {
        val res = auth.signInWithEmailAndPassword(email.trim(), password).await()
        val user = res.user ?: error("Authentication failed")
        val isOwner = user.email?.equals(OWNER_EMAIL, ignoreCase = true) == true
        val adminSnap = db.collection("admins").document(user.uid).get().await()

        if (!isOwner && (!adminSnap.exists() || adminSnap.getBoolean("active") != true)) {
            auth.signOut()
            error("Unauthorized: This account does not have Admin clearance.")
        }

        if (isOwner && !adminSnap.exists()) {
            val now = Instant.now().toString()
            db.collection("admins").document(user.uid).set(
                mapOf(
                    "uid" to user.uid,
                    "email" to (user.email ?: OWNER_EMAIL),
                    "name" to (user.displayName ?: "Anuj Nautiyal (Main Admin)"),
                    "role" to "main_admin",
                    "active" to true,
                    "createdAt" to now
                )
            ).await()
        }
        syncFcmTokenAndTopics()
        true
    }

    suspend fun checkIsAdmin(uid: String, email: String?): Boolean {
        if (email?.equals(OWNER_EMAIL, ignoreCase = true) == true) return true
        return try {
            val snap = db.collection("admins").document(uid).get().await()
            snap.exists() && snap.getBoolean("active") == true
        } catch (_: Exception) {
            false
        }
    }

    fun syncFcmTokenAndTopics() {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic("new_services")
            FirebaseMessaging.getInstance().subscribeToTopic("announcements")
            val uid = auth.currentUser?.uid ?: return
            FirebaseMessaging.getInstance().subscribeToTopic("user_$uid")
            FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
                if (!token.isNullOrBlank()) {
                    db.collection("users").document(uid).update("fcmToken", token.take(256))
                }
            }
        } catch (_: Exception) {
        }
    }

    // ----------------- REAL-TIME SERVICES SYNC & ADMIN PUBLISHING -----------------

    fun subscribeServices(
        onUpdate: (List<ServiceModel>) -> Unit,
        onNewServicePublished: ((ServiceModel) -> Unit)? = null
    ): ListenerRegistration {
        var initialLoad = true
        return db.collection("services").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) return@addSnapshotListener

            if (!initialLoad && onNewServicePublished != null) {
                for (change in snapshot.documentChanges) {
                    if (change.type == com.google.firebase.firestore.DocumentChange.Type.ADDED) {
                        val doc = change.document
                        val svc = ServiceModel(
                            id = doc.id,
                            name = doc.getString("name") ?: "",
                            category = doc.getString("category") ?: "General",
                            description = doc.getString("description") ?: "",
                            fee = doc.getDouble("fee") ?: 0.0,
                            active = doc.getBoolean("active") ?: true,
                            processingTime = doc.getString("processingTime") ?: "2-3 Days",
                            instructions = doc.getString("instructions") ?: "",
                            requiredDocuments = (doc.get("requiredDocuments") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList(),
                            createdAt = doc.getString("createdAt") ?: ""
                        )
                        if (svc.active) {
                            onNewServicePublished(svc)
                        }
                    }
                }
            }

            val list = snapshot.documents.map { doc ->
                ServiceModel(
                    id = doc.id,
                    name = doc.getString("name") ?: "",
                    category = doc.getString("category") ?: "General",
                    description = doc.getString("description") ?: "",
                    fee = doc.getDouble("fee") ?: 0.0,
                    active = doc.getBoolean("active") ?: true,
                    processingTime = doc.getString("processingTime") ?: "2-3 Days",
                    instructions = doc.getString("instructions") ?: "",
                    requiredDocuments = (doc.get("requiredDocuments") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList(),
                    createdAt = doc.getString("createdAt") ?: ""
                )
            }
            onUpdate(list)
            initialLoad = false
        }
    }

    suspend fun publishNewService(
        name: String,
        category: String,
        description: String,
        fee: Double,
        processingTime: String,
        requiredDocuments: List<String>
    ): Result<String> = runCatching {
        val docRef = db.collection("services").document()
        val now = Instant.now().toString()
        val data = mapOf(
            "id" to docRef.id,
            "name" to name.trim().take(150),
            "category" to category.trim().take(80),
            "description" to description.trim().take(2000),
            "fee" to fee,
            "active" to true,
            "processingTime" to processingTime.trim().take(80),
            "instructions" to "Upload clear PDF/JPG documents.",
            "requiredDocuments" to requiredDocuments,
            "createdAt" to now,
            "updatedAt" to now
        )
        docRef.set(data).await()

        // Broadcast real-time notification to all registered Android, tablet & desktop customers
        val annRef = db.collection("announcements").document()
        annRef.set(
            mapOf(
                "id" to annRef.id,
                "title" to "New Service Available: ${name.trim()}",
                "content" to "${description.trim()}\nFee: ₹${fee.toInt()} • Turnaround: $processingTime",
                "category" to "New Service Launch",
                "actionUrl" to docRef.id,
                "sentBy" to (auth.currentUser?.uid ?: "admin"),
                "senderName" to (auth.currentUser?.email ?: "Nautiyal Cyber Cafe Admin"),
                "createdAt" to now
            )
        ).await()

        docRef.id
    }

    // ----------------- APPLICATIONS, DOCUMENTS & PAYMENTS -----------------

    fun subscribeApplications(
        customerId: String?,
        isAdmin: Boolean,
        onUpdate: (List<ApplicationModel>) -> Unit
    ): ListenerRegistration {
        val query = if (isAdmin) {
            db.collection("applications")
        } else {
            db.collection("applications").whereEqualTo("customerId", customerId ?: "")
        }

        return query.addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) return@addSnapshotListener
            val list = snapshot.documents.map { doc ->
                val submittedRaw = (doc.get("submittedDocuments") as? List<*>) ?: emptyList<Any>()
                val submittedDocs = submittedRaw.mapNotNull { item ->
                    val map = item as? Map<*, *> ?: return@mapNotNull null
                    DocumentAttachmentModel(
                        id = map["id"]?.toString() ?: "",
                        name = map["name"]?.toString() ?: "",
                        fileName = map["fileName"]?.toString() ?: "",
                        fileType = map["fileType"]?.toString() ?: "",
                        dataUrl = map["dataUrl"]?.toString() ?: "",
                        uploadedAt = map["uploadedAt"]?.toString() ?: ""
                    )
                }

                val completedRaw = (doc.get("completedDocuments") as? List<*>) ?: emptyList<Any>()
                val completedDocs = completedRaw.mapNotNull { item ->
                    val map = item as? Map<*, *> ?: return@mapNotNull null
                    CompletedDocumentModel(
                        id = map["id"]?.toString() ?: "",
                        name = map["name"]?.toString() ?: "",
                        fileName = map["fileName"]?.toString() ?: "",
                        fileType = map["fileType"]?.toString() ?: "",
                        dataUrl = map["dataUrl"]?.toString() ?: "",
                        uploadedAt = map["uploadedAt"]?.toString() ?: "",
                        adminUid = map["adminUid"]?.toString() ?: "",
                        adminName = map["adminName"]?.toString() ?: ""
                    )
                }

                ApplicationModel(
                    id = doc.id,
                    applicationId = doc.getString("applicationId") ?: doc.id,
                    customerId = doc.getString("customerId") ?: "",
                    customerName = doc.getString("customerName") ?: "",
                    customerPhone = doc.getString("customerPhone") ?: "",
                    customerEmail = doc.getString("customerEmail") ?: "",
                    serviceId = doc.getString("serviceId") ?: "",
                    serviceName = doc.getString("serviceName") ?: "",
                    status = doc.getString("status") ?: "Pending",
                    fee = doc.getDouble("fee") ?: 0.0,
                    paymentStatus = doc.getString("paymentStatus") ?: "unpaid",
                    paymentUpiRef = doc.getString("paymentUpiRef") ?: "",
                    paymentScreenshotUrl = doc.getString("paymentScreenshotUrl") ?: "",
                    submittedDocuments = submittedDocs,
                    completedDocuments = completedDocs,
                    adminNotes = doc.getString("adminNotes") ?: "",
                    createdAt = doc.getString("createdAt") ?: "",
                    updatedAt = doc.getString("updatedAt") ?: ""
                )
            }.sortedByDescending { it.createdAt }
            onUpdate(list)
        }
    }

    suspend fun submitServiceApplication(
        service: ServiceModel,
        applicantNotes: String,
        documents: List<DocumentAttachmentModel>
    ): Result<String> = runCatching {
        val user = auth.currentUser ?: error("Not authenticated")
        val docRef = db.collection("applications").document()
        val now = Instant.now().toString()
        val appCode = "NCC-2026-${Random.nextInt(1000, 9999)}"

        val docMaps = documents.map {
            mapOf(
                "id" to it.id,
                "name" to it.name,
                "fileName" to it.fileName,
                "fileType" to it.fileType,
                "dataUrl" to it.dataUrl,
                "uploadedAt" to it.uploadedAt
            )
        }

        val payload = mapOf(
            "id" to docRef.id,
            "applicationId" to appCode,
            "customerId" to user.uid,
            "customerName" to (user.displayName ?: user.email?.substringBefore("@") ?: "Customer"),
            "customerPhone" to (user.phoneNumber ?: ""),
            "customerEmail" to (user.email ?: ""),
            "serviceId" to service.id,
            "serviceName" to service.name,
            "status" to "Pending",
            "fee" to service.fee,
            "paymentStatus" to "unpaid",
            "submittedDocuments" to docMaps,
            "completedDocuments" to emptyList<Any>(),
            "formData" to mapOf("notes" to applicantNotes.take(500)),
            "createdAt" to now,
            "updatedAt" to now
        )
        docRef.set(payload).await()
        appCode
    }

    suspend fun submitPaymentProof(
        appDocId: String,
        utrNumber: String,
        screenshotDataUrl: String
    ): Result<Unit> = runCatching {
        val now = Instant.now().toString()
        db.collection("applications").document(appDocId).update(
            mapOf(
                "paymentStatus" to "pending_verification",
                "paymentUpiRef" to utrNumber.trim().take(80),
                "paymentScreenshotUrl" to screenshotDataUrl,
                "paymentTimestamp" to now,
                "updatedAt" to now
            )
        ).await()
    }

    suspend fun adminUpdateStatusAndVerifyPayment(
        appDocId: String,
        status: String,
        paymentStatus: String,
        adminNotes: String
    ): Result<Unit> = runCatching {
        val now = Instant.now().toString()
        db.collection("applications").document(appDocId).update(
            mapOf(
                "status" to status,
                "paymentStatus" to paymentStatus,
                "adminNotes" to adminNotes.take(2000),
                "updatedAt" to now
            )
        ).await()
    }

    // ----------------- REAL-TIME APPLICATION MESSAGING -----------------

    fun subscribeMessages(
        appDocId: String,
        onUpdate: (List<ChatMessageModel>) -> Unit
    ): ListenerRegistration {
        return db.collection("applications")
            .document(appDocId)
            .collection("messages")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val msgs = snapshot.documents.map { doc ->
                    ChatMessageModel(
                        id = doc.id,
                        senderId = doc.getString("senderId") ?: "",
                        senderName = doc.getString("senderName") ?: "User",
                        senderRole = doc.getString("senderRole") ?: "customer",
                        content = doc.getString("content") ?: "",
                        timestamp = doc.getString("timestamp") ?: ""
                    )
                }
                onUpdate(msgs)
            }
    }

    suspend fun sendMessage(
        appDocId: String,
        content: String,
        isAdmin: Boolean
    ): Result<Unit> = runCatching {
        val user = auth.currentUser ?: error("Not signed in")
        val msgRef = db.collection("applications").document(appDocId).collection("messages").document()
        val now = Instant.now().toString()
        msgRef.set(
            mapOf(
                "id" to msgRef.id,
                "senderId" to user.uid,
                "senderName" to (user.displayName ?: user.email ?: "User"),
                "senderRole" to if (isAdmin) "admin" else "customer",
                "content" to content.trim().take(2000),
                "timestamp" to now,
                "read" to false
            )
        ).await()
    }

    // ----------------- REAL-TIME ANNOUNCEMENTS -----------------

    fun subscribeAnnouncements(
        onUpdate: (List<AnnouncementModel>) -> Unit
    ): ListenerRegistration {
        return db.collection("announcements")
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val list = snapshot.documents.map { doc ->
                    AnnouncementModel(
                        id = doc.id,
                        title = doc.getString("title") ?: "",
                        content = doc.getString("content") ?: "",
                        category = doc.getString("category") ?: "Announcement",
                        actionUrl = doc.getString("actionUrl") ?: "",
                        senderName = doc.getString("senderName") ?: "Cafe Admin",
                        createdAt = doc.getString("createdAt") ?: ""
                    )
                }.sortedByDescending { it.createdAt }
                onUpdate(list)
            }
    }
}
