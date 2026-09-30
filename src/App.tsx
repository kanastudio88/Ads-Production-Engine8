import React, { useState, useEffect } from 'react';
import {
  TeamMember,
  MemberJobMetrics,
  HourlyJobRecord,
  DailyArchiveRecord,
  LayoutDocument,
  TrafficJob,
  SavedLink
} from './types';
import {
  INITIAL_TEAM_MEMBERS,
  INITIAL_JOB_METRICS,
  INITIAL_HOURLY_JOB_RECORDS
} from './data/teamMembers';
import { SAMPLE_COPIES, INITIAL_TRAFFIC_JOBS } from './data/sampleCopies';
import { LoginPage } from './components/LoginModalOrPage';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { WorkspaceView } from './components/Workspace/WorkspaceView';
import { DailySummaryPage } from './components/DailySummary/DailySummaryPage';
import { TrafficControllerModal } from './components/TrafficController/TrafficControllerModal';
import { TeamChatView } from './components/TeamChat/TeamChatView';
import { SavedLinksModal } from './components/SavedLinks/SavedLinksModal';
import { initFirebaseSession, logoutFirebaseUser } from './firebase';
import { Language } from './utils/translations';
import {
  subscribeTeamMembers,
  syncTeamMember,
  subscribeJobMetrics,
  syncJobMetrics,
  subscribeTrafficJobs,
  saveTrafficJob,
  updateTrafficJobStatusInDb,
  subscribeArchives,
  saveArchiveRecord,
  subscribeWorkspaceDoc,
  syncWorkspaceDoc,
  subscribeSavedLinks,
  saveSavedLinkToDb,
  deleteSavedLinkFromDb,
  subscribeTrafficConfig,
  saveTrafficConfigToDb,
  INITIAL_SAVED_LINKS
} from './services/firestoreSync';

const DEFAULT_DOC: LayoutDocument = {
  kicker: 'DALAM MAHKAMAH MAJISTRET DI KUALA LUMPUR\nDALAM WILAYAH PERSEKUTUAN KUALA LUMPUR, MALAYSIA\nGUAMAN SIVIL NO: WA-A72NCvC-3158-07/2026',
  edition: 'MAHKAMAH MAJISTRET KUALA LUMPUR · BAHAGIAN SIVIL',
  subCategory: 'GUAMAN NO: WA-A72NCvC-3158-07/2026',
  title: 'NOTIS IKLAN',
  subHeader: '(Dalam perkara mengenai Writ Saman bertarikh 31 Julai 2026)',
  bodyText: SAMPLE_COPIES[0].bodyText,
  columns: 1,
  gutter: 0.05, // 0.05mm standard gutter between text boxes
  fontFamily: 'Helvetica',
  fontWeight: 'normal',
  fontSize: 5.2, // standard 5.2pt
  lineHeight: 6.5,
  tracking: 0,
  alignment: 'justify',
  borderStyle: 'solid',
  borderWidth: 0.5,
  frameWidth: 63.0,
  frameHeight: 150.0,
  posX: 73.5,
  posY: 24.5,
  dropCap: false,
  balanceSubColumns: true,
  autoScaleFont: true,
  opticalMarginAlignment: true,
  snapBaselineGrid: true,
  footerTag: '§ DOKUMEN MAHKAMAH & NOTIS AWAM',
  pageNumber: 'PAGE 1',
  bleedMm: 3.0,
  showRulers: true,
  showGuides: true,
  showBaselineGrid: true,
  zoom: 100,
  newspaperGrid: 'none',
  viewportMode: 'normal',
  nUpMode: 1
};

