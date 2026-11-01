package com.nautiyalcybercafe.app

import android.Manifest
import android.content.pm.PackageManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import org.json.JSONObject

/**
 * Native Android Biometric & Fingerprint Authentication Module
 * Supports BiometricPrompt (Android 11 - 16 / API 30 - 36) and FingerprintManager fallback.
 */
class BiometricBridge(
    private val activity: FragmentActivity,
    private val webView: WebView? = null
) {

    @JavascriptInterface
    fun isBiometricAvailable(): String {
        val biometricManager = BiometricManager.from(activity)
        val canAuth = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        val hasFingerprintPermission = ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.USE_BIOMETRIC
        ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.USE_FINGERPRINT
        ) == PackageManager.PERMISSION_GRANTED

        val result = JSONObject()
        result.put("available", canAuth == BiometricManager.BIOMETRIC_SUCCESS)
        result.put("permissionGranted", hasFingerprintPermission)
        result.put("statusCode", canAuth)
        return result.toString()
    }

    @JavascriptInterface
    fun authenticateWithBiometricPrompt(title: String, subtitle: String) {
        activity.runOnUiThread {
            val executor = ContextCompat.getMainExecutor(activity)
            val biometricPrompt = BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        notifyWebView(false, errString.toString())
                    }

                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(result)
                        notifyWebView(true, "BiometricPrompt authentication succeeded")
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        notifyWebView(false, "Fingerprint not recognized. Please try again.")
                    }
                }
            )

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText("Use Password")
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.BIOMETRIC_WEAK
                )
                .build()

            biometricPrompt.authenticate(promptInfo)
        }
    }

    private fun notifyWebView(success: Boolean, message: String) {
        activity.runOnUiThread {
            val escapedMsg = message.replace("'", "\\'")
            val js = "window.dispatchEvent(new CustomEvent('androidBiometricResult', { detail: { success: $success, message: '$escapedMsg' } }));"
            webView?.evaluateJavascript(js, null)
        }
    }
}
