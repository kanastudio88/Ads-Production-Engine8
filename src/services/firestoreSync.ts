import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  TeamMember,
  MemberJobMetrics,
  TrafficJob,
  DailyArchiveRecord,
  LayoutDocument,
  TeamChatMessage,
  SavedLink
} from '../types';
import { INITIAL_TEAM_MEMBERS, INITIAL_JOB_METRICS } from '../data/teamMembers';
import { INITIAL_TRAFFIC_JOBS } from '../data/sampleCopies';

/**
 * Initial standard production links stored in Firebase
 */
export const INITIAL_SAVED_LINKS: SavedLink[] = [
  {
    id: 'link-traffic-master',
    title: 'NSTP Master Traffic Control Spreadsheet',
    url: 'https://docs.google.com/spreadsheets/d/1Production-Hub-Job-Traffic-Control-2026/edit',
    category: 'Traffic Sheet',
    description: 'Borang traffic utama pengurusan iklan & notis mahkamah harian',
    addedBy: 'Alex Chen (DESK 01)',
    addedAt: '2026-09-29',
    isPinned: true
  },
  {
    id: 'link-ecourt',
    title: 'e-Kehakiman Portal Notis Mahkamah',
    url: 'https://ecourt.kehakiman.gov.my',
    category: 'Court / Gazette',
    description: 'Semakan rasmi no. kes guaman sivil dan status writ saman',
    addedBy: 'Sarah Jenkins (DESK 02)',
    addedAt: '2026-09-29',
    isPinned: true
  },
  {
    id: 'link-ssm',
    title: 'SSM e-Info & Winding-Up Register',
    url: 'https://www.ssm.com.my',
    category: 'Court / Gazette',
    description: 'Semakan status syarikat penggulungan & pelikuidasi',
    addedBy: 'Marcus Vance (DESK 03)',
    addedAt: '2026-09-29',
    isPinned: false
  },
  {
    id: 'link-myprocurement',
    title: 'MyPROCUREMENT Kerajaan Malaysia',
    url: 'https://myprocurement.treasury.gov.my',
    category: 'Court / Gazette',
    description: 'Portal kenyataan tender awam & perolehan kerajaan pusat',
    addedBy: 'Elena Rostova (DESK 04)',
    addedAt: '2026-09-29',
    isPinned: false
  },
  {
    id: 'link-artwork-drive',
    title: 'NSTP Prepress Google Drive Artwork Hub',
    url: 'https://drive.google.com',
    category: 'Google Drive',
    description: 'Folder artwork resolusi tinggi & fail proofing PDF/X-1a',
    addedBy: 'David Kim (DESK 05)',
    addedAt: '2026-09-29',
    isPinned: true
  }
];

// 1. Team Members & Registered User Profiles
export const subscribeTeamMembers = (onData: (members: TeamMember[]) => void) => {
  const colRef = collection(db, 'team_members');
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          for (const member of INITIAL_TEAM_MEMBERS) {
            batch.set(doc(db, 'team_members', member.id), member);
          }
          await batch.commit();
        } catch (e) {
          console.warn('[Studio8 Firestore] Error seeding team members:', e);
        }
        onData(INITIAL_TEAM_MEMBERS);
        return;
      }

      const list: TeamMember[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TeamMember);
      });
      list.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Team members listener fallback:', err);
    }
  );
};

export const syncTeamMember = async (member: TeamMember) => {
  try {
    await setDoc(doc(db, 'team_members', member.id), member, { merge: true });
    // Also mirror to users collection if applicable
    await setDoc(
      doc(db, 'users', member.id),
      {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        desk: member.desk,
        seatNumber: member.seatNumber,
        avatarColor: member.avatarColor
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to sync team member:', err);
  }
};

export const saveUserProfileToDb = async (member: TeamMember) => {
  try {
    await setDoc(doc(db, 'users', member.id), {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      desk: member.desk,
      seatNumber: member.seatNumber,
      avatarColor: member.avatarColor,
      createdAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'team_members', member.id), member, { merge: true });

    // Initialize metrics if not present
    const metricDoc = await getDoc(doc(db, 'job_metrics', member.id));
    if (!metricDoc.exists()) {
      await setDoc(doc(db, 'job_metrics', member.id), {
        userId: member.id,
        name: member.name,
        role: member.role,
        desk: member.desk,
        totalReceived: 0,
        nstCurrent: 0,
        nstAdvanced: 0,
        bhCurrent: 0,
        bhAdvanced: 0,
        hmCurrent: 0,
        hmAdvanced: 0
      });
    }
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to save user profile:', err);
  }
};

// 2. Saved Production Links in Firebase
export const subscribeSavedLinks = (onData: (links: SavedLink[]) => void) => {
  const colRef = collection(db, 'saved_links');
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          for (const lk of INITIAL_SAVED_LINKS) {
            batch.set(doc(db, 'saved_links', lk.id), lk);
          }
          await batch.commit();
        } catch (e) {
          console.warn('[Studio8 Firestore] Error seeding saved links:', e);
        }
        onData(INITIAL_SAVED_LINKS);
        return;
      }

      const list: SavedLink[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SavedLink);
      });
      // Pinned first, then title
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.title.localeCompare(b.title);
      });
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Saved links listener fallback:', err);
    }
  );
};

export const saveSavedLinkToDb = async (link: SavedLink) => {
  try {
    await setDoc(doc(db, 'saved_links', link.id), link, { merge: true });
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to save link:', err);
  }
};

export const deleteSavedLinkFromDb = async (linkId: string) => {
  try {
    await deleteDoc(doc(db, 'saved_links', linkId));
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to delete link:', err);
  }
};

