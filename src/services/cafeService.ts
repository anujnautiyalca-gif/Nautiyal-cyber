import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  ServiceItem,
  ApplicationRecord,
  ApplicationMessage,
  AnnouncementItem,
  CafeConfig,
  UserProfile,
  AdminProfile,
  CompletedDocument,
} from '../types';
import { INITIAL_SERVICES, DEFAULT_CAFE_CONFIG } from '../data/initialData';

// ----------------- SERVICES CATALOG -----------------

export async function fetchServices(): Promise<ServiceItem[]> {
  const path = 'services';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // Seed default services
      const seeded: ServiceItem[] = [];
      for (const s of INITIAL_SERVICES) {
        const newDoc = doc(collection(db, path));
        const item: ServiceItem = {
          ...s,
          id: newDoc.id,
        };
        try {
          await setDoc(newDoc, item);
          seeded.push(item);
        } catch {
          // If unauthenticated yet, return local array
          seeded.push({ ...s, id: `seed_${Math.random().toString(36).substring(2, 7)}` });
        }
      }
      return seeded;
    }
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ServiceItem));
  } catch (error) {
    console.warn('Fallback to local service catalog if unauthenticated or network:', error);
    return INITIAL_SERVICES.map((s, idx) => ({ ...s, id: `init_${idx}` }));
  }
}

export function subscribeToServices(
  onUpdate: (services: ServiceItem[]) => void,
  onNewServicePublished?: (newService: ServiceItem) => void
): Unsubscribe {
  const path = 'services';
  let isInitialLoad = true;

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty && isInitialLoad) {
        fetchServices().then(onUpdate);
        isInitialLoad = false;
        return;
      }

      if (!isInitialLoad && onNewServicePublished) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const addedService = { ...change.doc.data(), id: change.doc.id } as ServiceItem;
            if (addedService.active) {
              onNewServicePublished(addedService);
            }
          }
        });
      }

      const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ServiceItem));
      onUpdate(items);
      isInitialLoad = false;
    },
    (error) => {
      console.warn('Services real-time sync notice:', error);
    }
  );
}

