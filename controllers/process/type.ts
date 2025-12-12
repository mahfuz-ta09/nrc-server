// IMPROVED SCHEMA - Add these fields to your existing structure

export interface ApplicationSchema {
    permission: {
        permission_personalInfo: boolean;
        permission_englishProficiency: boolean;
        permission_prefferedUniSub: boolean;
        permission_studentsFile: boolean;
    };
  
    name: string;
    email: string;
    phone: string;
    alternativePhone?: string;
    dob: string;
    passportNo: string;
    currentAddress: string;
    countryCitizen: string;
    refusedCountry: string[];
    gender: string;
    maritalStatus: string;
  
    englishProficiency: any;
    academicInfo: any[];
    preferredUniversities: any[];
    files: {
        fileName: string;
        url: string;
        publicID: string;
        uploadedAt: string;
    }[];
    
    history: {
        comment: string;
        stage: string;
        by: { id: string; email: string; role: string };
        date: string;
    }[];
  
    communication: any[]; 
    
    applicationState: {
        personalInfo: { complete: boolean; verified: boolean };
        englishProficiency: { complete: boolean; verified: boolean };
        prefferedUniSub: { complete: boolean; verified: boolean };
        studentsFile: { complete: boolean; verified: boolean };
        applicationFinished: { finished: boolean; archived: boolean };
    };
  
    progress: {
        submitted: boolean;
        verified: boolean;
        underReview: boolean;
        offered: boolean;
        accepted: boolean;
        rejected: boolean;
    };
    
    referral: string;
    createdAt: string;
    lastUpdated: string;

  // ========== CRITICAL MISSING FIELDS - ADD THESE ==========
  
  /**
   * UNIVERSITY APPLICATIONS - This is the MOST IMPORTANT addition
   * Replace your simple preferredUniversities array with detailed tracking
   */
    universityApplications: {
        universityId: string;
        universityName: string;
        program: string;
        intake: string; // e.g., "Fall 2025", "Spring 2025"
        
        // Submission Configuration
        submissionMethod: 'api' | 'manual' | 'email' | 'courier';
        
        // API Integration (if submissionMethod === 'api')
        apiIntegration?: {
            enabled: boolean;
            universityApiEndpoint: string;
            lastSyncedAt?: string;
            autoSubmitEnabled: boolean;
            apiStatus: 'connected' | 'disconnected' | 'error';
            errorMessage?: string;
        };
        
        // Manual Submission (if submissionMethod === 'manual')
        manualSubmission?: {
            portalUrl: string;
            hasCredentials: boolean; // Don't store actual credentials in student file
            credentialsId?: string; // Reference to encrypted credentials collection
            submissionSteps: string[]; // e.g., ["Login to portal", "Upload documents", "Fill form"]
            lastPortalCheckAt?: string;
        };
        
        // Email Submission (if submissionMethod === 'email')
        emailSubmission?: {
            recipientEmail: string;
            ccEmails?: string[];
            emailTemplate: string;
            attachmentRequired: boolean;
            sentAt?: string;
            emailId?: string; // Track sent email
        };
    
    // Application Status & Tracking
    status: {
      current: 'draft' | 'ready' | 'submitted' | 'under_review' | 'awaiting_documents' | 
               'interview_scheduled' | 'offered' | 'accepted' | 'rejected' | 'waitlisted';
      
      // Detailed tracking
      submittedAt?: string;
      acknowledgedAt?: string; // When university confirmed receipt
      lastStatusCheck: string;
      responseDeadline?: string;
      
      // Final outcome
      finalDecision?: 'accepted' | 'rejected' | 'waitlisted';
      decisionDate?: string;
      decisionNotes?: string;
    };
    
    // University Reference Numbers
    references: {
      applicationId?: string; // University's application ID
      referenceNumber?: string; // Any reference number from university
      trackingUrl?: string; // URL to track application on university portal
    };
    
    // Documents submitted to THIS university
    submittedDocuments: {
      documentId: string; // Reference to files array
      fileName: string;
      submittedAt: string;
      versionNumber: number;
      verifiedByUniversity: boolean;
      verificationDate?: string;
    }[];
    
    // University-Specific Requirements
    requirements: {
      minimumGPA?: number;
      englishTestRequired: boolean;
      additionalDocuments?: string[];
      interviewRequired?: boolean;
      applicationFee?: number;
      feePaid?: boolean;
      feePaymentDate?: string;
      feeReceiptUrl?: string;
    };
    
    // Admin Assignment & Collaboration
    assignedTo?: {
      adminId: string;
      adminName: string;
      assignedAt: string;
    };
    
    // Notes specific to this university application
    notes: {
      noteId: string;
      adminId: string;
      adminName: string;
      text: string;
      type: 'info' | 'action_required' | 'warning' | 'success';
      createdAt: string;
      isResolved?: boolean;
      mentionedAdmins?: string[]; // Admin IDs who should be notified
    }[];
    
    // Reminders & Follow-ups
    reminders: {
      reminderId: string;
      type: 'follow_up' | 'deadline' | 'status_check' | 'document_request';
      scheduledFor: string;
      completed: boolean;
      completedAt?: string;
      message: string;
    }[];
    
    // Timeline for this specific university
    timeline: {
      action: string;
      performedBy: { adminId: string; adminName: string };
      timestamp: string;
      details?: any;
    }[];
    
    // Priority & Preferences
    priority: 1 | 2 | 3 | 4 | 5; // Student's preference (1 = top choice)
    isPriority: boolean; // Agency marked as priority for quick processing
    
    createdAt: string;
    updatedAt: string;
  }[];

