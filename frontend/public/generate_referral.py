import re

def get_code():
    return """



function PatientViewReferralCard({ refData }) {
  if (!refData) return null;
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
        {/* Profile / ID Section */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 min-w-[160px]">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-3 text-slate-300">
            <svg className="w-12 h-12 text-[#0b2b82]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 text-center leading-tight">{refData.patientName}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">Age: {refData.patientAge} | {refData.patientSex === 'female' ? 'F' : 'M'}</p>
          <div className="mt-3 w-full text-center bg-blue-100 text-[#0b2b82] text-[10px] font-black uppercase px-2 py-1 rounded">
            ABHA: {refData.abhaId || '91-XXXX-XXXX-XXXX'}
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
             <div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Referral ID</p>
               <p className="text-xl font-black text-[#0b2b82] tracking-tight">{refData.referralId}</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Date of Referral</p>
               <p className="text-sm font-bold text-slate-700">{new Date(refData.createdAt).toLocaleDateString()}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Urgency Priority</p>
                <p className={`font-black text-sm ${refData.urgency === 'Emergency' ? 'text-rose-600' : refData.urgency === 'Urgent' ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {refData.urgency}
                </p>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Referral Status</p>
                <p className="font-black text-sm text-[#0b2b82]">{refData.status.replace(/_/g, ' ')}</p>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">ICU Required</p>
                <p className="font-black text-sm text-slate-700">{refData.icuPatient ? 'Yes' : 'No'}</p>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</p>
                <p className="font-bold text-sm text-slate-800">{refData.departmentReferredTo}</p>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 md:col-span-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Referred To</p>
                <p className="font-bold text-sm text-slate-800">{refData.receivingFacilityName}</p>
             </div>
          </div>
          
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] text-[#0b2b82] font-bold uppercase tracking-wider mb-1">Reason for Referral</p>
            <p className="text-sm font-medium text-slate-700">{refData.reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientReferralCard({ refData, activeTabRole, handleUpdateStatus }) {
  const STEPS = [
    { num: 1, label: 'Initiated' },
    { num: 2, label: 'Answered' },
    { num: 3, label: 'Bed Reserved' },
    { num: 4, label: 'Patient Arrival' },
    { num: 5, label: 'Bed Allotted' },
    { num: 6, label: 'Treatment' }
  ];

  const currentStep = refData.currentStep || 1;
  const status = refData.status;
  const [showSlip, setShowSlip] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-slate-800">{refData.referralId}</span>
            {refData.urgency === 'Emergency' && <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Emergency</span>}
            {refData.urgency === 'Urgent' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgent</span>}
            {refData.urgency === 'Normal' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Normal</span>}
            {refData.icuPatient && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> ICU Needed</span>}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{refData.patientName}, {refData.patientAge}{refData.patientSex === 'female' ? 'F' : 'M'}</h3>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Referred To</p>
          <p className="font-bold text-slate-800">{refData.receivingFacilityName}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Department</p>
          <p className="font-bold text-slate-800">{refData.departmentReferredTo}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Referred By</p>
          <p className="font-bold text-slate-800">{refData.referringDoctorName}</p>
        </div>
      </div>

      <div className="w-full py-6">
        <div className="flex items-center justify-between w-full relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#0b2b82] rounded-full z-0 transition-all duration-500" style={{ width: `${Math.max(0, (currentStep - 1) * 20)}%` }}></div>
          
          {STEPS.map((step, idx) => {
            const isCompleted = step.num < currentStep || status === 'COMPLETED';
            const isActive = step.num === currentStep && status !== 'COMPLETED' && status !== 'REJECTED';
            const isRejected = step.num === currentStep && status === 'REJECTED';
            
            let bgClass = "bg-white border-slate-200 text-slate-400";
            if (isCompleted) bgClass = "bg-[#0b2b82] border-[#0b2b82] text-white shadow-md shadow-[#0b2b82]/30";
            else if (isActive) bgClass = "bg-blue-50 border-[#0b2b82] text-[#0b2b82] ring-4 ring-blue-50";
            else if (isRejected) bgClass = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/30";

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all ${bgClass}`}>
                  {isCompleted ? '✓' : isRejected ? '✕' : step.num}
                </div>
                <div className="absolute top-12 text-[11px] text-slate-500 whitespace-nowrap font-bold text-center">
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSlip && (
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Reason for Referral</h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{refData.reason}</p>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Clinical Findings</h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{refData.clinicalSummary}</p>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Source Hospital</h4>
            <p className="text-sm font-medium text-slate-800">{refData.referringFacilityName}</p>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Treating Doctor (Destination)</h4>
            <p className="text-sm font-medium text-slate-800">{refData.treatingDoctor?.name || 'Not Assigned Yet'}</p>
          </div>
          {refData.digitalSignature && (
             <div className="md:col-span-2">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Digital Signature</h4>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-4">
                 <div className="italic font-serif text-lg text-slate-600 border-b border-slate-300 pb-1 px-4 inline-block">{refData.digitalSignature.imageOrInitialsSVG}</div>
                 <div className="text-xs text-slate-500">
                    <p className="font-bold text-slate-700">{refData.digitalSignature.doctorName}</p>
                    <p>Signed: {new Date(refData.digitalSignature.signedAt).toLocaleString()}</p>
                 </div>
               </div>
             </div>
          )}
        </div>
      )}

      {/* Actions Slot */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3 items-center">
        <button onClick={() => setShowSlip(!showSlip)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 rounded-xl transition-all">
          {showSlip ? 'Hide Full Slip' : 'View Full Slip & Instructions'}
        </button>
        
        {activeTabRole === 'doctor' && status === 'REFERRAL_INITIATED' && (
          <button onClick={() => handleUpdateStatus(refData, 'REJECTED', 1)} className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all">
            Cancel Referral
          </button>
        )}

        {activeTabRole === 'facility' && status !== 'COMPLETED' && status !== 'REJECTED' && (
          <>
            {status === 'REFERRAL_INITIATED' && (
              <>
                <button onClick={() => handleUpdateStatus(refData, 'REJECTED', 2)} className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all">Reject</button>
                <button onClick={() => handleUpdateStatus(refData, 'ACCEPTED', 2)} className="px-5 py-2.5 text-sm font-bold text-white bg-[#0b2b82] hover:bg-blue-800 rounded-xl shadow-md shadow-[#0b2b82]/20 transition-all">Accept Patient</button>
              </>
            )}
            {status === 'ACCEPTED' && (
              <button onClick={() => handleUpdateStatus(refData, 'BED_RESERVATION', 3, true)} className="px-5 py-2.5 text-sm font-bold text-white bg-[#0b2b82] hover:bg-blue-800 rounded-xl shadow-md shadow-[#0b2b82]/20 transition-all">Reserve Bed</button>
            )}
            {status === 'BED_RESERVATION' && (
              <button onClick={() => handleUpdateStatus(refData, 'PATIENT_ARRIVAL', 4)} className="px-5 py-2.5 text-sm font-bold text-white bg-[#0b2b82] hover:bg-blue-800 rounded-xl shadow-md shadow-[#0b2b82]/20 transition-all">Mark Arrival</button>
            )}
            {status === 'PATIENT_ARRIVAL' && (
              <button onClick={() => handleUpdateStatus(refData, 'BED_ALLOTTED', 5, false, true)} className="px-5 py-2.5 text-sm font-bold text-white bg-[#0b2b82] hover:bg-blue-800 rounded-xl shadow-md shadow-[#0b2b82]/20 transition-all">Allot Bed & Assign Doctor</button>
            )}
            {status === 'BED_ALLOTTED' && (
              <button onClick={() => handleUpdateStatus(refData, 'TREATMENT_ONGOING', 6)} className="px-5 py-2.5 text-sm font-bold text-white bg-[#0b2b82] hover:bg-blue-800 rounded-xl shadow-md shadow-[#0b2b82]/20 transition-all">Start Treatment</button>
            )}
            {status === 'TREATMENT_ONGOING' && (
              <button onClick={() => handleUpdateStatus(refData, 'COMPLETED', 6)} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all">Complete Treatment</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ScreenReferralManagement({ actorRole, setActorRole, onBackToHome, onNavigateToCareNavigator }) {
  const [activeTabRole, setActiveTabRole] = useState(actorRole || 'doctor');
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, rejected: 0, completed: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Modals for facility actions
  const [showBedModal, setShowBedModal] = useState(false);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);

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
    departmentReferredTo: 'Cardiology',
    specialty: 'Cardiology',
    reason: 'Acute exertional chest tightness, ST segment depression',
    clinicalSummary: '58F diabetic & hypertensive. FAST stroke negative. ECG reveals anterior lead T-wave inversion. SBP 142/90.',
    urgency: 'Emergency',
    icuPatient: true,
    digitalSignature: null
  });

  const loadData = async () => {
    try {
      const [refRes, statRes] = await Promise.all([
        fetch(getApiUrl('/api/referrals')),
        fetch(getApiUrl('/api/referrals/stats'))
      ]);
      if(refRes.ok && statRes.ok) {
        const refData = await refRes.json();
        const statData = await statRes.json();
        if (refData.data && Array.isArray(refData.data)) {
           // update local state
           setReferrals(refData.data.map(r => ({
             ...r,
             priorityRank: r.urgencyTier === 'CRITICAL' ? 1 : r.urgencyTier === 'URGENT' ? 2 : 3,
             urgency: r.urgencyTier === 'CRITICAL' ? 'Emergency' : r.urgencyTier === 'URGENT' ? 'Urgent' : 'Normal',
             currentStep: r.status === 'REFERRAL_INITIATED' ? 1 : r.status === 'ACCEPTED' ? 2 : r.status === 'BED_RESERVATION' ? 3 : r.status === 'PATIENT_ARRIVAL' ? 4 : r.status === 'BED_ALLOTTED' ? 5 : r.status === 'TREATMENT_ONGOING' || r.status === 'COMPLETED' ? 6 : 1,
             receivingFacilityName: r.receivingFacilityName || 'SBMC&H'
           })));
        }
        if (statData.data) setStats(statData.data);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn('Network fetch unavailable, seeding local store for test.');
      seedLocalData();
    }
  };

  const seedLocalData = () => {
    const now = new Date();
    const mockRef1 = {
      referralId: 'REF-2026-0084', patientName: 'Arjun Mehta', patientAge: 58, patientSex: 'male',
      urgency: 'Emergency', icuPatient: true, status: 'REFERRAL_INITIATED', currentStep: 1, priorityRank: 1,
      referringDoctorName: 'Dr. Priya Sharma', referringFacilityName: 'Katkamsandi PHC',
      receivingFacilityName: 'Apollo Hospitals, Jubilee Hills', departmentReferredTo: 'Cardiology',
      reason: 'Acute exertional chest tightness', clinicalSummary: 'ECG reveals anterior lead T-wave inversion.', createdAt: now.toISOString(),
      digitalSignature: { doctorName: 'Dr. Priya Sharma', signedAt: now.toISOString(), imageOrInitialsSVG: 'P.S.' }
    };
    const mockRef2 = {
      referralId: 'REF-2026-0072', patientName: 'Arjun Mehta', patientAge: 58, patientSex: 'male',
      urgency: 'Urgent', icuPatient: false, status: 'BED_ALLOTTED', currentStep: 5, priorityRank: 2,
      referringDoctorName: 'Dr. Priya Sharma', referringFacilityName: 'Katkamsandi PHC',
      receivingFacilityName: 'Yashoda Hospitals, Secunderabad', departmentReferredTo: 'Pulmonology',
      reason: 'Severe asthma exacerbation', clinicalSummary: 'Low O2 sats', createdAt: new Date(now.getTime() - 86400000 * 30).toISOString(),
      digitalSignature: { doctorName: 'Dr. Priya Sharma', signedAt: new Date(now.getTime() - 86400000 * 30).toISOString(), imageOrInitialsSVG: 'P.S.' }
    };
    const mockRef3 = {
      referralId: 'REF-2026-0061', patientName: 'Arjun Mehta', patientAge: 58, patientSex: 'male',
      urgency: 'Normal', icuPatient: false, status: 'COMPLETED', currentStep: 6, priorityRank: 3,
      referringDoctorName: 'Dr. Priya Sharma', referringFacilityName: 'Katkamsandi PHC',
      receivingFacilityName: 'Care Hospitals, Banjara Hills', departmentReferredTo: 'General Medicine',
      reason: 'Routine checkup referral', clinicalSummary: 'Stable', createdAt: new Date(now.getTime() - 86400000 * 60).toISOString(),
      digitalSignature: { doctorName: 'Dr. Priya Sharma', signedAt: new Date(now.getTime() - 86400000 * 60).toISOString(), imageOrInitialsSVG: 'P.S.' }
    };
    setReferrals([mockRef1, mockRef2, mockRef3]);
    setStats({ total: 3, pending: 2, rejected: 0, completed: 1 });
  };

  useEffect(() => {
    if (actorRole && ['doctor', 'facility', 'patient'].includes(actorRole)) {
      setActiveTabRole(actorRole);
    }
  }, [actorRole]);

  useEffect(() => { loadData(); }, []);

  const handleUpdateStatus = async (refData, newStatus, currentStep, openBedReserve = false, openBedAllot = false) => {
    if (openBedReserve) {
      setActionTarget({ ...refData, targetStatus: newStatus, targetStep: currentStep });
      setShowBedModal(true);
      return;
    }
    if (openBedAllot) {
      setActionTarget({ ...refData, targetStatus: newStatus, targetStep: currentStep });
      setShowAllotModal(true);
      return;
    }
    await commitStatusUpdate(refData.referralId, newStatus, currentStep, null, null);
  };

  const commitStatusUpdate = async (refId, newStatus, currentStep, bedAlloc, treatingDoc) => {
    try {
      const payload = {
        toStatus: newStatus,
        updatedBy: activeTabRole,
        userRole: activeTabRole,
        currentStep,
        ...(bedAlloc && { bedAllocation: bedAlloc }),
        ...(treatingDoc && { treatingDoctor: treatingDoc })
      };
      const res = await fetch(getApiUrl(`/api/referrals/${refId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadData();
      } else {
         throw new Error();
      }
    } catch (e) {
      // Local fallback
      setReferrals(prev => prev.map(r => {
        if (r.referralId === refId) {
          return { ...r, status: newStatus, currentStep, ...(bedAlloc && { bedAllocation: bedAlloc }), ...(treatingDoc && { treatingDoctor: treatingDoc }) };
        }
        return r;
      }));
      if (newStatus === 'COMPLETED') setStats(s => ({ ...s, pending: s.pending - 1, completed: s.completed + 1 }));
      if (newStatus === 'REJECTED') setStats(s => ({ ...s, pending: s.pending - 1, rejected: s.rejected + 1 }));
    }
    setShowBedModal(false);
    setShowAllotModal(false);
  };

  const handleCreateSubmit = async () => {
    try {
      const res = await fetch(getApiUrl('/api/referrals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        loadData();
      } else throw new Error();
    } catch(e) {
      // Local fallback
      const newRef = {
        ...formData,
        referralId: `REF-2026-${Math.floor(Math.random()*10000)}`,
        status: 'REFERRAL_INITIATED',
        currentStep: 1,
        priorityRank: formData.urgency === 'Emergency' ? 1 : formData.urgency === 'Urgent' ? 2 : 3,
        createdAt: new Date().toISOString()
      };
      setReferrals([newRef, ...referrals]);
      setStats(s => ({ ...s, total: s.total + 1, pending: s.pending + 1 }));
    }
    setShowCreateWizard(false);
    setWizardStep(1);
  };

  const getFilteredReferrals = () => {
    let list = [...referrals];
    if (statusFilter === 'PENDING') list = list.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED');
    else if (statusFilter === 'COMPLETED') list = list.filter(r => r.status === 'COMPLETED');
    else if (statusFilter === 'REJECTED') list = list.filter(r => r.status === 'REJECTED');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.patientName.toLowerCase().includes(q) || r.referralId.toLowerCase().includes(q));
    }

    if (activeTabRole === 'facility') {
      list.sort((a, b) => {
        if (a.priorityRank !== b.priorityRank) return (a.priorityRank || 3) - (b.priorityRank || 3);
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    return list;
  };

  const renderTopStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: activeTabRole === 'facility' ? 'Total Inbound' : 'Total Referrals', val: stats.total, color: 'text-[#0b2b82]' },
        { label: 'Pending', val: stats.pending, color: 'text-orange-500' },
        { label: 'Rejected', val: stats.rejected, color: 'text-rose-500' },
        { label: 'Completed', val: stats.completed, color: 'text-emerald-500' }
      ].map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
          <span className={`text-3xl font-black ${s.color}`}>{s.val}</span>
        </div>
      ))}
    </div>
  );

  const renderTrackingBoard = (title) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm shrink-0">
            {['ALL', 'PENDING', 'COMPLETED', 'REJECTED'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === f ? 'bg-[#0b2b82] text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search ID or Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0b2b82]"
          />
        </div>
      </div>
      <div className="p-6 bg-slate-50/50">
        {getFilteredReferrals().length === 0 ? (
          <div className="text-center py-12"><p className="text-slate-500 font-medium">No referrals found.</p></div>
        ) : (
          getFilteredReferrals().map(r => <PatientReferralCard key={r.referralId} refData={r} activeTabRole={activeTabRole} handleUpdateStatus={handleUpdateStatus} />)
        )}
      </div>
    </div>
  );

  const renderDoctorView = () => (
    <>
      {renderTopStats()}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-black text-slate-800">Recent Successful Referrals</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
               <tr><th className="px-6 py-4">Patient Name</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Destination</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {referrals.filter(r => r.status === 'COMPLETED').slice(0,3).map(r => (
                 <tr key={r.referralId} className="hover:bg-slate-50">
                   <td className="px-6 py-4 font-bold text-slate-800">{r.patientName}</td>
                   <td className="px-6 py-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                   <td className="px-6 py-4 text-slate-600">{r.receivingFacilityName}</td>
                 </tr>
               ))}
               {referrals.filter(r => r.status === 'COMPLETED').length === 0 && (
                 <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No recent successful referrals.</td></tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
      {renderTrackingBoard("Doctor Referral Tracking Board")}
    </>
  );

  const renderFacilityView = () => (
    <>
      {renderTopStats()}
      {renderTrackingBoard("Inbound Referral Queue")}
    </>
  );

  const renderPatientView = () => {
    // Assuming logged-in patient is Arjun Mehta for this mockup
    const loggedInPatientName = 'Arjun Mehta';
    
    // 1. Show only my referrals
    const myReferrals = referrals.filter(r => r.patientName === loggedInPatientName);
    
    // Sort by date descending
    const sorted = [...myReferrals].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 2. Divide into Current and Earlier
    // Current = not completed and not rejected (i.e. active)
    const currentReferrals = sorted.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED');
    // Earlier = completed or rejected
    const earlierReferrals = sorted.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED');
    
    const primaryReferral = sorted.length > 0 ? sorted[0] : null;

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-black text-[#0b2b82] mb-4">Patient Referral Card</h2>
          <PatientViewReferralCard refData={primaryReferral} />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4">Current Referral Status</h2>
          {currentReferrals.length > 0 ? (
             <div className="space-y-4">
               {currentReferrals.map(r => (
                 <PatientReferralCard key={r.referralId} refData={r} activeTabRole={activeTabRole} handleUpdateStatus={handleUpdateStatus} />
               ))}
             </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">No active referrals at this moment.</div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4">Earlier Referral History</h2>
          {earlierReferrals.length > 0 ? (
             <div className="space-y-4">
               {earlierReferrals.map(r => (
                 <PatientReferralCard key={r.referralId} refData={r} activeTabRole={activeTabRole} handleUpdateStatus={handleUpdateStatus} />
               ))}
             </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">No previous referral history found.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black text-[#0b2b82] tracking-tight flex items-center gap-3">
            <button onClick={onBackToHome} className="text-slate-400 hover:text-[#0b2b82]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>
            {activeTabRole === 'patient' ? 'My Referrals' : 'NexusMind Referral Network'} {activeTabRole !== 'patient' && <span className="text-blue-500 font-bold text-lg">v2</span>}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['doctor', 'facility', 'patient'].map((r) => (
              <button key={r} onClick={() => { setActiveTabRole(r); setActorRole && setActorRole(r); }}
                className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeTabRole === r ? 'bg-white text-[#0b2b82] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {r} View
              </button>
            ))}
          </div>
          {activeTabRole === 'doctor' && (
            <button onClick={() => setShowCreateWizard(true)} className="px-6 py-2.5 bg-[#0b2b82] text-white font-bold text-sm rounded-xl hover:bg-blue-800 shadow-md shadow-[#0b2b82]/20 transition-all">
              Create New Referral
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {activeTabRole === 'doctor' && renderDoctorView()}
          {activeTabRole === 'facility' && renderFacilityView()}
          {activeTabRole === 'patient' && renderPatientView()}
        </div>
      </div>

      {/* 3-Step Wizard Modal for Doctor */}
      {showCreateWizard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">Create New Referral</h2>
              <button onClick={() => setShowCreateWizard(false)} className="text-slate-400 hover:text-slate-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div className="flex border-b border-slate-100">
              {['1. Patient Details', '2. Choose Hospital', '3. Check & Send'].map((step, i) => (
                <div key={i} className={`flex-1 py-4 text-center text-sm font-bold border-b-4 transition-colors ${wizardStep === i+1 ? 'border-[#0b2b82] text-[#0b2b82]' : 'border-transparent text-slate-400'}`}>
                  {step}
                </div>
              ))}
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
               {wizardStep === 1 && (
                 <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Patient ID Lookup (ABDM/UHID)</label>
                       <input type="text" value={formData.patientId} className="w-full border border-slate-300 rounded-xl p-3 font-medium" readOnly />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Urgency</label>
                       <select value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 font-medium bg-white">
                         <option>Emergency</option><option>Urgent</option><option>Normal</option>
                       </select>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Department Needed</label>
                     <input type="text" value={formData.departmentReferredTo} onChange={e => setFormData({...formData, departmentReferredTo: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 font-medium" />
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                     <input type="checkbox" id="icu" checked={formData.icuPatient} onChange={e => setFormData({...formData, icuPatient: e.target.checked})} className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"/>
                     <label htmlFor="icu" className="font-bold text-purple-900">Patient requires ICU Bed</label>
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Digital Signature</label>
                     <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setFormData({...formData, digitalSignature: { doctorName: 'Dr. Priya Sharma', signedAt: new Date().toISOString(), imageOrInitialsSVG: 'P.S.' }})}>
                       {formData.digitalSignature ? <span className="font-serif text-2xl italic text-[#0b2b82]">Signed by {formData.digitalSignature.doctorName}</span> : <span className="text-slate-500 font-medium">Click to apply Digital Signature</span>}
                     </div>
                   </div>
                 </div>
               )}
               {wizardStep === 2 && (
                 <div className="space-y-4 animate-fade-in">
                   <p className="text-slate-600 font-medium mb-4">Select destination facility based on live data:</p>
                   <div className="bg-white p-5 rounded-2xl border-2 border-[#0b2b82] shadow-md relative cursor-pointer">
                      <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">Best Match</div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">Sheikh Bhikhari Medical College & Hospital</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                         <div><span className="block text-xs text-slate-400 font-bold mb-1">Distance</span><span className="font-bold text-slate-700">12 km (25 min ETA)</span></div>
                         <div><span className="block text-xs text-slate-400 font-bold mb-1">Dept Match</span><span className="font-bold text-emerald-600">Yes (Cardiology)</span></div>
                         <div><span className="block text-xs text-slate-400 font-bold mb-1">Live ICU Beds</span><span className="font-bold text-slate-700">4 Available</span></div>
                      </div>
                   </div>
                 </div>
               )}
               {wizardStep === 3 && (
                 <div className="animate-fade-in text-center py-10">
                   <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 mb-2">Ready to Send</h3>
                   <p className="text-slate-600 font-medium">Referral for {formData.patientName} to SBMC&H will be initiated.</p>
                 </div>
               )}
            </div>
            <div className="px-8 py-5 border-t border-slate-200 flex justify-between bg-white items-center">
              {wizardStep > 1 ? (
                <button onClick={() => setWizardStep(w => w - 1)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Back</button>
              ) : <div></div>}
              {wizardStep < 3 ? (
                <button onClick={() => { if(wizardStep===1 && !formData.digitalSignature) alert('Signature required'); else setWizardStep(w => w + 1); }} className="px-8 py-2.5 bg-[#0b2b82] text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all">Next Step</button>
              ) : (
                <button onClick={handleCreateSubmit} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all">Send Referral</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bed Modal */}
      {showBedModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
             <h3 className="text-xl font-black text-slate-800 mb-4">Reserve Bed</h3>
             <p className="text-sm text-slate-600 font-medium mb-6">Reserving a bed holds it for the incoming patient.</p>
             <button onClick={() => commitStatusUpdate(actionTarget.referralId, actionTarget.targetStatus, actionTarget.targetStep, { bedId: 'BED-101', ward: 'ICU', reservedAt: new Date().toISOString() }, null)} className="w-full py-3 bg-[#0b2b82] text-white font-bold rounded-xl">Confirm Reservation</button>
             <button onClick={() => setShowBedModal(false)} className="w-full py-3 text-slate-500 font-bold rounded-xl mt-2">Cancel</button>
          </div>
        </div>
      )}
      
      {/* Allot Modal */}
      {showAllotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
             <h3 className="text-xl font-black text-slate-800 mb-4">Allot Bed & Assign Doctor</h3>
             <div className="mb-6 space-y-4">
               <div>
                 <label className="block text-xs font-black text-slate-500 uppercase mb-2">Treating Doctor</label>
                 <select className="w-full border border-slate-300 rounded-xl p-3 font-medium bg-white">
                    <option>Dr. Ankit Desai (Cardiology)</option>
                    <option>Dr. Rakesh Singh (Neurology)</option>
                 </select>
               </div>
             </div>
             <button onClick={() => commitStatusUpdate(actionTarget.referralId, actionTarget.targetStatus, actionTarget.targetStep, null, { id: 'doc_2', name: 'Dr. Ankit Desai', specialty: 'Cardiology'})} className="w-full py-3 bg-[#0b2b82] text-white font-bold rounded-xl">Confirm Allotment</button>
             <button onClick={() => setShowAllotModal(false)} className="w-full py-3 text-slate-500 font-bold rounded-xl mt-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
"""

import sys

app_path = 'c:\\Users\\shusant\\NexusMind\\frontend\\public\\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4630, 5970):
    if 'function ScreenReferralManagement' in lines[i]:
        start_i = i
        break

end_i = start_i
open_braces = 0
in_function = False

for i in range(start_i, len(lines)):
    line = lines[i]
    open_braces += line.count('{')
    open_braces -= line.count('}')
    if '{' in line:
        in_function = True
    if in_function and open_braces == 0:
        end_i = i
        break

new_code = get_code()
lines[start_i:end_i+1] = [new_code + '\n']

with open(app_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Replaced seamlessly')
