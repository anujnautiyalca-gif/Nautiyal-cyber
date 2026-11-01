package com.nautiyalcybercafe.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.nautiyalcybercafe.app.data.DocumentAttachmentModel
import com.nautiyalcybercafe.app.ui.NautiyalComposeApp
import java.io.File
import java.io.FileOutputStream
import java.time.Instant
import java.util.UUID

/**
 * MainActivity for Nautiyal Cyber Cafe Official Android App
 * - Built with Kotlin + Jetpack Compose + Synchronized Web Portal Bridge
 * - Integrates Firebase Cloud Messaging (FCM) topic subscriptions ("new_services", "announcements")
 * - Supports BiometricPrompt & FingerprintManager login via BiometricBridge
 * - Supports Document Uploads, Payment Screenshot Uploads & Private Completed Document Downloads
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var composeDocCallback: ((DocumentAttachmentModel) -> Unit)? = null
    private var geolocationOrigin: String? = null
    private var geolocationCallback: GeolocationPermissions.Callback? = null

    companion object {
        const val PORTAL_URL = "https://ais-pre-eycqsk2mxfisrdndakl3o4-196001401311.asia-northeast1.run.app"
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseLocationGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (geolocationCallback != null && geolocationOrigin != null) {
            geolocationCallback?.invoke(geolocationOrigin, fineLocationGranted || coarseLocationGranted, false)
            geolocationCallback = null
            geolocationOrigin = null
        }
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val results: Array<Uri>? = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        if (fileUploadCallback != null) {
            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        } else if (composeDocCallback != null && results != null && results.isNotEmpty()) {
            val uri = results[0]
            try {
                val mimeType = contentResolver.getType(uri) ?: "application/octet-stream"
                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                if (bytes != null) {
                    val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                    val dataUrl = "data:$mimeType;base64,$base64"
                    composeDocCallback?.invoke(
                        DocumentAttachmentModel(
                            id = UUID.randomUUID().toString(),
                            name = "Uploaded Document",
                            fileName = "document_${System.currentTimeMillis()}",
                            fileType = mimeType,
                            dataUrl = dataUrl,
                            uploadedAt = Instant.now().toString()
                        )
                    )
                }
            } catch (_: Exception) {
            } finally {
                composeDocCallback = null
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, true)

        // Initialize Android Notification Channels & Subscribe to FCM Topics for New Services
        NautiyalMessagingService.createNotificationChannels(this)
        subscribeToDefaultFcmTopics()

        requestInitialRuntimePermissions()

        webView = WebView(this)
        configureWebView()
        webView.loadUrl(PORTAL_URL)

        // Host inside Jetpack Compose Material 3 Light Mode Root
        setContent {
            NautiyalComposeApp(
                configuredWebView = webView,
                onPickDocumentForCompose = { callback ->
                    composeDocCallback = callback
                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf", "image/jpeg", "image/png"))
                    }
                    fileChooserLauncher.launch(intent)
                },
                onDownloadDocument = { urlOrDataUri, fileName ->
                    downloadDocumentSafely(urlOrDataUri, fileName)
                }
            )
        }

        // Predictive Back Navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (this@MainActivity::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun subscribeToDefaultFcmTopics() {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic("new_services")
            FirebaseMessaging.getInstance().subscribeToTopic("announcements")
        } catch (_: Exception) {
        }
    }

    private fun requestInitialRuntimePermissions() {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val missing = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.setGeolocationEnabled(true)
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        // Attach Native Fingerprint BiometricBridge & Native FCM NotificationBridge
        webView.addJavascriptInterface(BiometricBridge(this, webView), "AndroidBiometric")
        webView.addJavascriptInterface(NotificationBridge(applicationContext), "AndroidNotification")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("upi:") || url.contains("wa.me")) {
                    return try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        true
                    } catch (e: Exception) {
                        false
                    }
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                val hasFine = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                if (hasFine) {
                    callback?.invoke(origin, true, false)
                } else {
                    geolocationOrigin = origin
                    geolocationCallback = callback
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                return try {
                    val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf", "image/jpeg", "image/png"))
                    }
                    fileChooserLauncher.launch(intent)
                    true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    false
                }
            }
        }

        // Handle PDF & Official Certificate Downloads (both HTTPS URLs and Base64 Data URLs)
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
            downloadDocumentSafely(url, fileName, userAgent, mimeType)
        }
    }

    private fun downloadDocumentSafely(
        url: String,
        fileName: String,
        userAgent: String = "NautiyalCyberCafeAndroid/2.0",
        mimeType: String = "application/pdf"
    ) {
        try {
            if (url.startsWith("data:")) {
                val base64Part = url.substringAfter("base64,", "")
                if (base64Part.isNotEmpty()) {
                    val bytes = Base64.decode(base64Part, Base64.DEFAULT)
                    val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    val outFile = File(downloadsDir, fileName.ifBlank { "Nautiyal_Certificate_${System.currentTimeMillis()}.pdf" })
                    FileOutputStream(outFile).use { it.write(bytes) }
                    Toast.makeText(applicationContext, "Saved to Downloads: ${outFile.name}", Toast.LENGTH_LONG).show()
                    return
                }
            }

            val request = DownloadManager.Request(Uri.parse(url))
            request.setMimeType(mimeType)
            val cookies = CookieManager.getInstance().getCookie(url)
            if (!cookies.isNullOrBlank()) {
                request.addRequestHeader("cookie", cookies)
            }
            request.addRequestHeader("User-Agent", userAgent)
            request.setDescription("Downloading official document from Nautiyal Cyber Cafe...")
            request.setTitle(fileName)
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(applicationContext, "Downloading $fileName...", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            runCatching {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            }
        }
    }
}
