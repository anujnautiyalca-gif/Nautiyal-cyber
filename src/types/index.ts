export type UserRole = 'customer' | 'admin' | 'main_admin';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  disabled?: boolean;
  address?: string;
  biometricEnabled?: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
}

export type AdminPermission = 
  | 'manage_services'
  | 'manage_applications'
  | 'manage_payments'
  | 'manage_documents'
  | 'manage_announcements'
  | 'manage_users';

export interface AdminProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'main_admin';
  active: boolean;
  permissions: AdminPermission[];
  createdAt: string;
  createdBy?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  requiredDocuments: string[];
  fee: number;
  active: boolean;
  instructions: string;
  processingTime: string;
  createdAt: string;
  updatedAt?: string;
  isPopular?: boolean;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  dataUrl: string; // base64 / blob URL representation
  uploadedAt: string;
  fileSize?: number;
  uploadedBy?: string;
}

export interface CompletedDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
  adminUid: string;
  adminName: string;
}

export type ApplicationStatus = 
  | 'Pending'
  | 'Processing'
  | 'Documents Required'
  | 'Completed'
  | 'Rejected';

export type PaymentStatus = 
  | 'unpaid'
  | 'pending_verification'
  | 'verified'
  | 'rejected';

export interface ApplicationRecord {
  id: string;
  applicationId: string; // e.g. NC-2026-8491
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  status: ApplicationStatus;
  fee: number;
  paymentStatus: PaymentStatus;
  paymentScreenshotUrl?: string;
  paymentUpiRef?: string;
  paymentTimestamp?: string;
  verifiedByAdminUid?: string;
  verifiedByAdminName?: string;
  verifiedAt?: string;
  submittedDocuments: DocumentAttachment[];
  completedDocuments: CompletedDocument[];
  formData: Record<string, string>;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachments?: DocumentAttachment[];
  timestamp: string;
  read?: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  actionUrl?: string;
  sentBy: string;
  senderName: string;
  createdAt: string;
}

export interface CafeConfig {
  cafeName: string;
  tagline: string;
  upiId: string;
  upiName: string;
  upiQrUrl: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  workingHours: string;
  bannerNotice: string;
  updatedAt?: string;
  updatedBy?: string;
}