export async function addService(
  data: Omit<ServiceItem, 'id'>,
  notifyCustomers: boolean = true
): Promise<string> {
  const path = 'services';
  try {
    const docRef = doc(collection(db, path));
    const now = new Date().toISOString();
    const serviceItem: ServiceItem = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, serviceItem);

    // Automatically broadcast a real-time notification to all registered Android, tablet & web customers
    if (notifyCustomers && data.active) {
      try {
        const annRef = doc(collection(db, 'announcements'));
        const announcement: AnnouncementItem = {
          id: annRef.id,
          title: `New Service Available: ${serviceItem.name}`,
          content: `${serviceItem.description || 'A new service has been launched at Nautiyal Cyber Cafe.'}\nFee: ₹${serviceItem.fee} • Processing Time: ${serviceItem.processingTime || '2-3 Days'}`,
          category: 'New Service Launch',
          actionUrl: serviceItem.id,
          sentBy: auth.currentUser?.uid || 'admin',
          senderName: auth.currentUser?.displayName || auth.currentUser?.email || 'Nautiyal Cyber Cafe Admin',
          createdAt: now,
        };
        await setDoc(annRef, announcement);
      } catch (annErr) {
        console.warn('Auto announcement notice:', annErr);
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateService(id: string, updates: Partial<ServiceItem>): Promise<void> {
  const path = `services/${id}`;
  try {
    await updateDoc(doc(db, 'services', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteService(id: string): Promise<void> {
  const path = `services/${id}`;
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------- CAFE CONFIG -----------------

export async function fetchCafeConfig(): Promise<CafeConfig> {
  try {
    const snap = await getDoc(doc(db, 'cafeConfig', 'general'));
    if (snap.exists()) {
      const data = snap.data() as CafeConfig;
      if (data.phone === '+91 98765 43210' || data.address?.includes('Dehradun')) {
        const updated: CafeConfig = {
          ...data,
          phone: DEFAULT_CAFE_CONFIG.phone,
          alternatePhone: DEFAULT_CAFE_CONFIG.alternatePhone,
          email: DEFAULT_CAFE_CONFIG.email,
          address: DEFAULT_CAFE_CONFIG.address,
        };
        try {
          await setDoc(doc(db, 'cafeConfig', 'general'), updated, { merge: true });
        } catch {
          // ignore if unauthenticated guest
        }
        return updated;
      }
      return data;
    } else {
      try {
        await setDoc(doc(db, 'cafeConfig', 'general'), DEFAULT_CAFE_CONFIG);
      } catch {
        // quiet fallback
      }
      return DEFAULT_CAFE_CONFIG;
    }
  } catch {
    return DEFAULT_CAFE_CONFIG;
  }
}

export function subscribeToCafeConfig(onUpdate: (config: CafeConfig) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'cafeConfig', 'general'),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CafeConfig);
      } else {
        onUpdate(DEFAULT_CAFE_CONFIG);
      }
    },
    () => {
      onUpdate(DEFAULT_CAFE_CONFIG);
    }
  );
}

export async function updateCafeConfig(config: Partial<CafeConfig>, adminUid: string): Promise<void> {
  const path = 'cafeConfig/general';
  try {
    await setDoc(
      doc(db, 'cafeConfig', 'general'),
      {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUid,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------- APPLICATIONS -----------------

export async function submitApplication(
  appRecord: Omit<ApplicationRecord, 'id'>
): Promise<ApplicationRecord> {
  const path = 'applications';
  try {
    const docRef = doc(collection(db, path));
    const fullRecord: ApplicationRecord = {
      ...appRecord,
      id: docRef.id,
    };
    await setDoc(docRef, fullRecord);
    return fullRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchCustomerApplications(customerId: string): Promise<ApplicationRecord[]> {
  const path = 'applications';
  try {
    const q = query(
      collection(db, path),
      where('customerId', '==', customerId)
    );
    const snap = await getDocs(q);
    const records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationRecord));
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToCustomerApplications(
  customerId: string,
  onUpdate: (applications: ApplicationRecord[]) => void,
  onStatusChanged?: (updatedApp: ApplicationRecord) => void
): Unsubscribe {
  const q = query(collection(db, 'applications'), where('customerId', '==', customerId));
  let isInitialLoad = true;
  const previousStatusMap = new Map<string, string>();

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => ({ ...d.data(), id: d.id } as ApplicationRecord))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (!isInitialLoad && onStatusChanged) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const modifiedApp = { ...change.doc.data(), id: change.doc.id } as ApplicationRecord;
            const prevState = previousStatusMap.get(modifiedApp.id);
            const currState = `${modifiedApp.status}|${modifiedApp.paymentStatus}|${modifiedApp.completedDocuments?.length || 0}`;
            if (prevState && prevState !== currState) {
              onStatusChanged(modifiedApp);
            }
          }
        });
      }

      records.forEach((r) => {
        previousStatusMap.set(
          r.id,
          `${r.status}|${r.paymentStatus}|${r.completedDocuments?.length || 0}`
        );
      });

      onUpdate(records);
      isInitialLoad = false;
    },
    (error) => {
      console.warn('Customer applications real-time sync notice:', error);
    }
  );
}

export async function fetchAllApplications(): Promise<ApplicationRecord[]> {
  const path = 'applications';
  try {
    const snap = await getDocs(collection(db, path));
    const records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationRecord));
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToAllApplications(
  onUpdate: (applications: ApplicationRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'applications'),
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => ({ ...d.data(), id: d.id } as ApplicationRecord))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(records);
    },
    (error) => {
      console.warn('Admin applications real-time sync notice:', error);
    }
  );
}