export default function App() {
  // Application Language state (English by default, with Bahasa Melayu choice)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('st8_app_lang');
    return saved === 'bm' || saved === 'en' ? saved : 'en';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('st8_app_lang', newLang);
  };

  // Session & Auth state (restricted to the 8 authorized seats)
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  
  // Team Presence State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('st8_team_members');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  // Daily Job Metrics Tracker State
  const [jobMetrics, setJobMetrics] = useState<MemberJobMetrics[]>(() => {
    const saved = localStorage.getItem('st8_job_metrics');
    return saved ? JSON.parse(saved) : INITIAL_JOB_METRICS;
  });

  // Hourly Job Records Tracker State (3 Papers: NST, BH, HM)
  const [hourlyJobRecords, setHourlyJobRecords] = useState<HourlyJobRecord[]>(() => {
    const saved = localStorage.getItem('st8_hourly_job_records');
    return saved ? JSON.parse(saved) : INITIAL_HOURLY_JOB_RECORDS;
  });

  const handleUpdateHourlyRecords = (updated: HourlyJobRecord[]) => {
    setHourlyJobRecords(updated);
    localStorage.setItem('st8_hourly_job_records', JSON.stringify(updated));
  };

  // Shift Archives State
  const [archives, setArchives] = useState<DailyArchiveRecord[]>(() => {
    const saved = localStorage.getItem('st8_archives');
    return saved ? JSON.parse(saved) : [];
  });

  // Traffic Controller State
  const [trafficSheetUrl, setTrafficSheetUrl] = useState<string>(() => {
    return (
      localStorage.getItem('st8_traffic_sheet_url') ||
      'https://docs.google.com/spreadsheets/d/1Production-Hub-Job-Traffic-Control-2026/edit'
    );
  });
  const [trafficJobs, setTrafficJobs] = useState<TrafficJob[]>(() => {
    const saved = localStorage.getItem('st8_traffic_jobs');
    return saved ? JSON.parse(saved) : INITIAL_TRAFFIC_JOBS;
  });
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);

  // Saved Links in Firebase State
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    const saved = localStorage.getItem('st8_saved_links');
    return saved ? JSON.parse(saved) : INITIAL_SAVED_LINKS;
  });
  const [isSavedLinksModalOpen, setIsSavedLinksModalOpen] = useState(false);

  // Active Layout Document State
  const [documentState, setDocumentState] = useState<LayoutDocument>(() => {
    const saved = localStorage.getItem('st8_current_doc');
    return saved ? JSON.parse(saved) : DEFAULT_DOC;
  });

  // Initialize Firebase and subscribe to Firestore real-time collections
  useEffect(() => {
    let isMounted = true;
    initFirebaseSession()
      .then((user) => {
        if (isMounted) {
          setFirebaseStatus(user ? 'connected' : 'offline');
        }
      })
      .catch(() => {
        if (isMounted) setFirebaseStatus('offline');
      });

    const unsubMembers = subscribeTeamMembers((remoteMembers) => {
      if (remoteMembers && remoteMembers.length > 0) {
        setTeamMembers(remoteMembers);
      }
    });

    const unsubMetrics = subscribeJobMetrics((remoteMetrics) => {
      if (remoteMetrics && remoteMetrics.length > 0) {
        setJobMetrics(remoteMetrics);
      }
    });

    const unsubTraffic = subscribeTrafficJobs((remoteJobs) => {
      if (remoteJobs && remoteJobs.length > 0) {
        setTrafficJobs(remoteJobs);
      }
    });

    const unsubArchives = subscribeArchives((remoteArchives) => {
      if (remoteArchives && remoteArchives.length > 0) {
        setArchives(remoteArchives);
      }
    });

    const unsubDoc = subscribeWorkspaceDoc((remoteDoc) => {
      if (remoteDoc && remoteDoc.title) {
        setDocumentState((prev) => ({ ...prev, ...remoteDoc }));
      }
    });

    const unsubLinks = subscribeSavedLinks((remoteLinks) => {
      if (remoteLinks && remoteLinks.length > 0) {
        setSavedLinks(remoteLinks);
      }
    });

    const unsubConfig = subscribeTrafficConfig((remoteUrl) => {
      if (remoteUrl) {
        setTrafficSheetUrl(remoteUrl);
      }
    });

    return () => {
      isMounted = false;
      unsubMembers();
      unsubMetrics();
      unsubTraffic();
      unsubArchives();
      unsubDoc();
      unsubLinks();
      unsubConfig();
    };
  }, []);

  // Sync to local storage as fallback
  useEffect(() => {
    localStorage.setItem('st8_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('st8_job_metrics', JSON.stringify(jobMetrics));
  }, [jobMetrics]);

  useEffect(() => {
    localStorage.setItem('st8_archives', JSON.stringify(archives));
  }, [archives]);

  useEffect(() => {
    localStorage.setItem('st8_traffic_jobs', JSON.stringify(trafficJobs));
  }, [trafficJobs]);

  useEffect(() => {
    localStorage.setItem('st8_traffic_sheet_url', trafficSheetUrl);
  }, [trafficSheetUrl]);

  useEffect(() => {
    localStorage.setItem('st8_saved_links', JSON.stringify(savedLinks));
  }, [savedLinks]);

  useEffect(() => {
    localStorage.setItem('st8_current_doc', JSON.stringify(documentState));
  }, [documentState]);

  // Toggle user online/offline status
  const handleToggleUserOnline = (userId: string) => {
    setTeamMembers((prev) => {
      const updated = prev.map((member) =>
        member.id === userId
          ? {
              ...member,
              isOnline: !member.isOnline,
              lastActive: !member.isOnline ? 'Active now' : 'Just now'
            }
          : member
      );
      const target = updated.find((m) => m.id === userId);
      if (target) syncTeamMember(target);
      return updated;
    });
  };

  // Switch logged in active user
  const handleSwitchUser = (user: TeamMember) => {
    setCurrentUser(user);
    // Ensure the switched user is online
    const onlineUser = { ...user, isOnline: true };
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === user.id ? onlineUser : m))
    );
    syncTeamMember(onlineUser);
  };

  // Lock session / Logout
  const handleLogout = async () => {
    try {
      await logoutFirebaseUser();
    } catch (e) {
      // non-fatal
    }
    setCurrentUser(null);
  };

  // Saved Links in Firebase handlers
  const handleAddSavedLink = (newLinkData: Omit<SavedLink, 'id' | 'addedAt'>) => {
    const newLink: SavedLink = {
      ...newLinkData,
      id: `link-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0]
    };
    setSavedLinks((prev) => [newLink, ...prev]);
    saveSavedLinkToDb(newLink);
  };

  const handleDeleteSavedLink = (linkId: string) => {
    setSavedLinks((prev) => prev.filter((l) => l.id !== linkId));
    deleteSavedLinkFromDb(linkId);
  };

  const handleTogglePinLink = (link: SavedLink) => {
    const updated = { ...link, isPinned: !link.isPinned };
    setSavedLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
    saveSavedLinkToDb(updated);
  };

  const handleUpdateTrafficSheetUrl = (newUrl: string) => {
    setTrafficSheetUrl(newUrl);
    saveTrafficConfigToDb(newUrl, currentUser?.name || 'Operator');
  };

  // Update layout document with Firestore sync
  const handleUpdateDocument = (updated: Partial<LayoutDocument>) => {
    setDocumentState((prev) => {
      const nextDoc = { ...prev, ...updated };
      syncWorkspaceDoc(nextDoc);
      return nextDoc;
    });
  };

  // Direct metrics update from DailySummary page
  const handleUpdateMetrics = (updatedMetrics: MemberJobMetrics[]) => {
    setJobMetrics(updatedMetrics);
    syncJobMetrics(updatedMetrics);
  };

  // Increment summary jobs from traffic dispatcher
  const handleIncrementSummaryJob = (
    userId: string,
    publication: 'NST' | 'BH' | 'HM',
    isAdvanced: boolean
  ) => {
    setJobMetrics((prev) => {
      const updated = prev.map((m) => {
        if (m.userId !== userId) return m;
        const field =
          publication === 'NST'
            ? isAdvanced
              ? 'nstAdvanced'
              : 'nstCurrent'
            : publication === 'BH'
            ? isAdvanced
              ? 'bhAdvanced'
              : 'bhCurrent'
            : isAdvanced
            ? 'hmAdvanced'
            : 'hmCurrent';

        const item = { ...m, [field]: m[field] + 1 };
        item.totalReceived =
          item.nstCurrent +
          item.nstAdvanced +
          item.bhCurrent +
          item.bhAdvanced +
          item.hmCurrent +
          item.hmAdvanced;
        return item;
      });
      syncJobMetrics(updated);
      return updated;
    });
  };

  // Daily Archive and Reset
  const handleArchiveAndReset = () => {
    const hourlyTotalReceived = hourlyJobRecords.reduce(
      (sum, r) =>
        sum +
        r.nstCurrent +
        r.nstAdvanced +
        r.bhCurrent +
        r.bhAdvanced +
        r.hmCurrent +
        r.hmAdvanced,
      0
    );
    const hourlyCurrent = hourlyJobRecords.reduce(
      (sum, r) => sum + r.nstCurrent + r.bhCurrent + r.hmCurrent,
      0
    );
    const hourlyAdvanced = hourlyJobRecords.reduce(
      (sum, r) => sum + r.nstAdvanced + r.bhAdvanced + r.hmAdvanced,
      0
    );

    const newArchiveRecord: DailyArchiveRecord = {
      id: `arch-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      timestamp: Date.now(),
      totalReceived: hourlyTotalReceived,
      currentJobs: hourlyCurrent,
      advancedJobs: hourlyAdvanced,
      activeDesks: teamMembers.filter((m) => m.isOnline).length,
      metrics: JSON.parse(JSON.stringify(jobMetrics)),
      hourlyRecords: JSON.parse(JSON.stringify(hourlyJobRecords)),
      archivedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Auto-Cycle'
    };

    setArchives((prev) => [newArchiveRecord, ...prev]);
    saveArchiveRecord(newArchiveRecord);

    // Reset hourly records to zero
    const resetHourly = hourlyJobRecords.map((r) => ({
      ...r,
      nstCurrent: 0,
      nstAdvanced: 0,
      bhCurrent: 0,
      bhAdvanced: 0,
      hmCurrent: 0,
      hmAdvanced: 0
    }));
    setHourlyJobRecords(resetHourly);
    localStorage.setItem('st8_hourly_job_records', JSON.stringify(resetHourly));

    // Reset all member counts to 0
    const resetMetrics = jobMetrics.map((m) => ({
      ...m,
      totalReceived: 0,
      nstCurrent: 0,
      nstAdvanced: 0,
      bhCurrent: 0,
      bhAdvanced: 0,
      hmCurrent: 0,
      hmAdvanced: 0
    }));
    setJobMetrics(resetMetrics);
    syncJobMetrics(resetMetrics);
  };

  // Traffic job dispatch helpers
  const handleAddTrafficJob = (job: Omit<TrafficJob, 'id'>) => {
    const newJob: TrafficJob = {
      ...job,
      id: `JOB-${Date.now()}`
    };
    setTrafficJobs((prev) => [newJob, ...prev]);
    saveTrafficJob(newJob);
  };

  const handleUpdateTrafficJobStatus = (jobId: string, status: TrafficJob['status']) => {
    setTrafficJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
    updateTrafficJobStatusInDb(jobId, status);
  };

  // If user is not authenticated, show Page 1: Google SSO Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        teamMembers={teamMembers}
        onSelectUser={handleSwitchUser}
        lang={lang}
        onSetLang={handleSetLang}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fbf8ff] text-slate-900 font-sans">
      {/* Top Header with live UTC time, language switch, and 8-seat presence strip */}
      <Header
        currentUser={currentUser}
        teamMembers={teamMembers}
        onToggleUserOnline={handleToggleUserOnline}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        firebaseStatus={firebaseStatus}
        lang={lang}
        onSetLang={handleSetLang}
        currentModuleName={
          activeTab === 'workspace'
            ? 'Workspace CS5.5'
            : activeTab === 'dailySummary'
            ? 'Daily Summary'
            : 'Traffic Controller'
        }
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Left Navigation with options */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenTrafficController={() => setIsTrafficModalOpen(true)}
          onOpenSavedLinks={() => setIsSavedLinksModalOpen(true)}
          trafficSheetUrl={trafficSheetUrl}
          lang={lang}
        />

        {/* Dynamic Center View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          {activeTab === 'workspace' && (
            <WorkspaceView
              doc={documentState}
              onUpdateDoc={handleUpdateDocument}
            />
          )}

          {activeTab === 'dailySummary' && (
            <DailySummaryPage
              metrics={jobMetrics}
              teamMembers={teamMembers}
              onUpdateMetrics={handleUpdateMetrics}
              archives={archives}
              onArchiveAndReset={handleArchiveAndReset}
              currentUser={currentUser}
              hourlyRecords={hourlyJobRecords}
              onUpdateHourlyRecords={handleUpdateHourlyRecords}
              lang={lang}
            />
          )}

          {activeTab === 'teamChat' && (
            <TeamChatView
              currentUser={currentUser}
              teamMembers={teamMembers}
              currentDoc={documentState}
            />
          )}
        </main>
      </div>

      {/* Traffic Controller Google Sheet Modal */}
      <TrafficControllerModal
        isOpen={isTrafficModalOpen}
        onClose={() => setIsTrafficModalOpen(false)}
        trafficSheetUrl={trafficSheetUrl}
        onUpdateSheetUrl={handleUpdateTrafficSheetUrl}
        trafficJobs={trafficJobs}
        teamMembers={teamMembers}
        onAddJob={handleAddTrafficJob}
        onUpdateJobStatus={handleUpdateTrafficJobStatus}
        onIncrementSummaryJob={handleIncrementSummaryJob}
        onOpenSavedLinks={() => setIsSavedLinksModalOpen(true)}
      />

      {/* Saved Production Links in Firebase Firestore Modal */}
      <SavedLinksModal
        isOpen={isSavedLinksModalOpen}
        onClose={() => setIsSavedLinksModalOpen(false)}
        savedLinks={savedLinks}
        onAddLink={handleAddSavedLink}
        onDeleteLink={handleDeleteSavedLink}
        onTogglePin={handleTogglePinLink}
        currentUserName={currentUser?.name || 'Operator'}
      />
    </div>
  );
}
