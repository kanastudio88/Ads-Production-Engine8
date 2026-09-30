import React, { useState } from 'react';
import { TeamMember, DailyArchiveRecord, HourlyJobRecord, MemberJobMetrics } from '../../types';
import { INITIAL_HOURLY_JOB_RECORDS } from '../../data/teamMembers';
import { Language, translations } from '../../utils/translations';

interface DailySummaryPageProps {
  metrics?: MemberJobMetrics[];
  teamMembers: TeamMember[];
  onUpdateMetrics?: (updatedMetrics: MemberJobMetrics[]) => void;
  archives: DailyArchiveRecord[];
  onArchiveAndReset: () => void;
  currentUser: TeamMember;
  hourlyRecords?: HourlyJobRecord[];
  onUpdateHourlyRecords?: (records: HourlyJobRecord[]) => void;
  lang?: Language;
}

export const DailySummaryPage: React.FC<DailySummaryPageProps> = ({
  teamMembers,
  archives,
  onArchiveAndReset,
  currentUser,
  hourlyRecords: externalHourlyRecords,
  onUpdateHourlyRecords,
  lang = 'en'
}) => {
  const t = translations[lang];

  // Internal state for hourly records if not externally supplied
  const [internalRecords, setInternalRecords] = useState<HourlyJobRecord[]>(() => {
    const saved = localStorage.getItem('st8_hourly_job_records');
    return saved ? JSON.parse(saved) : INITIAL_HOURLY_JOB_RECORDS;
  });

  const records = externalHourlyRecords || internalRecords;

  const updateRecords = (newRecords: HourlyJobRecord[]) => {
    if (onUpdateHourlyRecords) {
      onUpdateHourlyRecords(newRecords);
    } else {
      setInternalRecords(newRecords);
      localStorage.setItem('st8_hourly_job_records', JSON.stringify(newRecords));
    }
  };

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotLabel, setNewSlotLabel] = useState('');

  // Computations for the 3 Papers across all time slots
  const totalNstCurrent = records.reduce((sum, r) => sum + (r.nstCurrent || 0), 0);
  const totalNstAdvanced = records.reduce((sum, r) => sum + (r.nstAdvanced || 0), 0);
  const totalNst = totalNstCurrent + totalNstAdvanced;

  const totalBhCurrent = records.reduce((sum, r) => sum + (r.bhCurrent || 0), 0);
  const totalBhAdvanced = records.reduce((sum, r) => sum + (r.bhAdvanced || 0), 0);
  const totalBh = totalBhCurrent + totalBhAdvanced;

  const totalHmCurrent = records.reduce((sum, r) => sum + (r.hmCurrent || 0), 0);
  const totalHmAdvanced = records.reduce((sum, r) => sum + (r.hmAdvanced || 0), 0);
  const totalHm = totalHmCurrent + totalHmAdvanced;

  const grandTotalCurrent = totalNstCurrent + totalBhCurrent + totalHmCurrent;
  const grandTotalAdvanced = totalNstAdvanced + totalBhAdvanced + totalHmAdvanced;
  const grandTotalReceived = grandTotalCurrent + grandTotalAdvanced;

  // Handle cell value updates
  const handleCellChange = (
    slotId: string,
    field: keyof Omit<HourlyJobRecord, 'id' | 'timeSlot' | 'note'>,
    value: number
  ) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    const updated = records.map((r) => {
      if (r.id !== slotId) return r;
      return { ...r, [field]: safeVal };
    });
    updateRecords(updated);
  };

  // Quick increment/decrement
  const handleQuickAdjust = (
    slotId: string,
    field: keyof Omit<HourlyJobRecord, 'id' | 'timeSlot' | 'note'>,
    delta: number
  ) => {
    const target = records.find((r) => r.id === slotId);
    if (!target) return;
    const currentVal = (target[field] as number) || 0;
    handleCellChange(slotId, field, currentVal + delta);
  };

  // Add new time slot row
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotLabel.trim()) return;

    const newSlot: HourlyJobRecord = {
      id: `slot-${Date.now()}`,
      timeSlot: newSlotLabel.trim(),
      nstCurrent: 0,
      nstAdvanced: 0,
      bhCurrent: 0,
      bhAdvanced: 0,
      hmCurrent: 0,
      hmAdvanced: 0
    };

    updateRecords([...records, newSlot]);
    setNewSlotLabel('');
    setShowAddSlotModal(false);
  };

  // Delete slot row
  const handleDeleteSlot = (slotId: string) => {
    if (records.length <= 1) return;
    updateRecords(records.filter((r) => r.id !== slotId));
  };

  // Archive and reset
  const handleConfirmArchive = () => {
    onArchiveAndReset();
    setShowArchiveModal(false);
  };

  // Export CSV of the 3-paper hourly table
  const exportSummaryCsv = () => {
    const headers = [
      'Time Slot',
      'NST Current',
      'NST Advanced',
      'NST Total',
      'BH Current',
      'BH Advanced',
      'BH Total',
      'HM Current',
      'HM Advanced',
      'HM Total',
      'Slot Total Received'
    ];

    const rows = records.map((r) => {
      const nstTot = r.nstCurrent + r.nstAdvanced;
      const bhTot = r.bhCurrent + r.bhAdvanced;
      const hmTot = r.hmCurrent + r.hmAdvanced;
      const slotTot = nstTot + bhTot + hmTot;
      return [
        `"${r.timeSlot}"`,
        r.nstCurrent,
        r.nstAdvanced,
        nstTot,
        r.bhCurrent,
        r.bhAdvanced,
        bhTot,
        r.hmCurrent,
        r.hmAdvanced,
        hmTot,
        slotTot
      ];
    });

    const summaryRow = [
      'TOTAL',
      totalNstCurrent,
      totalNstAdvanced,
      totalNst,
      totalBhCurrent,
      totalBhAdvanced,
      totalBh,
      totalHmCurrent,
      totalHmAdvanced,
      totalHm,
      grandTotalReceived
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(',')), summaryRow.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `NSTP_Daily_Job_Received_Summary_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">table_chart</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {lang === 'en'
                    ? 'Total Received Job Summary (3 Papers)'
                    : 'Ringkasan Jumlah Kerja Diterima (3 Akhbar)'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                  NST · BH · HM
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'en'
                  ? 'Key in received job counts by time slot for New Straits Times, Berita Harian, and Harian Metro (Current & Advanced).'
                  : 'Masukkan jumlah kerja diterima mengikut slot masa untuk New Straits Times, Berita Harian, dan Harian Metro (Semasa & Lanjutan).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddSlotModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-mono text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">more_time</span>
              <span>{lang === 'en' ? 'Add Time Slot' : 'Tambah Slot Masa'}</span>
            </button>

            <button
              onClick={exportSummaryCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-mono text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV</span>
            </button>

            {archives.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-mono text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">history</span>
                <span>
                  {lang === 'en' ? 'History' : 'Arkib'} ({archives.length})
                </span>
              </button>
            )}

            <button
              onClick={() => setShowArchiveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-mono text-xs font-bold shadow-xs transition-colors cursor-pointer uppercase tracking-wide"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>{lang === 'en' ? 'Daily Reset & Archive' : 'Set Semula & Arkib'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: TOTAL RECEIVED */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {lang === 'en' ? 'TOTAL RECEIVED (3 PAPERS)' : 'JUMLAH DITERIMA (3 AKHBAR)'}
              </span>
              <span className="material-symbols-outlined text-blue-600 text-base">inventory_2</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {grandTotalReceived}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                {records.length} {lang === 'en' ? 'Time Slots' : 'Slot Masa'}
              </span>
            </div>
          </div>

          {/* Card 2: CURRENT JOBS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                {lang === 'en' ? 'CURRENT JOBS' : 'KERJA SEMASA'}
              </span>
              <span className="material-symbols-outlined text-blue-500 text-base">description</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-blue-600">
                {grandTotalCurrent}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {lang === 'en' ? "Today's Active Runs" : 'Keluaran Hari Ini'}
              </span>
            </div>
          </div>

          {/* Card 3: ADVANCED JOBS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                {lang === 'en' ? 'ADVANCED JOBS' : 'KERJA LANJUTAN'}
              </span>
              <span className="material-symbols-outlined text-indigo-400 text-base">fast_forward</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-indigo-600">
                {grandTotalAdvanced}
              </span>
              <span className="text-[10px] text-indigo-600 font-mono font-medium">
                {lang === 'en' ? 'Next-Day Prepress' : 'Keluaran Esok'}
              </span>
            </div>
          </div>

          {/* Card 4: PAPERS BREAKDOWN */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {lang === 'en' ? 'PAPERS BREAKDOWN' : 'PECAHAN 3 AKHBAR'}
              </span>
              <span className="material-symbols-outlined text-slate-400 text-base">newspaper</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-1 font-mono text-xs font-bold">
              <div className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-center flex-1">
                <div className="text-[9px] text-blue-600">NST</div>
                <div>{totalNst}</div>
              </div>
              <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-center flex-1">
                <div className="text-[9px] text-amber-600">BH</div>
                <div>{totalBh}</div>
              </div>
              <div className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-center flex-1">
                <div className="text-[9px] text-emerald-600">HM</div>
                <div>{totalHm}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* NEW EDITABLE 3-PAPER HOURLY RECEIVED JOBS TABLE           */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800 uppercase tracking-wide">
                {lang === 'en'
                  ? 'Total Received Jobs by Shift Time Window'
                  : 'Jumlah Kerja Diterima Mengikut Waktu Syif'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {lang === 'en'
                  ? '(Click cell to edit count)'
                  : '(Klik kotak untuk masukkan jumlah)'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 text-[11px]">
                {lang === 'en' ? 'Live Auto-Sum' : 'Kiraan Automatik'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {/* Master Header Row with 3 Papers */}
                <tr className="bg-slate-100/90 border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-600">
                  {/* Left Column: MASA / TIME */}
                  <th className="py-3 px-4 font-bold text-slate-900 w-44 border-r border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-500">
                        schedule
                      </span>
                      <span>{lang === 'en' ? 'TIME (MASA)' : 'MASA (TIME)'}</span>
                    </div>
                  </th>

                  {/* Paper 1: NST */}
                  <th
                    colSpan={2}
                    className="py-2.5 px-3 text-center font-bold text-blue-900 bg-blue-100/60 border-r border-slate-300"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>NST (New Straits Times)</span>
                    </div>
                  </th>

                  {/* Paper 2: BH */}
                  <th
                    colSpan={2}
                    className="py-2.5 px-3 text-center font-bold text-amber-900 bg-amber-100/60 border-r border-slate-300"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <span>BH (Berita Harian)</span>
                    </div>
                  </th>

                  {/* Paper 3: HM */}
                  <th
                    colSpan={2}
                    className="py-2.5 px-3 text-center font-bold text-emerald-900 bg-emerald-100/60 border-r border-slate-300"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>HM (Harian Metro)</span>
                    </div>
                  </th>

                  {/* Total Received Column */}
                  <th className="py-2.5 px-3 text-center font-bold text-slate-800 bg-slate-100 w-32 border-r border-slate-200">
                    {lang === 'en' ? 'TOTAL RECEIVED' : 'JUMLAH DITERIMA'}
                  </th>

                  {/* Action Column */}
                  <th className="py-2.5 px-2 text-center font-bold text-slate-500 w-16">
                    {lang === 'en' ? 'ACTION' : 'TINDAKAN'}
                  </th>
                </tr>

                {/* Sub-tier Column Header (Current & Advanced for each of 3 papers) */}
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-1.5 px-4 border-r border-slate-200 text-slate-400">
                    {lang === 'en' ? 'SHIFT HOURS' : 'WAKTU SYIF'}
                  </th>

                  {/* NST Subheaders */}
                  <th className="py-1.5 px-2 text-center bg-blue-50/40 text-blue-700">
                    {lang === 'en' ? 'CURRENT' : 'SEMASA'}
                  </th>
                  <th className="py-1.5 px-2 text-center bg-blue-50/40 text-blue-600 border-r border-slate-300">
                    {lang === 'en' ? 'ADVANCED' : 'LANJUTAN'}
                  </th>

                  {/* BH Subheaders */}
                  <th className="py-1.5 px-2 text-center bg-amber-50/40 text-amber-700">
                    {lang === 'en' ? 'CURRENT' : 'SEMASA'}
                  </th>
                  <th className="py-1.5 px-2 text-center bg-amber-50/40 text-amber-600 border-r border-slate-300">
                    {lang === 'en' ? 'ADVANCED' : 'LANJUTAN'}
                  </th>

                  {/* HM Subheaders */}
                  <th className="py-1.5 px-2 text-center bg-emerald-50/40 text-emerald-700">
                    {lang === 'en' ? 'CURRENT' : 'SEMASA'}
                  </th>
                  <th className="py-1.5 px-2 text-center bg-emerald-50/40 text-emerald-600 border-r border-slate-300">
                    {lang === 'en' ? 'ADVANCED' : 'LANJUTAN'}
                  </th>

                  {/* Row Total Subheader */}
                  <th className="py-1.5 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-600">
                    {lang === 'en' ? 'SLOT TOTAL' : 'JUMLAH SLOT'}
                  </th>

                  <th className="py-1.5 px-2 text-center text-slate-400">DEL</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {records.map((row, idx) => {
                  const nstSlotTotal = (row.nstCurrent || 0) + (row.nstAdvanced || 0);
                  const bhSlotTotal = (row.bhCurrent || 0) + (row.bhAdvanced || 0);
                  const hmSlotTotal = (row.hmCurrent || 0) + (row.hmAdvanced || 0);
                  const slotGrandTotal = nstSlotTotal + bhSlotTotal + hmSlotTotal;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/20 transition-colors group ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Left Column: TIME (MASA) */}
                      <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="font-mono text-xs">{row.timeSlot}</span>
                      </td>

                      {/* NST Current */}
                      <td className="py-2 px-2 text-center bg-blue-50/10">
                        <input
                          type="number"
                          min="0"
                          value={row.nstCurrent}
                          onChange={(e) =>
                            handleCellChange(row.id, 'nstCurrent', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 font-mono text-xs font-bold text-blue-900 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* NST Advanced */}
                      <td className="py-2 px-2 text-center bg-blue-50/10 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.nstAdvanced}
                          onChange={(e) =>
                            handleCellChange(row.id, 'nstAdvanced', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 font-mono text-xs font-medium text-blue-700 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* BH Current */}
                      <td className="py-2 px-2 text-center bg-amber-50/10">
                        <input
                          type="number"
                          min="0"
                          value={row.bhCurrent}
                          onChange={(e) =>
                            handleCellChange(row.id, 'bhCurrent', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-amber-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 font-mono text-xs font-bold text-amber-900 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* BH Advanced */}
                      <td className="py-2 px-2 text-center bg-amber-50/10 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.bhAdvanced}
                          onChange={(e) =>
                            handleCellChange(row.id, 'bhAdvanced', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-amber-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 font-mono text-xs font-medium text-amber-700 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* HM Current */}
                      <td className="py-2 px-2 text-center bg-emerald-50/10">
                        <input
                          type="number"
                          min="0"
                          value={row.hmCurrent}
                          onChange={(e) =>
                            handleCellChange(row.id, 'hmCurrent', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-bold text-emerald-900 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* HM Advanced */}
                      <td className="py-2 px-2 text-center bg-emerald-50/10 border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          value={row.hmAdvanced}
                          onChange={(e) =>
                            handleCellChange(row.id, 'hmAdvanced', parseInt(e.target.value))
                          }
                          className="w-14 text-center py-1 px-1 rounded-md border border-slate-200 bg-white hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-medium text-emerald-700 focus:outline-none transition-colors"
                        />
                      </td>

                      {/* Row Total (Auto-calculated) */}
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                            slotGrandTotal > 0
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {slotGrandTotal}
                        </span>
                      </td>

                      {/* Row Delete Action */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(row.id)}
                          title={lang === 'en' ? 'Remove this time slot' : 'Padam slot masa ini'}
                          disabled={records.length <= 1}
                          className="w-6 h-6 rounded hover:bg-red-50 hover:text-red-600 text-slate-400 inline-flex items-center justify-center text-xs cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* AGGREGATE TOTAL ROW */}
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <td className="py-3 px-4 uppercase tracking-wider border-r border-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-700">
                        functions
                      </span>
                      <span>
                        {lang === 'en' ? 'TOTAL RECEIVED (ALL)' : 'JUMLAH DITERIMA (SEMUA)'}
                      </span>
                    </div>
                  </td>

                  {/* Total NST Current */}
                  <td className="py-3 px-2 text-center text-blue-800 bg-blue-50/50">
                    <span className="font-extrabold text-sm">{totalNstCurrent}</span>
                  </td>

                  {/* Total NST Advanced */}
                  <td className="py-3 px-2 text-center text-blue-700 bg-blue-50/50 border-r border-slate-300">
                    <span className="font-bold text-xs">{totalNstAdvanced}</span>
                  </td>

                  {/* Total BH Current */}
                  <td className="py-3 px-2 text-center text-amber-800 bg-amber-50/50">
                    <span className="font-extrabold text-sm">{totalBhCurrent}</span>
                  </td>

                  {/* Total BH Advanced */}
                  <td className="py-3 px-2 text-center text-amber-700 bg-amber-50/50 border-r border-slate-300">
                    <span className="font-bold text-xs">{totalBhAdvanced}</span>
                  </td>

                  {/* Total HM Current */}
                  <td className="py-3 px-2 text-center text-emerald-800 bg-emerald-50/50">
                    <span className="font-extrabold text-sm">{totalHmCurrent}</span>
                  </td>

                  {/* Total HM Advanced */}
                  <td className="py-3 px-2 text-center text-emerald-700 bg-emerald-50/50 border-r border-slate-300">
                    <span className="font-bold text-xs">{totalHmAdvanced}</span>
                  </td>

                  {/* Grand Total */}
                  <td className="py-3 px-3 text-center bg-blue-600 text-white font-extrabold text-sm border-r border-slate-300 shadow-inner">
                    {grandTotalReceived}
                  </td>

                  <td className="py-3 px-2 text-center text-[10px] text-slate-400">
                    <span className="material-symbols-outlined text-xs text-emerald-600">
                      cloud_done
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Quick Add Custom Time Slot Strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-600">info</span>
            <span>
              {lang === 'en'
                ? 'Automated Calculations: Row total sums NST + BH + HM for both Current & Advanced.'
                : 'Kiraan Automatik: Jumlah baris merangkumi NST + BH + HM bagi Semasa & Lanjutan.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddSlotModal(true)}
            className="flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>{lang === 'en' ? '+ Add New Shift Window' : '+ Tambah Waktu Syif Baru'}</span>
          </button>
        </div>
      </div>

      {/* Modal: Add New Time Slot */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-blue-600 text-xl">schedule</span>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'en' ? 'Add Shift Time Slot' : 'Tambah Slot Masa Syif'}
              </h3>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'en'
                    ? 'Time Slot Label (e.g. 02:00 - 04:00)'
                    : 'Label Slot Masa (cth: 02:00 - 04:00)'}
                </label>
                <input
                  type="text"
                  required
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  placeholder="02:00 - 04:00"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-xs cursor-pointer"
                >
                  {lang === 'en' ? 'Add Slot' : 'Tambah Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Reset & Archive Confirmation Dialog */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">archive</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'en'
                    ? 'Confirm Daily Reset & Archive'
                    : 'Sahkan Simpan Arkib & Set Semula'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Cycle Date:{' '}
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {lang === 'en'
                ? `This will archive the current day's job counts (${grandTotalReceived} total received: ${grandTotalCurrent} current, ${grandTotalAdvanced} advanced across NST, BH, HM) into historical records and reset all time slot counters to zero for the next production shift.`
                : `Tindakan ini akan mengarkibkan jumlah kerja hari ini (${grandTotalReceived} jumlah diterima: ${grandTotalCurrent} semasa, ${grandTotalAdvanced} lanjutan merangkumi NST, BH, HM) ke dalam rekod sejarah dan menetapkan semula semua slot masa kepada sifar bagi syif seterusnya.`}
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1 mb-5">
              <div className="flex justify-between">
                <span>{lang === 'en' ? 'Total Jobs to Archive:' : 'Jumlah Kerja Diarkib:'}</span>
                <span className="font-bold">{grandTotalReceived}</span>
              </div>
              <div className="flex justify-between">
                <span>NST / BH / HM Volume:</span>
                <span>
                  {totalNst} / {totalBh} / {totalHm}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'en' ? 'Authorized By:' : 'Disahkan Oleh:'}</span>
                <span className="text-blue-700 font-semibold">{currentUser.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {lang === 'en'
                  ? 'Archive & Reset Counters'
                  : 'Arkib & Set Semula'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Archives Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">history</span>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'en' ? 'Archived Shift Records' : 'Rekod Syif Diarkib'}
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {archives.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {record.date}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                      {record.totalReceived} TOTAL JOBS
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                    <div>
                      Current: <span className="font-bold text-slate-800">{record.currentJobs}</span>
                    </div>
                    <div>
                      Advanced: <span className="font-bold text-slate-800">{record.advancedJobs}</span>
                    </div>
                    <div>
                      Archived By: <span className="text-slate-700">{record.archivedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
