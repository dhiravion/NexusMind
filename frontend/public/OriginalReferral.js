function ScreenReferralManagement({ actorRole, setActorRole, onBackToHome, onNavigateToCareNavigator }) {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabRole, setActiveTabRole] = useState(actorRole || 'doctor');
  const [selectedTimelineRef, setSelectedTimelineRef] = useState(null);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [targetReferral, setTargetReferral] = useState(null);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [targetStatus, setTargetStatus] = useState('SENT');
  const [isCustomReferringDoctor, setIsCustomReferringDoctor] = useState(false);
  const [selectedDoctorOptionId, setSelectedDoctorOptionId] = useState('doc_1');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteRef, setTargetDeleteRef] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [systemTab, setSystemTab] = useState('Overview');

  // New Referral Form state
  const [formData, setFormData] = useState({
    patientId: 'PAT-1024',
    patientName: 'Anita Devi',
    patientAge: 58,
    patientSex: 'female',
    patientPhone: '+91-94311-58201',
    patientLocation: 'Katkamsandi, Hazaribagh',
    referringDoctorId: 'doc_1',
    referringDoctorName: 'Dr. Priya Sharma',
    referringFacilityId: 'fac_phc_katkamsandi',
    referringFacilityName: 'Katkamsandi Primary Health Centre',
    receivingFacilityId: 'fac_sbmch',
    receivingFacilityName: 'Sheikh Bhikhari Medical College & Hospital (SBMC&H)',
    specialty: 'Cardiology',
    reason: 'Acute exertional chest tightness, ST segment depression, suspected unstable angina',
    clinicalSummary: '58F diabetic & hypertensive. FAST stroke negative. ECG reveals anterior lead T-wave inversion. SBP 142/90. Sourced from Smart Care Navigator routing.',
    urgencyTier: 'CRITICAL'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [refRes, statRes] = await Promise.all([
        fetch(getApiUrl('/api/referrals')),
        fetch(getApiUrl('/api/referrals/stats'))
      ]);
      const refData = await refRes.json();
      const statData = await statRes.json();
      if (refData.data && Array.isArray(refData.data)) setReferrals(refData.data);
      if (statData.data) setStats(statData.data);
    } catch (err) {
      console.warn('Network fetch unavailable, using active local referral store:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (actorRole) setActiveTabRole(actorRole);
  }, [actorRole]);

  const handleOpenTimeline = async (ref) => {
    setSelectedTimelineRef(ref);
    try {
      const res = await fetch(getApiUrl(`/api/referrals/${ref.referralId}/history`));
      const data = await res.json();
      setTimelineLogs(data.data || ref.statusHistory || []);
    } catch (err) {
      setTimelineLogs(ref.statusHistory || []);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/referrals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShowCreateModal(false);
        setReferrals((prev) => [data.data, ...prev.filter((r) => r.referralId !== data.data.referralId)]);
        setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
        return;
      }
    } catch (err) {
      console.warn('Backend POST failed, generating referral locally:', err);
    }

    // Seamless Local Fallback
    const nextSeq = 130 + referrals.length;
    const newRefId = `REF-2026-${String(nextSeq).padStart(5, '0')}`;
    const now = new Date().toISOString();
    const newReferral = {
      id: `ref_local_${Date.now()}`,
      referralId: newRefId,
      patientId: formData.patientId || `PAT-${Date.now().toString().slice(-4)}`,
      patientName: formData.patientName,
      patientAge: formData.patientAge,
      patientSex: formData.patientSex,
      patientPhone: formData.patientPhone || '+91-94311-28901',
      patientLocation: formData.patientLocation || 'Hazaribagh',
      referringDoctorId: formData.referringDoctorId || 'doc_1',
      referringDoctorName: formData.referringDoctorName || 'Dr. Priya Sharma',
      referringFacilityId: formData.referringFacilityId || 'fac_phc_1',
      referringFacilityName: formData.referringFacilityName || 'Katkamsandi Primary Health Centre',
      receivingFacilityId: formData.receivingFacilityId || 'fac_sbmch',
      receivingFacilityName: formData.receivingFacilityName || 'Sheikh Bhikhari Medical College & Hospital (SBMC&H)',
      specialty: formData.specialty,
      reason: formData.reason,
      clinicalSummary: formData.clinicalSummary,
      urgencyTier: formData.urgencyTier || 'CRITICAL',
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `hist_init_${Date.now()}`,
          referralId: newRefId,
          fromStatus: null,
          toStatus: 'CREATED',
          updatedBy: formData.referringDoctorName || 'Dr. Priya Sharma',
          userRole: 'doctor',
          remarks: 'Digital referral initiated via MedVeda.',
          timestamp: now
        }
      ]
    };

    setReferrals((prev) => [newReferral, ...prev]);
    setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    setShowCreateModal(false);
  };

  const handleUpdateStatus = (ref, newStatus, defaultRemarks = '') => {
    setTargetReferral(ref);
    setTargetStatus(newStatus);
    setStatusRemarks(defaultRemarks || `Status updated to ${newStatus} by ${activeTabRole}`);
    setShowUpdateModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!targetReferral) return;
    const updaterName =
      activeTabRole === 'doctor'
        ? (formData.referringDoctorName || 'Dr. Priya Sharma')
        : activeTabRole === 'worker'
          ? 'ASHA Anita Devi'
          : activeTabRole === 'facility'
            ? 'SBMC&H Reception Desk'
            : 'Patient';

    try {
      const res = await fetch(getApiUrl(`/api/referrals/${targetReferral.referralId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: targetStatus,
          updatedBy: updaterName,
          userRole: activeTabRole,
          remarks: statusRemarks
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShowUpdateModal(false);
        setReferrals((prev) => prev.map((r) => (r.referralId === data.data.referralId ? data.data : r)));
        loadData();
        return;
      }
    } catch (err) {
      console.warn('Backend PATCH failed, applying transition locally:', err);
    }

    // Seamless Local Transition Fallback
    const now = new Date().toISOString();
    const newHistoryItem = {
      id: `hist_${Date.now()}`,
      referralId: targetReferral.referralId,
      fromStatus: targetReferral.status,
      toStatus: targetStatus,
      updatedBy: updaterName,
      userRole: activeTabRole,
      remarks: statusRemarks || `Status transitioned to ${targetStatus}`,
      timestamp: now
    };

    setReferrals((prev) =>
      prev.map((r) => {
        if (r.referralId === targetReferral.referralId) {
          return {
            ...r,
            status: targetStatus,
            updatedAt: now,
            statusHistory: [...(r.statusHistory || []), newHistoryItem]
          };
        }
        return r;
      })
    );

    if (targetStatus === 'CANCELLED') {
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - (targetReferral.status === 'CREATED' || targetReferral.status === 'SENT' ? 1 : 0)),
        cancelled: (prev.cancelled || 0) + 1
      }));
    }

    setShowUpdateModal(false);
  };

  const handleOpenDeleteModal = (ref) => {
    setTargetDeleteRef(ref);
    setShowDeleteModal(true);
  };

  const confirmDeleteReferral = async () => {
    if (!targetDeleteRef) return;
    setIsDeleting(true);
    try {
      const res = await fetch(getApiUrl(`/api/referrals/${encodeURIComponent(targetDeleteRef.referralId)}`), {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!json.success) {
        console.warn('Backend DELETE returned failure, applying local delete:', json);
      }
    } catch (err) {
      console.warn('Backend DELETE fetch failed, applying local delete:', err);
    }

    setReferrals((prev) => prev.filter((r) => r.referralId !== targetDeleteRef.referralId));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      pending: Math.max(0, prev.pending - (targetDeleteRef.status === 'CREATED' || targetDeleteRef.status === 'SENT' ? 1 : 0)),
      inProgress: Math.max(0, prev.inProgress - (targetDeleteRef.status === 'IN_PROGRESS' || targetDeleteRef.status === 'REACHED_FACILITY' ? 1 : 0)),
      completed: Math.max(0, prev.completed - (targetDeleteRef.status === 'COMPLETED' ? 1 : 0)),
      cancelled: Math.max(0, (prev.cancelled || 0) - (targetDeleteRef.status === 'CANCELLED' ? 1 : 0))
    }));

    if (selectedTimelineRef?.referralId === targetDeleteRef.referralId) {
      setSelectedTimelineRef(null);
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setTargetDeleteRef(null);
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.referralId.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q) ||
        r.receivingFacilityName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [referrals, statusFilter, searchQuery]);

  const pendingWorkerReferrals = useMemo(() => {
    return referrals.filter((r) => r.status === 'CREATED' || r.status === 'SENT' || r.status === 'IN_PROGRESS');
  }, [referrals]);

  const incomingFacilityReferrals = useMemo(() => {
    return referrals.filter((r) => r.status === 'SENT' || r.status === 'IN_PROGRESS' || r.status === 'REACHED_FACILITY');
  }, [referrals]);

  const primaryPatientRef = referrals[0] || null;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center gap-2 mb-4 overflow-x-auto">
        {['Create New Referral', 'Manage Referrals', 'View Analytics', 'Overview'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              if (tab === 'Create New Referral') {
                setShowCreateModal(true);
              } else {
                setSystemTab(tab);
              }
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${systemTab === tab
              ? 'bg-[#0b2b82] text-white shadow-md shadow-[#0b2b82]/25'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {tab}
          </button>
        ))}
        <button
          type="button"
          onClick={onBackToHome}
          className="ml-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
        >
          🏠 Home
        </button>
      </div>

      {systemTab === 'Overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Doctor Referral Tracking Board */}
          <div className="xl:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-900">Doctor Referral Tracking Board</h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto flex-1 max-w-[200px]"
              />

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold flex-wrap overflow-x-auto">
                {['ALL', 'CREATED', 'CANCELLED', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-2">Referral ID</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Destination</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-mono font-black text-emerald-800">
                        {ref.referralId}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{ref.patientName}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-800">{ref.receivingFacilityName}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${ref.status === 'CREATED' ? 'bg-slate-100 text-slate-700' :
                          ref.status === 'SENT' ? 'bg-amber-100 text-amber-800' :
                            ref.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              ref.status === 'REACHED_FACILITY' ? 'bg-purple-100 text-purple-800' :
                                ref.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-red-100 text-red-800'
                          }`}>
                          {ref.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: KPIs and Recent Successful Referrals */}
          <div className="xl:col-span-4 space-y-6 flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Referrals</span>
                <div className="text-2xl font-black text-slate-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Pending Actions</span>
                <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">In Transit / Reached</span>
                <div className="text-2xl font-black text-blue-600">{stats.inProgress}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Care Completed</span>
                <div className="text-2xl font-black text-emerald-600">{stats.completed}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 leading-tight">Recent Successful<br />Referrals</h3>
                <button className="text-[10px] font-bold text-[#0b2b82] hover:underline">View All</button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {referrals.filter(r => r.status === 'COMPLETED').slice(0, 3).map(r => (
                  <div key={r.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800">{r.patientName}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">COMPLETED</span>
                    </div>
                    <span className="text-[10px] text-slate-500">To: {r.receivingFacilityName}</span>
                  </div>
                ))}
                {referrals.filter(r => r.status === 'COMPLETED').length === 0 && (
                  <div className="text-xs text-slate-400 italic">No recent successful referrals.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {systemTab !== 'Overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  Feature Map 03 &bull; Closed-Loop Referral
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">REF-TRACKER v2.0</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Smart Referral Management System</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Digitally manages and tracks patient referrals from doctor creation to ASHA follow-up, facility intake, and completed care.
              </p>
            </div>
          </div>

          {/* Role View Selector Tabs */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'doctor', label: '👨‍⚕️ Referring Doctor View' },
                { id: 'worker', label: '👩‍⚕️ ASHA Action Center' },
                { id: 'facility', label: '🏥 Receiving Facility View' },
                { id: 'patient', label: '👤 Patient Referral Pass' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTabRole(t.id);
                    setActorRole(t.id);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTabRole === t.id
                    ? 'bg-[#0b2b82] text-white shadow-md shadow-[#0b2b82]/25'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold rounded-lg border border-emerald-200">
              Active Role: {activeTabRole.toUpperCase()}
            </div>
          </div>

          {/* 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Referrals</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
              <span className="text-[10px] text-slate-400 font-medium">Across all health corridors</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Pending Action</span>
              <div className="text-3xl font-black text-amber-600 mt-1">{stats.pending}</div>
              <span className="text-[10px] text-amber-600/80 font-medium">CREATED or SENT state</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">In Transit / Reached</span>
              <div className="text-3xl font-black text-blue-600 mt-1">{stats.inProgress}</div>
              <span className="text-[10px] text-blue-600/80 font-medium">ASHA active follow-up</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Care Completed</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</div>
              <span className="text-[10px] text-emerald-600/80 font-medium">Verified consultation finished</span>
            </div>
          </div>

          {/* VIEW 1: DOCTOR DASHBOARD */}
          {activeTabRole === 'doctor' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Doctor Referral Tracking Board</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Monitor referral lifecycles, dispatch newly created referrals, and inspect audit logs.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search patient, ID, facility..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
                  />

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold flex-wrap">
                    {['ALL', 'CREATED', 'SENT', 'IN_PROGRESS', 'REACHED_FACILITY', 'COMPLETED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Referral Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-3">Referral ID</th>
                      <th className="py-3 px-3">Patient</th>
                      <th className="py-3 px-3">Specialty &amp; Reason</th>
                      <th className="py-3 px-3">Receiving Destination</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-black text-emerald-800 text-xs">
                          {ref.referralId}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{ref.patientName}</div>
                          <div className="text-[11px] text-slate-400">{ref.patientAge}y &bull; {ref.patientSex} &bull; {ref.patientLocation}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{ref.specialty}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{ref.reason}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{ref.receivingFacilityName}</div>
                          <div className="text-[10px] text-slate-400">From: {ref.referringFacilityName}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${ref.status === 'CREATED'
                              ? 'bg-slate-100 text-slate-700'
                              : ref.status === 'SENT'
                                ? 'bg-amber-100 text-amber-800'
                                : ref.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ref.status === 'REACHED_FACILITY'
                                    ? 'bg-purple-100 text-purple-800'
                                    : ref.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {ref.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {ref.status === 'CREATED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ref, 'SENT', 'Doctor transmitted referral to destination facility.')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                            >
                              Dispatch (Send)
                            </button>
                          )}
                          {(ref.status === 'CREATED' || ref.status === 'SENT') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ref, 'CANCELLED', 'Doctor cancelled referral: patient clinical condition reassessed.')}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Cancel Referral ✕
                            </button>
                          )}
                          {ref.status === 'CANCELLED' && (
                            <span className="text-[11px] font-bold text-rose-600 italic mr-1">Cancelled</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenTimeline(ref)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                          >
                            Timeline 📜
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(ref)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors"
                            title="Delete this referral"
                          >
                            Delete 🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: FRONTLINE WORKER (ASHA) ACTION CENTER */}
          {activeTabRole === 'worker' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    <h3 className="text-base font-black text-amber-900">ASHA Pending Follow-Up Queue</h3>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mt-1">
                    {pendingWorkerReferrals.length} patient(s) have active referrals requiring ground follow-up and transport coordination.
                    Update their status once contacted or when they reach the hospital.
                  </p>
                </div>
                <span className="text-2xl font-black text-amber-800">{pendingWorkerReferrals.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingWorkerReferrals.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${idx === 1 || ref.status === 'IN_PROGRESS'
                      ? 'border-[#0b2b82]/30 hover:border-[#0b2b82]/60 bg-[#0b2b82]/5 hover:bg-[#0b2b82]/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {ref.referralId}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${ref.status === 'IN_PROGRESS'
                          ? 'bg-[#0b2b82]/15 text-[#0b2b82] border border-[#0b2b82]/30'
                          : ref.status === 'SENT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                      >
                        {ref.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{ref.patientName} ({ref.patientAge}y, {ref.patientSex})</h4>
                      <p className="text-xs text-slate-500">Location: {ref.patientLocation} &bull; Phone: {ref.patientPhone || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div><strong className="text-slate-700">Department:</strong> {ref.specialty}</div>
                      <div><strong className="text-slate-700">Destination:</strong> {ref.receivingFacilityName}</div>
                      <div><strong className="text-slate-700">Reason:</strong> {ref.reason}</div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      {ref.status === 'CREATED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref, 'SENT', 'ASHA acknowledged and initiated transport coordination.')}
                          className="flex-1 py-2.5 bg-[#0b2b82] hover:bg-[#071a4f] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0b2b82]/25 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>📨</span>
                          <span>Acknowledge &amp; Dispatch</span>
                        </button>
                      )}

                      {ref.status === 'SENT' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref, 'IN_PROGRESS', 'ASHA contacted patient; transport en route.')}
                          className="flex-1 py-2.5 bg-[#0b2b82] hover:bg-[#071a4f] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0b2b82]/25 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>📞</span>
                          <span>Patient Contacted / En Route</span>
                        </button>
                      )}

                      {ref.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref, 'REACHED_FACILITY', 'ASHA confirmed patient arrived at hospital gate/OPD desk.')}
                          className="flex-1 py-2.5 bg-[#0b2b82] hover:bg-[#071a4f] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0b2b82]/25 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>🏥</span>
                          <span>Confirm Patient Reached Hospital</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenTimeline(ref)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: RECEIVING FACILITY INTAKE VIEW */}
          {activeTabRole === 'facility' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Receiving Facility Intake &amp; Care Completion</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Incoming referrals designated for Sheikh Bhikhari Medical College &amp; District Hospitals.
                  Confirm patient arrival and finalize care when specialist consultation completes.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {incomingFacilityReferrals.map((ref) => (
                  <div key={ref.id} className="py-4 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-800 text-xs">{ref.referralId}</span>
                        <span className="font-bold text-slate-900 text-sm">&bull; {ref.patientName} ({ref.patientAge}y)</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {ref.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Specialty: <strong className="text-slate-700">{ref.specialty}</strong> &bull; Reason: {ref.reason}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Referred by: {ref.referringDoctorName} ({ref.referringFacilityName})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ref.status !== 'REACHED_FACILITY' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref, 'REACHED_FACILITY', 'Facility reception desk checked in patient.')}
                          className="px-4 py-2 bg-[#0b2b82] hover:bg-[#071a4f] text-white font-bold text-xs rounded-xl shadow-md shadow-[#0b2b82]/25 transition-all"
                        >
                          📥 Check-In Patient Arrival
                        </button>
                      )}

                      {ref.status === 'REACHED_FACILITY' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref, 'COMPLETED', 'Consultation & clinical evaluation completed. Patient discharged/admitted.')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                          ✅ Complete Care &amp; Consultation
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenTimeline(ref)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Audit Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: PATIENT REFERRAL PASS */}
          {activeTabRole === 'patient' && primaryPatientRef && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 bg-emerald-50/20">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest text-emerald-800 uppercase bg-emerald-100 px-2.5 py-0.5 rounded">
                      Official Digital Referral Pass
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">{primaryPatientRef.patientName}</h3>
                    <p className="text-xs text-slate-500">Age: {primaryPatientRef.patientAge} &bull; Destination: {primaryPatientRef.receivingFacilityName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-400">REFERRAL ID</div>
                    <div className="text-sm font-black text-emerald-800 font-mono">{primaryPatientRef.referralId}</div>
                  </div>
                </div>

                {/* 4-Step Patient Stepper */}
                <div className="py-4">
                  <div className="flex items-center justify-between text-center relative">
                    <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>
                    {[
                      { step: 'CREATED', label: '1. Created', icon: '📝' },
                      { step: 'SENT', label: '2. Sent', icon: '📨' },
                      { step: 'REACHED_FACILITY', label: '3. Reached Hospital', icon: '🏥' },
                      { step: 'COMPLETED', label: '4. Care Completed', icon: '✅' }
                    ].map((s, idx) => {
                      const isDone =
                        (s.step === 'CREATED') ||
                        (s.step === 'SENT' && primaryPatientRef.status !== 'CREATED') ||
                        (s.step === 'REACHED_FACILITY' && (primaryPatientRef.status === 'REACHED_FACILITY' || primaryPatientRef.status === 'COMPLETED')) ||
                        (s.step === 'COMPLETED' && primaryPatientRef.status === 'COMPLETED');

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isDone ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 mt-1.5">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 text-xs bg-white p-4 rounded-xl border border-slate-200 mt-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Required Specialty</span>
                    <strong className="text-slate-900 text-sm font-black">{primaryPatientRef.specialty}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Clinical Reason</span>
                    <p className="text-slate-700 font-medium">{primaryPatientRef.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Emergency Destination Hospital</span>
                    <strong className="text-slate-900 font-extrabold">{primaryPatientRef.receivingFacilityName}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TIMELINE AUDIT DRAWER MODAL */}
      {selectedTimelineRef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedTimelineRef.referralId}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Referral Journey &amp; Audit Trail</h3>
                <p className="text-xs text-slate-500">Patient: {selectedTimelineRef.patientName} &bull; {selectedTimelineRef.specialty}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTimelineRef(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {timelineLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 uppercase text-[11px]">
                        {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.remarks}</p>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      Updated by: <strong className="text-slate-600">{log.updatedBy}</strong> ({log.userRole})
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {activeTabRole === 'doctor' && (
                <button
                  type="button"
                  onClick={() => handleOpenDeleteModal(selectedTimelineRef)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Delete Referral 🗑️
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTimelineRef(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold ml-auto"
              >
                Close Audit Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REFERRAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Doctor Referral Form
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Create Digital Clinical Referral</h3>
                <p className="text-xs text-slate-500">Pre-filled from Smart Care Navigator &amp; Verified Hospital Destination</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Age &amp; Sex</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={formData.patientAge}
                      onChange={(e) => setFormData({ ...formData, patientAge: Number(e.target.value) })}
                      className="w-24 border border-slate-200 rounded-xl p-2.5 font-medium"
                    />
                    <select
                      value={formData.patientSex}
                      onChange={(e) => setFormData({ ...formData, patientSex: e.target.value })}
                      className="flex-1 border border-slate-200 rounded-xl p-2.5 font-medium"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Referring Doctor &amp; Facility</label>
                  <select
                    value={isCustomReferringDoctor ? 'custom' : selectedDoctorOptionId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      if (selId === 'custom') {
                        setIsCustomReferringDoctor(true);
                        setSelectedDoctorOptionId('custom');
                        setFormData({
                          ...formData,
                          referringDoctorId: 'doc_custom',
                          referringFacilityId: 'fac_custom'
                        });
                      } else {
                        setIsCustomReferringDoctor(false);
                        setSelectedDoctorOptionId(selId);
                        const match = REFERRING_DOCTOR_FACILITY_OPTIONS.find((opt) => opt.id === selId);
                        if (match) {
                          setFormData({
                            ...formData,
                            referringDoctorId: match.id,
                            referringDoctorName: match.doctorName,
                            referringFacilityId: match.facilityId,
                            referringFacilityName: match.facilityName
                          });
                        }
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  >
                    <optgroup label="Primary Health Centres (PHC)">
                      {REFERRING_DOCTOR_FACILITY_OPTIONS.filter((d) => d.facilityType === 'PHC').map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.doctorName} &bull; {doc.facilityName} ({doc.specialty})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Community Health Centres (CHC)">
                      {REFERRING_DOCTOR_FACILITY_OPTIONS.filter((d) => d.facilityType === 'CHC').map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.doctorName} &bull; {doc.facilityName} ({doc.specialty})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="District &amp; Sub-Divisional Hospitals">
                      {REFERRING_DOCTOR_FACILITY_OPTIONS.filter((d) => d.facilityType === 'HOSPITAL').map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.doctorName} &bull; {doc.facilityName} ({doc.specialty})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Specialized &amp; Regional Facilities">
                      {REFERRING_DOCTOR_FACILITY_OPTIONS.filter((d) => d.facilityType === 'OTHER').map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.doctorName} &bull; {doc.facilityName} ({doc.specialty})
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">➕ Enter Custom Doctor &amp; Facility...</option>
                  </select>

                  {/* Custom Doctor & Facility Input Fields */}
                  {isCustomReferringDoctor ? (
                    <div className="mt-2.5 p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-800">Custom Clinician &amp; Facility</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomReferringDoctor(false);
                            const first = REFERRING_DOCTOR_FACILITY_OPTIONS[0];
                            setSelectedDoctorOptionId(first.id);
                            setFormData({
                              ...formData,
                              referringDoctorId: first.id,
                              referringDoctorName: first.doctorName,
                              referringFacilityId: first.facilityId,
                              referringFacilityName: first.facilityName
                            });
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                        >
                          ✕ Reset to Presets
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Doctor Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Rajesh Kumar"
                            value={formData.referringDoctorName}
                            onChange={(e) => setFormData({ ...formData, referringDoctorName: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-2 font-medium text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Referring Facility / Hospital</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Barhi Sub-Divisional Hospital"
                            value={formData.referringFacilityName}
                            onChange={(e) => setFormData({ ...formData, referringFacilityName: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-2 font-medium text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70">
                      <div className="truncate">
                        <span className="font-bold text-slate-800">👨‍⚕️ {formData.referringDoctorName}</span>
                        <span className="mx-1 text-slate-300">&bull;</span>
                        <span className="text-slate-600 font-medium">🏥 {formData.referringFacilityName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomReferringDoctor(true)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        Custom Edit
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Receiving Hospital (Destination)</label>
                  <select
                    value={formData.receivingFacilityName}
                    onChange={(e) => setFormData({ ...formData, receivingFacilityName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="Sheikh Bhikhari Medical College & Hospital (SBMC&H)">
                      Sheikh Bhikhari Medical College (SBMC&H) &bull; 2.8 km
                    </option>
                    <option value="Arogyam Multi-Specialty Hospital & Critical Care">
                      Arogyam Multi-Specialty Hospital &bull; 4.8 km
                    </option>
                    <option value="Kalyani Super Specialty Hospital & Trauma Centre">
                      Kalyani Super Specialty &amp; Trauma &bull; 38 km
                    </option>
                    <option value="Sadar Hospital Hazaribagh">
                      Sadar Hospital Hazaribagh &bull; 3.2 km
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Required Medical Specialty</label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Referral</label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Summary &amp; Vitals</label>
                <textarea
                  rows="3"
                  value={formData.clinicalSummary}
                  onChange={(e) => setFormData({ ...formData, clinicalSummary: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Generate Digital Referral (CREATED)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS / CANCEL MODAL */}
      {showUpdateModal && targetReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${targetStatus === 'CANCELLED' ? 'text-rose-800 bg-rose-100' : 'text-emerald-800 bg-emerald-50'
                }`}>
                {targetStatus === 'CANCELLED' ? 'Cancel Referral' : 'Confirm Transition'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {targetStatus === 'CANCELLED' ? (
                  <>Cancel Referral: <span className="text-rose-600 font-mono">{targetReferral.referralId}</span></>
                ) : (
                  <>Update Status to <span className="text-emerald-700 font-mono">{targetStatus}</span></>
                )}
              </h3>
              <p className="text-xs text-slate-500">Referral: {targetReferral.referralId} &bull; Patient: {targetReferral.patientName}</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                {targetStatus === 'CANCELLED' ? 'Cancellation Reason / Clinical Justification' : 'Audit Remarks / Ground Notes'}
              </label>
              <textarea
                rows="3"
                value={statusRemarks}
                placeholder={targetStatus === 'CANCELLED' ? 'Enter clinical rationale for cancellation...' : ''}
                onChange={(e) => setStatusRemarks(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmStatusUpdate}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-colors ${targetStatus === 'CANCELLED'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
              >
                {targetStatus === 'CANCELLED' ? 'Confirm Cancellation ✕' : 'Confirm Status Transition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE REFERRAL CONFIRMATION MODAL */}
      {showDeleteModal && targetDeleteRef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg font-black shrink-0">
                🗑️
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
                  Permanent Delete
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Delete Referral <span className="font-mono text-red-600">{targetDeleteRef.referralId}</span>?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong className="text-slate-700">{targetDeleteRef.patientName}</strong> ({targetDeleteRef.patientAge}y &bull; {targetDeleteRef.patientSex})
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 text-xs space-y-1.5 text-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Destination &amp; Specialty</span>
                <span className="font-bold text-slate-900">{targetDeleteRef.receivingFacilityName}</span> &bull; {targetDeleteRef.specialty}
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Status</span>
                <span className="font-mono font-bold text-red-700">{targetDeleteRef.status}</span>
              </div>
              <p className="text-[11px] text-red-700/90 font-medium pt-1 border-t border-red-200/60">
                ⚠️ Warning: This will permanently remove this referral record and its audit history from the system.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTargetDeleteRef(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Keep Referral
              </button>
              <button
                type="button"
                onClick={confirmDeleteReferral}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <span>{isDeleting ? 'Deleting...' : 'Delete Referral 🗑️'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