  /**
   * ADMIN COLLABORATION - Global notes across all applications
   */
  adminNotes: {
    noteId: string;
    adminId: string;
    adminName: string;
    text: string;
    type: 'general' | 'urgent' | 'follow_up' | 'student_request';
    createdAt: string;
    isResolved: boolean;
    resolvedAt?: string;
    resolvedBy?: string;
    mentionedAdmins?: string[]; // For @mentions
    attachments?: {
      fileUrl: string;
      fileName: string;
    }[];
  }[];

  /**
   * COMMUNICATION TRACKING - Structure your communication array
   */
  communications: {
    communicationId: string;
    type: 'email' | 'phone' | 'sms' | 'whatsapp' | 'meeting';
    direction: 'incoming' | 'outgoing';
    
    // Participants
    from: {
      type: 'admin' | 'student' | 'university' | 'other';
      name: string;
      contact: string;
    };
    to: {
      type: 'admin' | 'student' | 'university' | 'other';
      name: string;
      contact: string;
    }[];
    
    subject?: string;
    message: string;
    
    // Related to specific university?
    relatedUniversityId?: string;
    
    // Attachments
    attachments?: {
      fileName: string;
      fileUrl: string;
    }[];
    
    // Status
    status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
    
    timestamp: string;
    recordedBy: {
      adminId: string;
      adminName: string;
    };
  }[];

  /**
   * TASK MANAGEMENT - Track todos for admins
   */
  tasks: {
    taskId: string;
    title: string;
    description: string;
    type: 'submission' | 'follow_up' | 'document_collection' | 'verification' | 'other';
    
    assignedTo: {
      adminId: string;
      adminName: string;
    };
    
    assignedBy: {
      adminId: string;
      adminName: string;
    };
    
    relatedUniversityId?: string; // If task is for specific university
    
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    
    dueDate?: string;
    completedAt?: string;
    
    createdAt: string;
    updatedAt: string;
  }[];

  /**
   * AUTOMATED ALERTS - System-generated reminders
   */
  alerts: {
    alertId: string;
    type: 'deadline_approaching' | 'no_response' | 'document_expiry' | 'action_required';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    
    relatedUniversityId?: string;
    
    triggered: boolean;
    triggeredAt?: string;
    dismissed: boolean;
    dismissedBy?: string;
    dismissedAt?: string;
    
    createdAt: string;
  }[];

  /**
   * DOCUMENT VERSIONS - Track file updates
   */
  documentVersions: {
    documentName: string; // e.g., "Passport", "Transcript"
    versions: {
      versionNumber: number;
      fileId: string; // Reference to files array
      uploadedAt: string;
      uploadedBy: {
        id: string;
        name: string;
        role: string;
      };
      status: 'current' | 'superseded' | 'rejected';
      rejectionReason?: string;
    }[];
  }[];

  /**
   * PAYMENT TRACKING - Application fees, deposits, etc.
   */
  payments: {
    paymentId: string;
    type: 'application_fee' | 'tuition_deposit' | 'service_fee' | 'other';
    
    relatedUniversityId?: string; // If payment is for specific university
    
    amount: number;
    currency: string;
    
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    paidAt?: string;
    
    paymentMethod?: string;
    transactionId?: string;
    receiptUrl?: string;
    
    notes?: string;
    
    createdAt: string;
  }[];

  /**
   * METADATA - Additional tracking
   */
  metadata: {
    assignedCounselor?: {
      id: string;
      name: string;
      email: string;
    };
    
    studentSource: 'website' | 'referral' | 'agent' | 'social_media' | 'other';
    studentTags?: string[]; // e.g., ["high_priority", "scholarship_applicant"]
    
    estimatedProcessingTime?: number; // in days
    actualProcessingTime?: number; // in days
    
    lastLoginAt?: string;
    totalLogins?: number;
    
    // Analytics
    viewCount?: number;
    lastViewedBy?: {
      adminId: string;
      adminName: string;
      viewedAt: string;
    };
  };
}
