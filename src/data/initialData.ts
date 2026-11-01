import { ServiceItem, CafeConfig } from '../types';

export const DEFAULT_CAFE_CONFIG: CafeConfig = {
  cafeName: 'Nautiyal Cyber Cafe',
  tagline: 'If there is no struggle, there is no progress',
  upiId: 'anujnautiyal.ca@oksbi',
  upiName: 'Nautiyal Cyber Cafe / Anuj Nautiyal',
  upiQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=anujnautiyal.ca@oksbi&pn=Nautiyal%20Cyber%20Cafe&cu=INR',
  phone: '7982568459',
  alternatePhone: '8077351849',
  email: 'nautiyalcc@gmail.com',
  address: 'New Market Thatyur, Jaunpur, Tehri Garhwal, Uttarakhand - 249180',
  workingHours: 'Monday - Saturday: 8:30 AM - 9:00 PM | Sunday: 9:30 AM - 3:00 PM',
  bannerNotice: '⚡ All Government Sarkari Forms, PAN Card, Passport Seva & Document Color Scanning/Printing Open Today!',
};

export const INITIAL_SERVICES: Omit<ServiceItem, 'id'>[] = [
  {
    name: 'New PAN Card Application (Form 49A)',
    category: 'Govt Identity',
    description: 'Instant online application for New PAN Card with digital e-PAN delivery within 3 days and physical card delivered to home address.',
    requiredDocuments: [
      'Aadhaar Card (Front & Back)',
      'Passport Size Photograph (Recent)',
      'Specimen Signature on White Paper',
      'Mobile Number linked with Aadhaar (Optional for e-KYC)'
    ],
    fee: 150,
    active: true,
    isPopular: true,
    instructions: 'Upload clear scans or high quality camera photos of your Aadhaar card and signature. We will file your 49A form and provide you the UTIITSL/NSDL acknowledgement slip.',
    processingTime: '2-3 Business Days for e-PAN',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'PAN Card Correction / Duplicate Re-print',
    category: 'Govt Identity',
    description: 'Correct name spelling, father name, date of birth, photo or re-order a lost/broken physical PAN card.',
    requiredDocuments: [
      'Existing PAN Card Copy or PAN Number',
      'Aadhaar Card with correct details',
      'Proof of Correction (10th Marksheet or Gazette)',
      'Passport Size Photo & Signature'
    ],
    fee: 170,
    active: true,
    isPopular: false,
    instructions: 'Please highlight which specific field needs rectification (e.g. DOB or Surname).',
    processingTime: '5-7 Business Days',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Income Certificate (आय प्रमाण पत्र)',
    category: 'Certificates & Revenue',
    description: 'Official revenue department income certificate required for college scholarships, fee waivers, and government welfare schemes.',
    requiredDocuments: [
      'Aadhaar Card of Applicant & Family Head',
      'Ration Card / Parivar Register Nakal',
      'Salary Slip / ITR / Self-Income Affidavit',
      'Electricity Bill or House Tax Receipt',
      'Passport Size Photograph'
    ],
    fee: 120,
    active: true,
    isPopular: true,
    instructions: 'Certificates are issued through the state e-District portal. We will process and upload the Patwari verification report.',
    processingTime: '4-7 Working Days',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Caste & Domicile Certificate (जाति व निवास प्रमाण पत्र)',
    category: 'Certificates & Revenue',
    description: 'State government verified Permanent Resident (Mool Niwas) or SC/ST/OBC Certificate.',
    requiredDocuments: [
      'Applicant Aadhaar Card',
      'Father Aadhaar Card & Land Registry/Electricity Bill (10+ years)',
      'Old Caste Certificate of Father/Brother (if applying for Caste)',
      '10th Class Marksheet or School Transfer Certificate',
      'Passport Size Photo'
    ],
    fee: 140,
    active: true,
    isPopular: false,
    instructions: 'Ensure the address on your electricity bill or registry matches the applied address.',
    processingTime: '7-10 Working Days',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Passport Seva Online Application & Appointment',
    category: 'Travel & Identity',
    description: 'Complete Fresh or Renewal Passport application, online government fee payment, and appointment slot booking at your nearest PSK/POPSK.',
    requiredDocuments: [
      'Aadhaar Card',
      'PAN Card or Voter ID',
      '10th Marksheet / Higher Education Degree (for Non-ECR status)',
      'Bank Passbook with Photo (Last 1 year statement)'
    ],
    fee: 350,
    active: true,
    isPopular: true,
    instructions: 'Govt passport fee (₹1500 for normal 36 pages) is payable via UPI in addition to cyber cafe filing fee. We will book your preferred time slot.',
    processingTime: 'Slot booked within 24 Hours',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Driving License - Learner Slot & LL Test Form',
    category: 'Transport & RTO',
    description: 'Online application on Sarathi Parivahan for Two Wheeler / Four Wheeler Learner License, fee payment and test slot reservation.',
    requiredDocuments: [
      'Aadhaar Card (Linked with Mobile)',
      'Age Proof (10th Certificate or Birth Certificate)',
      'Passport Size Photo & Specimen Signature',
      'Medical Fitness Self Declaration Form 1'
    ],
    fee: 250,
    active: true,
    isPopular: false,
    instructions: 'If Aadhaar authenticated, online learner test can be given directly from your computer or phone.',
    processingTime: 'Same Day Processing',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Sarkari Job / Exam Form Filling & Admit Card',
    category: 'Education & Jobs',
    description: 'Flawless error-free form filling for SSC, UPSC, Railway (RRB), Banking (IBPS), State Police, Teaching (TET) and University admissions.',
    requiredDocuments: [
      'Educational Certificates (10th, 12th, Graduation)',
      'Recent Passport Photo with name & date if required',
      'Scanned Signature & Left Thumb Impression',
      'Category Certificate (EWS/OBC/SC/ST) if applicable'
    ],
    fee: 100,
    active: true,
    isPopular: true,
    instructions: 'Mention the exact advertisement/post name. We verify photo dimensions, signature DPI, and upload confirmations.',
    processingTime: 'Same Day (Within 4 Hours)',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Voter ID Online Registration / E-EPIC Download',
    category: 'Govt Identity',
    description: 'Form 6 for New Voter ID card registration on the Election Commission (NVSP) portal or digital E-EPIC card download.',
    requiredDocuments: [
      'Aadhaar Card',
      'Passport Size Photo',
      'Age Proof & Address Proof',
      'Family Member Voter ID Card (Epic No.) for reference'
    ],
    fee: 80,
    active: true,
    isPopular: false,
    instructions: 'New Voter cards are delivered via Speed Post free of charge by the Election Commission once approved.',
    processingTime: '2-4 Weeks for physical card',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'Electricity / Water / Municipal Tax Payment & Fastag',
    category: 'Utility & Banking',
    description: 'Instant utility bill clearance with instant computer generated receipt and Fastag recharge.',
    requiredDocuments: [
      'Electricity Bill / Consumer Account Number (CA No)',
      'Mobile Number for SMS receipt'
    ],
    fee: 30,
    active: true,
    isPopular: false,
    instructions: 'Avoid late fines. We provide immediate computerized stamped receipt.',
    processingTime: 'Instant (15 Minutes)',
    createdAt: '2026-10-31T00:00:00.000Z',
  },
  {
    name: 'High-Res Color Document Scanning, PDF & Lamination',
    category: 'Print & Scan',
    description: 'Professional high-DPI document digitization, multi-page PDF compilation, and PVC / waterproof thermal lamination.',
    requiredDocuments: [
      'Original Documents for scanning or PDF sent via WhatsApp'
    ],
    fee: 40,
    active: true,
    isPopular: false,
    instructions: 'Bring your physical copies or upload drafts to convert into official compliant sizes (under 200KB / 500KB).',
    processingTime: 'Instant Delivery',
    createdAt: '2026-10-31T00:00:00.000Z',
  }
];
