package com.nautiyalcybercafe.app.ui

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.nautiyalcybercafe.app.NautiyalMessagingService
import com.nautiyalcybercafe.app.data.*
import kotlinx.coroutines.launch

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF2563EB),
    onPrimary = Color.White,
    secondary = Color(0xFF059669),
    background = Color(0xFFF8FAFC),
    surface = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A)
)

/**
 * Root Jetpack Compose Application for Nautiyal Cyber Cafe (Light Mode Only).
 * Adapts to phone and tablet screen widths (`screenWidthDp >= 600`),
 * uses lazy lists with stable keys for low-end device smoothness,
 * and connects directly to the shared Firebase backend + synchronized WebView portal.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NautiyalComposeApp(
    configuredWebView: WebView,
    onPickDocumentForCompose: ((DocumentAttachmentModel) -> Unit) -> Unit,
    onDownloadDocument: (String, String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp >= 600

    // Mode: true = Full Synchronized Portal (with Biometric + File Upload + Camera + UPI QR), false = Native Compose Mode
    var useWebPortalView by remember { mutableStateOf(true) }

    // Auth & Role states
    var currentUserUid by remember { mutableStateOf(CafeRepository.auth.currentUser?.uid) }
    var currentUserEmail by remember { mutableStateOf(CafeRepository.auth.currentUser?.email) }
    var isAdmin by remember { mutableStateOf(false) }

    // Real-time Firestore state
    var services by remember { mutableStateOf<List<ServiceModel>>(emptyList()) }
    var applications by remember { mutableStateOf<List<ApplicationModel>>(emptyList()) }
    var announcements by remember { mutableStateOf<List<AnnouncementModel>>(emptyList()) }
    var selectedTab by remember { mutableStateOf(0) }

    // Subscribe to real-time services & trigger native Android notification when admin publishes a new service
    DisposableEffect(currentUserUid) {
        val svcReg = CafeRepository.subscribeServices(
            onUpdate = { services = it },
            onNewServicePublished = { newSvc ->
                NautiyalMessagingService.showSystemNotification(
                    context = context,
                    title = "New Service Available: ${newSvc.name}",
                    body = "Fee: ₹${newSvc.fee.toInt()} • Turnaround: ${newSvc.processingTime}. Open Nautiyal Cyber Cafe to apply!",
                    channelId = NautiyalMessagingService.CHANNEL_NEW_SERVICES
                )
            }
        )
        val annReg = CafeRepository.subscribeAnnouncements { announcements = it }
        val appReg = if (currentUserUid != null) {
            CafeRepository.subscribeApplications(currentUserUid, isAdmin) { applications = it }
        } else null

        onDispose {
            svcReg.remove()
            annReg.remove()
            appReg?.remove()
        }
    }

    LaunchedEffect(currentUserUid, currentUserEmail) {
        val uid = currentUserUid
        if (uid != null) {
            isAdmin = CafeRepository.checkIsAdmin(uid, currentUserEmail)
            CafeRepository.syncFcmTokenAndTopics()
        } else {
            isAdmin = false
        }
    }

    MaterialTheme(colorScheme = LightColorScheme) {
        Scaffold(
            containerColor = Color(0xFFF8FAFC),
            topBar = {
                if (!useWebPortalView) {
                    TopAppBar(
                        title = {
                            Column {
                                Text(
                                    text = "Nautiyal Cyber Cafe",
                                    fontSize = if (isTablet) 18.sp else 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF0F172A)
                                )
                                Text(
                                    text = "New Market Thatyur • 7982568459",
                                    fontSize = 11.sp,
                                    color = Color(0xFF475569)
                                )
                            }
                        },
                        actions = {
                            TextButton(onClick = { useWebPortalView = true }) {
                                Text("Full Portal View", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            if (currentUserUid != null) {
                                TextButton(
                                    onClick = {
                                        CafeRepository.auth.signOut()
                                        currentUserUid = null
                                        currentUserEmail = null
                                        isAdmin = false
                                    }
                                ) {
                                    Text("Logout", color = Color(0xFFDC2626), fontSize = 12.sp)
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                    )
                }
            },
            bottomBar = {
                if (!useWebPortalView && currentUserUid != null) {
                    NavigationBar(containerColor = Color.White) {
                        NavigationBarItem(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            label = { Text("Services", fontSize = 11.sp) },
                            icon = {}
                        )
                        NavigationBarItem(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            label = { Text("Applications", fontSize = 11.sp) },
                            icon = {}
                        )
                        NavigationBarItem(
                            selected = selectedTab == 2,
                            onClick = { selectedTab = 2 },
                            label = { Text("Alerts (${announcements.size})", fontSize = 11.sp) },
                            icon = {}
                        )
                        if (isAdmin) {
                            NavigationBarItem(
                                selected = selectedTab == 3,
                                onClick = { selectedTab = 3 },
                                label = { Text("Admin Publish", fontSize = 11.sp) },
                                icon = {}
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (useWebPortalView) {
                    AndroidView(
                        factory = { configuredWebView },
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    if (currentUserUid == null) {
                        NativeAuthScreen(
                            onAuthenticated = {
                                currentUserUid = CafeRepository.auth.currentUser?.uid
                                currentUserEmail = CafeRepository.auth.currentUser?.email
                            }
                        )
                    } else {
                        when (selectedTab) {
                            0 -> NativeServicesTab(
                                services = services.filter { it.active },
                                onPickDocument = onPickDocumentForCompose,
                                onApplicationSubmitted = { selectedTab = 1 }
                            )
                            1 -> NativeApplicationsTab(
                                applications = applications,
                                isAdmin = isAdmin,
                                onPickScreenshot = onPickDocumentForCompose,
                                onDownloadDocument = onDownloadDocument
                            )
                            2 -> NativeAnnouncementsTab(announcements = announcements)
                            3 -> if (isAdmin) {
                                NativeAdminPublishServiceTab(
                                    onServicePublished = { selectedTab = 0 }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NativeAuthScreen(onAuthenticated: () -> Unit) {
    val scope = rememberCoroutineScope()
    // 0 = Customer Login, 1 = Customer Registration, 2 = Admin Login
    var authTab by remember { mutableStateOf(0) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var statusMsg by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(
                onClick = { authTab = 0; statusMsg = null },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (authTab == 0) Color(0xFF2563EB) else Color(0xFFE2E8F0),
                    contentColor = if (authTab == 0) Color.White else Color(0xFF0F172A)
                )
            ) { Text("Customer Login", fontSize = 12.sp) }

            Button(
                onClick = { authTab = 1; statusMsg = null },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (authTab == 1) Color(0xFF2563EB) else Color(0xFFE2E8F0),
                    contentColor = if (authTab == 1) Color.White else Color(0xFF0F172A)
                )
            ) { Text("Register", fontSize = 12.sp) }

            Button(
                onClick = { authTab = 2; statusMsg = null },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (authTab == 2) Color(0xFFD97706) else Color(0xFFE2E8F0),
                    contentColor = if (authTab == 2) Color.White else Color(0xFF0F172A)
                )
            ) { Text("Admin Login", fontSize = 12.sp) }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = when (authTab) {
                        0 -> "Customer Portal Login"
                        1 -> "New Customer Registration"
                        else -> "Authorized Admin Portal Login"
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(12.dp))

                if (authTab == 1) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("10-Digit Mobile Number") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Village / Town Address") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )

                if (statusMsg != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(statusMsg!!, color = Color(0xFFDC2626), fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {
                        loading = true
                        statusMsg = null
                        scope.launch {
                            val res = when (authTab) {
                                0 -> CafeRepository.loginCustomer(email, password)
                                1 -> CafeRepository.registerCustomer(name, phone, email, password, address)
                                else -> CafeRepository.loginAdmin(email, password)
                            }
                            loading = false
                            res.onSuccess { onAuthenticated() }
                                .onFailure { statusMsg = it.localizedMessage ?: "Authentication failed" }
                        }
                    },
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (loading) "Please wait..." else "Continue")
                }
            }
        }
    }
}

@Composable
private fun NativeServicesTab(
    services: List<ServiceModel>,
    onPickDocument: ((DocumentAttachmentModel) -> Unit) -> Unit,
    onApplicationSubmitted: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var applyingService by remember { mutableStateOf<ServiceModel?>(null) }
    var applicantNotes by remember { mutableStateOf("") }
    var uploadedDocs by remember { mutableStateOf<List<DocumentAttachmentModel>>(emptyList()) }
    var submitting by remember { mutableStateOf(false) }

    if (applyingService != null) {
        val svc = applyingService!!
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Apply: ${svc.name}", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Fee: ₹${svc.fee.toInt()} • Required: ${svc.requiredDocuments.joinToString()}", fontSize = 12.sp)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = applicantNotes,
                onValueChange = { applicantNotes = it },
                label = { Text("Applicant Details / Instructions") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = {
                    onPickDocument { doc ->
                        uploadedDocs = uploadedDocs + doc
                    }
                }
            ) {
                Text("Upload Document (${uploadedDocs.size} attached)")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { applyingService = null }) {
                    Text("Cancel")
                }
                Button(
                    enabled = !submitting,
                    onClick = {
                        submitting = true
                        scope.launch {
                            CafeRepository.submitServiceApplication(svc, applicantNotes, uploadedDocs)
                            submitting = false
                            applyingService = null
                            onApplicationSubmitted()
                        }
                    }
                ) {
                    Text(if (submitting) "Submitting..." else "Submit Application")
                }
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(services, key = { it.id }) { svc ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(svc.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("₹${svc.fee.toInt()}", fontWeight = FontWeight.ExtraBold, color = Color(0xFF059669))
                        }
                        Text(svc.description, fontSize = 12.sp, color = Color(0xFF475569))
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                applyingService = svc
                                uploadedDocs = emptyList()
                                applicantNotes = ""
                            }
                        ) {
                            Text("Apply Now", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NativeApplicationsTab(
    applications: List<ApplicationModel>,
    isAdmin: Boolean,
    onPickScreenshot: ((DocumentAttachmentModel) -> Unit) -> Unit,
    onDownloadDocument: (String, String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var activeChatApp by remember { mutableStateOf<ApplicationModel?>(null) }
    var chatMessages by remember { mutableStateOf<List<ChatMessageModel>>(emptyList()) }
    var messageInput by remember { mutableStateOf("") }
    var utrInput by remember { mutableStateOf("") }

    if (activeChatApp != null) {
        val app = activeChatApp!!
        DisposableEffect(app.id) {
            val reg = CafeRepository.subscribeMessages(app.id) { chatMessages = it }
            onDispose { reg.remove() }
        }
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Chat: ${app.applicationId}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                TextButton(onClick = { activeChatApp = null }) { Text("Close") }
            }
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(chatMessages, key = { it.id }) { msg ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("${msg.senderName} (${msg.senderRole})", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            Text(msg.content, fontSize = 13.sp)
                        }
                    }
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = messageInput,
                    onValueChange = { messageInput = it },
                    placeholder = { Text("Type message...") },
                    modifier = Modifier.weight(1f)
                )
                Button(
                    onClick = {
                        if (messageInput.isNotBlank()) {
                            val text = messageInput
                            messageInput = ""
                            scope.launch {
                                CafeRepository.sendMessage(app.id, text, isAdmin)
                            }
                        }
                    }
                ) {
                    Text("Send")
                }
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(applications, key = { it.id }) { app ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("${app.serviceName} (${app.applicationId})", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Status: ${app.status} • Payment: ${app.paymentStatus}", fontSize = 12.sp, color = Color(0xFF2563EB))

                        if (app.paymentStatus == "unpaid" && !isAdmin) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = utrInput,
                                onValueChange = { utrInput = it },
                                label = { Text("12-Digit UPI UTR Ref") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val upiUri = Uri.parse(
                                            "upi://pay?pa=anujnautiyal.ca@oksbi&pn=Nautiyal%20Cyber%20Cafe&am=${app.fee.toInt()}&cu=INR"
                                        )
                                        runCatching {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, upiUri))
                                        }
                                    }
                                ) { Text("Pay ₹${app.fee.toInt()} via UPI", fontSize = 11.sp) }

                                Button(
                                    onClick = {
                                        onPickScreenshot { doc ->
                                            scope.launch {
                                                CafeRepository.submitPaymentProof(app.id, utrInput.ifBlank { "UPI-PAID" }, doc.dataUrl)
                                            }
                                        }
                                    }
                                ) { Text("Upload Payment Proof", fontSize = 11.sp) }
                            }
                        }

                        if (app.completedDocuments.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            app.completedDocuments.forEach { compDoc ->
                                Button(
                                    onClick = { onDownloadDocument(compDoc.dataUrl, compDoc.fileName) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                                ) {
                                    Text("Download Completed PDF: ${compDoc.fileName}", fontSize = 11.sp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { activeChatApp = app }) {
                                Text("Messages / Chat", fontSize = 11.sp)
                            }
                            if (isAdmin) {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            CafeRepository.adminUpdateStatusAndVerifyPayment(
                                                appDocId = app.id,
                                                status = "Completed",
                                                paymentStatus = "verified",
                                                adminNotes = "Verified & processed by Admin"
                                            )
                                        }
                                    }
                                ) {
                                    Text("Verify & Complete", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NativeAnnouncementsTab(announcements: List<AnnouncementModel>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(announcements, key = { it.id }) { ann ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(ann.category.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2563EB))
                    Text(ann.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(ann.content, fontSize = 12.sp, color = Color(0xFF334155))
                }
            }
        }
    }
}

@Composable
private fun NativeAdminPublishServiceTab(onServicePublished: () -> Unit) {
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Govt Identity") }
    var description by remember { mutableStateOf("") }
    var feeText by remember { mutableStateOf("100") }
    var processingTime by remember { mutableStateOf("2-3 Business Days") }
    var saving by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            "Publish New Service (Instant Android Push Alert)",
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp
        )
        Text(
            "Registered customers receive an instant notification without updating the APK.",
            fontSize = 12.sp,
            color = Color(0xFF475569)
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Service Name") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = category,
            onValueChange = { category = it },
            label = { Text("Category") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = feeText,
            onValueChange = { feeText = it },
            label = { Text("Fee (₹ INR)") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = processingTime,
            onValueChange = { processingTime = it },
            label = { Text("Turnaround Time") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            enabled = !saving && name.isNotBlank(),
            onClick = {
                saving = true
                scope.launch {
                    CafeRepository.publishNewService(
                        name = name,
                        category = category,
                        description = description,
                        fee = feeText.toDoubleOrNull() ?: 100.0,
                        processingTime = processingTime,
                        requiredDocuments = listOf("Aadhaar Card", "Passport Photo")
                    )
                    saving = false
                    onServicePublished()
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (saving) "Publishing..." else "Publish Service & Notify Customers")
        }
    }
}