export async function updateApplicationStatus(
  appId: string,
  status: ApplicationRecord['status'],
  adminNotes?: string
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    const updates: Partial<ApplicationRecord> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, 'applications', appId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function attachCompletedDocument(
  appId: string,
  completedDoc: CompletedDocument,
  existingCompleted: CompletedDocument[]
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    const updatedDocs = [...existingCompleted, completedDoc];
    await updateDoc(doc(db, 'applications', appId), {
      completedDocuments: updatedDocs,
      status: 'Completed',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitPaymentProof(
  appId: string,
  upiRef: string,
  screenshotUrl: string
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    await updateDoc(doc(db, 'applications', appId), {
      paymentStatus: 'pending_verification',
      paymentUpiRef: upiRef,
      paymentScreenshotUrl: screenshotUrl,
      paymentTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function verifyPayment(
  appId: string,
  status: 'verified' | 'rejected',
  adminUid: string,
  adminName: string
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    await updateDoc(doc(db, 'applications', appId), {
      paymentStatus: status,
      verifiedByAdminUid: adminUid,
      verifiedByAdminName: adminName,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------- MESSAGING -----------------

export async function sendApplicationMessage(
  appId: string,
  messageData: Omit<ApplicationMessage, 'id'>
): Promise<void> {
  const path = `applications/${appId}/messages`;
  try {
    const docRef = doc(collection(db, 'applications', appId, 'messages'));
    await setDoc(docRef, {
      ...messageData,
      id: docRef.id,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToMessages(
  appId: string,
  onUpdate: (messages: ApplicationMessage[]) => void,
  onError?: (err: unknown) => void
) {
  const subCollection = collection(db, 'applications', appId, 'messages');
  const q = query(subCollection, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ApplicationMessage));
      onUpdate(messages);
    },
    (error) => {
      console.warn('Messages snapshot listener notice:', error);
      if (onError) onError(error);
    }
  );
}

// ----------------- ANNOUNCEMENTS -----------------

export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const path = 'announcements';
  try {
    const snap = await getDocs(collection(db, path));
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AnnouncementItem));
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function subscribeToAnnouncements(
  onUpdate: (announcements: AnnouncementItem[]) => void,
  onNewAnnouncement?: (announcement: AnnouncementItem) => void
): Unsubscribe {
  let isInitialLoad = true;
  return onSnapshot(
    collection(db, 'announcements'),
    (snapshot) => {
      if (!isInitialLoad && onNewAnnouncement) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const added = { ...change.doc.data(), id: change.doc.id } as AnnouncementItem;
            onNewAnnouncement(added);
          }
        });
      }
      const items = snapshot.docs
        .map((d) => ({ ...d.data(), id: d.id } as AnnouncementItem))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
      isInitialLoad = false;
    },
    (error) => {
      console.warn('Announcements real-time sync notice:', error);
    }
  );
}

export async function createAnnouncement(data: Omit<AnnouncementItem, 'id'>): Promise<string> {
  const path = 'announcements';
  try {
    const docRef = doc(collection(db, path));
    const item: AnnouncementItem = {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, item);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ----------------- CUSTOMER MANAGEMENT -----------------

export async function fetchRegisteredCustomers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => u.role === 'customer' || !u.role);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToRegisteredCustomers(
  onUpdate: (customers: UserProfile[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => d.data() as UserProfile)
        .filter((u) => u.role === 'customer' || !u.role);
      onUpdate(list);
    },
    (error) => {
      console.warn('Customer list real-time sync notice:', error);
    }
  );
}

export async function toggleCustomerDisabled(userId: string, disabled: boolean): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      disabled,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomerSafely(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    // Retain audit application records by marking user archived
    await updateDoc(doc(db, 'users', userId), {
      disabled: true,
      archivedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------- ADMIN MANAGEMENT (MAIN ADMIN ONLY) -----------------

export async function fetchAdmins(): Promise<AdminProfile[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as AdminProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createOrUpdateAdmin(adminData: AdminProfile): Promise<void> {
  const path = `admins/${adminData.uid}`;
  try {
    await setDoc(doc(db, 'admins', adminData.uid), adminData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleAdminStatus(adminUid: string, active: boolean): Promise<void> {
  const path = `admins/${adminUid}`;
  try {
    await updateDoc(doc(db, 'admins', adminUid), {
      active,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