// 3. Traffic Master Config (Stored in Firebase)
export const subscribeTrafficConfig = (onData: (url: string) => void) => {
  const docRef = doc(db, 'app_settings', 'traffic_config');
  return onSnapshot(
    docRef,
    async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.trafficSheetUrl) {
          onData(data.trafficSheetUrl);
        }
      } else {
        const defaultUrl = 'https://docs.google.com/spreadsheets/d/1Production-Hub-Job-Traffic-Control-2026/edit';
        try {
          await setDoc(docRef, {
            id: 'traffic_config',
            trafficSheetUrl: defaultUrl,
            updatedAt: Date.now(),
            updatedBy: 'System Init'
          });
        } catch (e) {
          // ignore
        }
        onData(defaultUrl);
      }
    },
    (err) => {
      console.warn('[Studio8 Firestore] Traffic config listener fallback:', err);
    }
  );
};

export const saveTrafficConfigToDb = async (url: string, updatedBy: string) => {
  try {
    await setDoc(
      doc(db, 'app_settings', 'traffic_config'),
      {
        id: 'traffic_config',
        trafficSheetUrl: url,
        updatedAt: Date.now(),
        updatedBy
      },
      { merge: true }
    );
    // Also update the master traffic link entry in saved_links
    await setDoc(
      doc(db, 'saved_links', 'link-traffic-master'),
      {
        id: 'link-traffic-master',
        title: 'NSTP Master Traffic Control Spreadsheet',
        url: url,
        category: 'Traffic Sheet',
        addedBy: updatedBy,
        addedAt: new Date().toISOString().split('T')[0],
        isPinned: true
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to save traffic config:', err);
  }
};

// 4. Job Metrics (Daily Summary)
export const subscribeJobMetrics = (onData: (metrics: MemberJobMetrics[]) => void) => {
  const colRef = collection(db, 'job_metrics');
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          for (const metric of INITIAL_JOB_METRICS) {
            batch.set(doc(db, 'job_metrics', metric.userId), metric);
          }
          await batch.commit();
        } catch (e) {
          console.warn('[Studio8 Firestore] Error seeding job metrics:', e);
        }
        onData(INITIAL_JOB_METRICS);
        return;
      }

      const list: MemberJobMetrics[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as MemberJobMetrics);
      });
      list.sort((a, b) => a.userId.localeCompare(b.userId));
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Job metrics listener fallback:', err);
    }
  );
};

export const syncJobMetrics = async (metrics: MemberJobMetrics[]) => {
  try {
    const batch = writeBatch(db);
    for (const m of metrics) {
      batch.set(doc(db, 'job_metrics', m.userId), m, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to sync job metrics:', err);
  }
};

// 5. Traffic Jobs
export const subscribeTrafficJobs = (onData: (jobs: TrafficJob[]) => void) => {
  const colRef = collection(db, 'traffic_jobs');
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          for (const job of INITIAL_TRAFFIC_JOBS) {
            batch.set(doc(db, 'traffic_jobs', job.id), job);
          }
          await batch.commit();
        } catch (e) {
          console.warn('[Studio8 Firestore] Error seeding traffic jobs:', e);
        }
        onData(INITIAL_TRAFFIC_JOBS);
        return;
      }

      const list: TrafficJob[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TrafficJob);
      });
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Traffic jobs listener fallback:', err);
    }
  );
};

export const saveTrafficJob = async (job: TrafficJob) => {
  try {
    await setDoc(doc(db, 'traffic_jobs', job.id), job);
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to save traffic job:', err);
  }
};

export const updateTrafficJobStatusInDb = async (jobId: string, status: TrafficJob['status']) => {
  try {
    await updateDoc(doc(db, 'traffic_jobs', jobId), { status });
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to update traffic job status:', err);
  }
};

export const deleteTrafficJobFromDb = async (jobId: string) => {
  try {
    await deleteDoc(doc(db, 'traffic_jobs', jobId));
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to delete traffic job:', err);
  }
};

// 6. Daily Archives
export const subscribeArchives = (onData: (archives: DailyArchiveRecord[]) => void) => {
  const colRef = collection(db, 'archives');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DailyArchiveRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DailyArchiveRecord);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Archives listener fallback:', err);
    }
  );
};

export const saveArchiveRecord = async (archive: DailyArchiveRecord) => {
  try {
    await setDoc(doc(db, 'archives', archive.id), archive);
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to save archive record:', err);
  }
};

// 7. Shared Active Layout Document
export const subscribeWorkspaceDoc = (onData: (docState: LayoutDocument) => void) => {
  const docRef = doc(db, 'workspace_docs', 'active');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as LayoutDocument);
      }
    },
    (err) => {
      console.warn('[Studio8 Firestore] Workspace doc listener fallback:', err);
    }
  );
};

export const syncWorkspaceDoc = async (docState: LayoutDocument) => {
  try {
    await setDoc(doc(db, 'workspace_docs', 'active'), docState, { merge: true });
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to sync workspace document:', err);
  }
};

// 8. Production Floor Team Chat Messages
export const subscribeChatMessages = (
  channel: string,
  onData: (messages: TeamChatMessage[]) => void
) => {
  const colRef = collection(db, 'chat_messages');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TeamChatMessage[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as TeamChatMessage;
        if (!channel || item.channel === channel) {
          list.push(item);
        }
      });
      onData(list);
    },
    (err) => {
      console.warn('[Studio8 Firestore] Chat messages listener fallback:', err);
    }
  );
};

export const sendChatMessage = async (message: TeamChatMessage) => {
  try {
    await setDoc(doc(db, 'chat_messages', message.id), message);
  } catch (err) {
    console.warn('[Studio8 Firestore] Failed to send chat message:', err);
  }
};
