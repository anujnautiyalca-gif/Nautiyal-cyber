# Nautiyal Cyber Cafe — Complete Web & Native Android (APK / AAB) Build & Release Guide

Welcome to the official architecture, security, build, and release manual for **Nautiyal Cyber Cafe** (`com.nautiyalcybercafe.app`).

- **Shop Name**: Nautiyal Cyber Cafe
- **Owner / Main Admin**: `Anujnautiyal.ca@gmail.com`
- **Contact Numbers**: `7982568459` | WhatsApp: `8077351849`
- **Official Email**: `nautiyalcc@gmail.com`
- **Address**: New Market Thatyur, Jaunpur, Tehri Garhwal, Uttarakhand — 249180

---

## 1. Unified Architecture Overview (Web + Native Android Kotlin/Jetpack Compose)

Both the responsive Web Application (`src/`) and the Native Android Application (`android/`) share the **exact same backend and database** (`horizontal-bit-cbcxw` / Cloud Firestore database `ai-studio-f514ef87-d1c4-4c44-ac86-43d44e5ed926`):

1. **Shared Authentication & RBAC**:
   - **Customer Login & Registration**: Email/Password, Google Sign-In, and Native Android `BiometricPrompt` / `FingerprintManager` authentication.
   - **Separate Admin Login**: Role-verified against `/admins/{uid}` and owner email `Anujnautiyal.ca@gmail.com`.
2. **Real-Time Multi-Device Synchronization**:
   - Uses Firestore `onSnapshot` listeners across Android phones, tablets, and desktop browsers so services, applications, document attachments, payment verifications, chat messages, and announcements stay synchronized in real time.
3. **Firebase Cloud Messaging (FCM) & Live Service Launch Alerts**:
   - Integrated via `NautiyalMessagingService.kt` on Android and `src/services/fcmService.ts` + `public/firebase-messaging-sw.js` on Web.
   - Android devices automatically subscribe to the `new_services` and `announcements` topics.
   - When an Admin publishes a new service, all registered customers immediately receive a native notification **without needing to reinstall or update the APK**.
4. **Backend Security & Document Privacy (`firestore.rules`)**:
   - Default-deny security rules enforce authentication and role authorization on the backend.
   - Customer documents (`submittedDocuments` and `completedDocuments`) inside `/applications/{applicationId}` are strictly isolated so only the owning customer (`resource.data.customerId == request.auth.uid`) or a verified Admin (`isAdmin()`) can read or list them.
   - Zero private server credentials or service account keys are stored inside the web or Android application.

---

## 2. How to Generate a Release Signing Keystore & Signed Release APK

### Step 1: Generate Your Private Upload/Release Keystore
Run the following command once on your machine (outside the git repository or in `android/` — never commit `.jks` files):

```bash
keytool -genkeypair -v \
  -keystore android/release-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias nautiyal_cyber_cafe
```

### Step 2: Configure `android/keystore.properties`
Copy `android/keystore.properties.example` to `android/keystore.properties` (which is ignored by git):

```properties
storeFile=release-keystore.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=nautiyal_cyber_cafe
keyPassword=YOUR_KEY_PASSWORD
```

*(Alternatively, pass `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD` as environment variables in CI/CD).*

### Step 3: Build the Signed Release APK
From the project root:

```bash
npm install
npm run build
cd android
./gradlew assembleRelease
```

- **Signed Release APK output path**:
  `android/app/build/outputs/apk/release/app-release.apk`
- **Debug APK output path** (for quick USB phone testing via `./gradlew assembleDebug`):
  `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 3. How to Generate an Android App Bundle (AAB) for Google Play Console

Google Play requires an **Android App Bundle (`.aab`)** so Play Store can deliver optimized split APKs by screen density, CPU architecture (ABI), and language for low-end and high-end Android devices.

1. Ensure `android/keystore.properties` is configured with your upload keystore.
2. Run the Gradle bundle command:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
3. Locate the signed `.aab` bundle at:
   `android/app/build/outputs/bundle/release/app-release.aab`
4. Upload to Google Play Console:
   - Sign in to [Google Play Console](https://play.google.com/console).
   - Create/select **Nautiyal Cyber Cafe** (`com.nautiyalcybercafe.app`).
   - Navigate to **Test and release** → **Production** (or **Internal testing**) → **Create new release**.
   - Upload `app-release.aab`, enable **Play App Signing**, add release notes, and roll out.

---

## 4. Pre-Release Android Verification Checklist

1. **Customer Registration & Separate Customer/Admin Login**:
   - Register a new customer account and verify `/users/{uid}` is created with `role: "customer"`.
   - Switch to the **Admin Login** tab and verify non-admin accounts are rejected while `Anujnautiyal.ca@gmail.com` or active `/admins/{uid}` accounts open the Admin Dashboard.
2. **Real-Time Service Publish Notification (Zero APK Update Required)**:
   - Log in as Admin on desktop or tablet and publish a new service in **Manage Services**.
   - Verify that a logged-in customer on Android immediately receives a push notification (`New Service Available: ...`) and sees the new service in their catalogue in real time without updating the APK.
3. **Service Application, Document Upload & Private Completed Document Download**:
   - Apply for a service on Android and attach a PDF/JPG document.
   - Log in as Admin, upload the completed official PDF certificate, and mark the application `Completed`.
   - Verify the customer receives an instant notification and can download the completed PDF into their Android `Downloads` folder.
4. **UPI Payment & Screenshot Upload**:
   - Open an unpaid application, tap **Pay via UPI** or scan the cafe QR (`anujnautiyal.ca@oksbi`), enter the 12-digit UTR number, and upload the payment screenshot.
   - Verify Admin can audit and mark the payment `verified` in real time.
5. **Real-Time Messaging & Multi-Screen / Low-End Device Optimization**:
   - Send messages between Customer and Admin inside an application's chat room and confirm instant delivery across Android phone, tablet, and desktop.
