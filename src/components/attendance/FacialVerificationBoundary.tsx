import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Camera,
  ScanFace,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Building,
  Sparkles,
  Info,
  Sliders,
  History,
  Lock,
  Search,
  Users,
  Check,
  ChevronDown,
  User,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../ui/StatusBadge";

export interface FacialVerificationEmployee {
  id: string;
  name: string;
  designation: string;
}

// Complete 15 Active Employees Master Roster
export const COMPLETE_FACIAL_VERIFICATION_ROSTER: FacialVerificationEmployee[] = [
  { id: "MTK005", name: "Subhasish Das", designation: "HOD - BIM MEP & Automation" },
  { id: "MTK006", name: "Sushovan Das", designation: "Asst. Manager - MEP & Automation" },
  { id: "MTK007", name: "Shibotosh Karmakar", designation: "SR. BIM Engineer" },
  { id: "MTK008", name: "Byasdev Roy", designation: "Asst. Manager - BIM ACS" },
  { id: "MTK009", name: "Shuvam Kumar Mandal", designation: "Trainee Engineer" },
  { id: "MTK011", name: "Subhasri Mandal", designation: "Trainee" },
  { id: "MTK012", name: "Mosarof Hosen", designation: "MEP Engineer" },
  { id: "MTK015", name: "Tiasha Chakraborty", designation: "SR. Business Development Executive" },
  { id: "MTK016", name: "Damayanti Chanda", designation: "HR & Admin Executive" },
  { id: "MTK017", name: "Poulami Manna", designation: "BIM Engineer" },
  { id: "MTK018", name: "Abhinandan Baitalik", designation: "Trainee Engineer" },
  { id: "MTK019", name: "Batas Chandra Mahato", designation: "Trainee Engineer" },
  { id: "MTK020", name: "Aditi Chakraborty", designation: "Intern" },
  { id: "MTK021", name: "Poulami Das", designation: "Trainee Engineer" },
  { id: "MTK022", name: "Subhabrata Saha", designation: "Asst. Manager - BIM ACS" },
];

export const FacialVerificationBoundary: React.FC = () => {
  const { employees, recordAttendance, logActivity } = useData();
  const { currentUser } = useAuth();
  const { warning, error: toastError } = useToast();

  // Selected employee ID to simulate scanning - defaults to MTK005
  const [selectedEmpId, setSelectedEmpId] = useState<string>("MTK005");

  // Search state for Face Matcher Dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Integration Boundary Modes
  // Mode 1: Provider Pending Integration (AWS Rekognition / Azure Face API)
  // Mode 2: Verification Failure Scenario -> triggers Authorized Manual Verification Fallback
  const [activeMode, setActiveMode] = useState<"MODE_1_PENDING_PROVIDER" | "MODE_2_FAILURE_FALLBACK">(
    "MODE_1_PENDING_PROVIDER"
  );

  // Optical sensor state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanResult, setLastScanResult] = useState<{
    status: "SUCCESS" | "FAILED" | "FALLBACK_REQUIRED";
    confidence?: number;
    message: string;
  } | null>(null);

  // Fallback modal state
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [supervisorEmpId, setSupervisorEmpId] = useState(
    currentUser?.employeeId || "MTK005"
  );
  const [supervisorPin, setSupervisorPin] = useState("9842");
  const [overrideNotes, setOverrideNotes] = useState(
    "Optical illumination variance at south portal verified visually by shift supervisor."
  );

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Close custom dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Merge authoritative 15-employee roster with any dynamic context data (status, avatar, department)
  // Guarantees all 15 active employees are always present with NO truncation or limiting
  const completeRoster = useMemo(() => {
    return COMPLETE_FACIAL_VERIFICATION_ROSTER.map((item) => {
      const matched = employees.find((e) => e.id === item.id);
      const nameParts = item.name.split(" ");
      return {
        id: item.id,
        name: item.name,
        firstName: nameParts[0] || item.name,
        lastName: nameParts.slice(1).join(" ") || "",
        designation: item.designation,
        department: matched?.department || "Operations",
        status: matched?.status || "ACTIVE",
      };
    });
  }, [employees]);

  // Filtered roster for Face Matcher dropdown and search state querying ALL 15 employees without pagination/limit constraints
  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return completeRoster;
    return completeRoster.filter(
      (emp) =>
        emp.id.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
    );
  }, [completeRoster, searchQuery]);

  // Active target employee
  const selectedEmployee = useMemo(() => {
    return completeRoster.find((e) => e.id === selectedEmpId) || completeRoster[0];
  }, [completeRoster, selectedEmpId]);

  // Try activating webcam if allowed
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraError("Camera device access not supported in this client environment.");
      }
    } catch {
      setCameraError("Webcam stream unavailable or access denied. Using biometric optical simulation HUD.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Initiate Biometric Scan
  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setLastScanResult(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setIsScanning(false);

      if (activeMode === "MODE_1_PENDING_PROVIDER") {
        // Mode 1: Success with Mock AWS / Azure matching
        const simulatedConfidence = 98.7;
        setLastScanResult({
          status: "SUCCESS",
          confidence: simulatedConfidence,
          message: `Biometric pattern matched ${selectedEmployee.name} (${selectedEmployee.id}) at ${simulatedConfidence}% vector confidence.`,
        });

        recordAttendance(selectedEmployee.id, "FACIAL_AI", simulatedConfidence);
      } else {
        // Mode 2: Failure Scenario -> triggers Manual Fallback
        const failedConfidence = 64.2;
        setLastScanResult({
          status: "FALLBACK_REQUIRED",
          confidence: failedConfidence,
          message: `Biometric confidence ${failedConfidence}% fell below the mandatory 85.0% threshold. Authorized supervisor override required.`,
        });

        // Log the failure to /activityLogs immediately
        logActivity(
          "VERIFY",
          "Facial Verification",
          `REC-FAIL-${Date.now()}`,
          {
            targetEmployeeId: selectedEmployee.id,
            targetName: selectedEmployee.name,
            confidence: `${failedConfidence}%`,
            failureReason: "Confidence threshold breach (64.2% < 85.0%)",
            device: "Terminal-Gate-01",
            mode: "Failure Fallback Simulation",
          },
          "FAILED"
        );

        toastError(
          "Facial Verification Rejected",
          `Confidence score (${failedConfidence}%) failed security threshold. Opening manual fallback protocol.`
        );

        setShowFallbackModal(true);
      }
    }, 1100);
  };

  // Submit Manual Supervisor Override
  const handleManualOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideNotes.trim()) {
      warning("Notes Required", "Please provide a valid administrative override reason.");
      return;
    }

    recordAttendance(
      selectedEmployee.id,
      "MANUAL_OVERRIDE",
      100,
      supervisorEmpId,
      overrideNotes
    );

    setShowFallbackModal(false);
    setLastScanResult({
      status: "SUCCESS",
      confidence: 100,
      message: `Manual check-in verified and overridden by Supervisor ${supervisorEmpId}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Integration Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Facial Verification Boundary
            </h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Pending Real Provider Integration (AWS Rekognition / Azure Face API)
            </span>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
            Standard high-assurance biometric check-in boundary with optical sensor emulation and manual fallback overrides.
          </p>
        </div>

        {/* Integration Mode Switcher Buttons */}
        <div className="flex items-center p-1 bg-stone-200/80 dark:bg-stone-900 rounded-2xl border border-stone-300/70 dark:border-stone-800 text-xs">
          <button
            id="toggle-mode-1-btn"
            type="button"
            onClick={() => {
              setActiveMode("MODE_1_PENDING_PROVIDER");
              setLastScanResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === "MODE_1_PENDING_PROVIDER"
                ? "bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mode 1: Pending Provider Match
          </button>
          <button
            id="toggle-mode-2-btn"
            type="button"
            onClick={() => {
              setActiveMode("MODE_2_FAILURE_FALLBACK");
              setLastScanResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === "MODE_2_FAILURE_FALLBACK"
                ? "bg-rose-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Mode 2: Simulate Failure & Fallback
          </button>
        </div>
      </div>

      {/* Main Terminal Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera / Biometric Optical Viewport */}
        <div className="lg:col-span-7 bg-[#0B132B] dark:bg-[#070D1A] text-white rounded-2xl p-6 border border-blue-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Diagonal Mesh Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Station Status Header */}
          <div className="flex items-center justify-between z-10 pb-4 border-b border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <div>
                <div className="text-xs font-mono font-bold text-sky-300 uppercase">
                  Biometric Terminal #01 • Operational
                </div>
                <div className="text-[11px] text-slate-300 dark:text-slate-400">
                  Target Identity: <span className="font-bold text-white">{selectedEmployee.name}</span> ({selectedEmployee.id})
                </div>
              </div>
            </div>

            <button
              id="camera-toggle-btn"
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-sky-300" />
              {cameraActive ? "Stop Webcam" : "Enable Live Webcam"}
            </button>
          </div>

          {cameraError && (
            <div className="mt-3 p-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 text-[11px]">
              {cameraError}
            </div>
          )}

          {/* Optical Scanner Center Stage */}
          <div className="my-8 relative flex items-center justify-center min-h-[320px] rounded-xl bg-black/40 border border-blue-500/20 overflow-hidden">
            {/* Live Video Feed (if activated) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                cameraActive ? "opacity-90" : "hidden"
              }`}
            />

            {/* Fallback Graphic (if webcam not active) - Strictly NO-IMAGE Policy */}
            {!cameraActive && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative w-36 h-36 rounded-2xl bg-[#091024] border border-blue-500/40 flex flex-col items-center justify-center p-3 shadow-xl">
                  {/* Bounding Box HUD */}
                  <div className="absolute inset-0 border-2 border-dashed border-sky-400 rounded-2xl animate-pulse" />
                  <div className="absolute -top-3 left-2 px-1.5 py-0.5 bg-[#0B132B] text-[9px] font-mono text-sky-300 rounded border border-sky-400/40">
                    BIOMETRIC_ID_LOCK
                  </div>
                  <div className="text-xl font-bold font-mono text-sky-300">
                    {selectedEmployee.id}
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">
                    {selectedEmployee.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {selectedEmployee.department}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-300">
                    Optical alignment target acquired
                  </div>
                  <div className="text-[11px] text-sky-300 font-semibold">
                    {selectedEmployee.id} • {selectedEmployee.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedEmployee.designation}
                  </div>
                </div>
              </div>
            )}

            {/* Scan Sweep Laser Animation */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-bounce" />
                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-2xs flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <ScanFace className="w-10 h-10 text-sky-300 animate-spin mx-auto" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      EXTRACTING VECTORS ({scanProgress}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* HUD Corner Accents */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-sky-400" />
          </div>

          {/* Action Trigger Bar */}
          <div className="space-y-3 z-10">
            <button
              id="execute-facial-scan-btn"
              type="button"
              onClick={triggerScan}
              disabled={isScanning}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === "MODE_1_PENDING_PROVIDER"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                  : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white"
              } disabled:opacity-50`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Neural Vector Analysis...
                </>
              ) : (
                <>
                  <ScanFace className="w-5 h-5" />
                  {activeMode === "MODE_1_PENDING_PROVIDER"
                    ? `Execute Biometric Verification for ${selectedEmployee.name}`
                    : `Simulate Low-Confidence Mismatch for ${selectedEmployee.name}`}
                </>
              )}
            </button>

            {/* Result banner */}
            {lastScanResult && (
              <div
                id="scan-result-banner"
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  lastScanResult.status === "SUCCESS"
                    ? "bg-blue-950/80 text-blue-200 border-blue-500/40"
                    : "bg-rose-950/80 text-rose-200 border-rose-500/40"
                }`}
              >
                {lastScanResult.status === "SUCCESS" ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {lastScanResult.status === "SUCCESS"
                      ? `Access Granted (${lastScanResult.confidence}% confidence)`
                      : "Verification Rejected - Mandatory Override Triggered"}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">{lastScanResult.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controller, Identity Selector & Boundary Spec */}
        <div className="lg:col-span-5 space-y-4">
          {/* Identity Anchor & Face Matcher Dropdown Card */}
          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Employee Biometric Roster</span>
              </h3>
              <span className="font-mono text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {completeRoster.length}/15 Enrolled
              </span>
            </div>

            {/* Custom Interactive Face Matcher Dropdown with Live Search */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Face Matcher Search & Selection Dropdown:
              </label>

              {/* Trigger Button */}
              <button
                id="face-matcher-dropdown-trigger"
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer text-left focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shrink-0">
                    {selectedEmployee.id}
                  </span>
                  <span className="font-bold truncate">{selectedEmployee.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                    • {selectedEmployee.designation}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Panel with Search & max-h-60 overflow-y-auto */}
              {isDropdownOpen && (
                <div
                  id="face-matcher-dropdown-panel"
                  className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#101A30] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Live Search Input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      id="face-matcher-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by ID, name, or designation..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>

                  {/* Scrollable List containing ALL 15 active employees */}
                  <div
                    id="face-matcher-scrollable-list"
                    className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                  >
                    {filteredRoster.length > 0 ? (
                      filteredRoster.map((emp) => {
                        const isSelected = emp.id === selectedEmpId;
                        return (
                          <button
                            key={emp.id}
                            id={`face-matcher-item-${emp.id.toLowerCase()}`}
                            type="button"
                            onClick={() => {
                              setSelectedEmpId(emp.id);
                              setLastScanResult(null);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-semibold shadow-xs"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? "bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-950"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {emp.id}
                                </span>
                                <span className="text-xs font-bold truncate">
                                  {emp.name}
                                </span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-sky-300 dark:text-slate-950 shrink-0 inline" />
                                )}
                              </div>
                              <p
                                className={`text-[11px] truncate mt-0.5 ${
                                  isSelected
                                    ? "text-blue-100 dark:text-slate-900 font-normal"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {emp.designation}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                isSelected
                                  ? "bg-white/20 border-transparent text-white dark:bg-slate-900/30 dark:text-slate-950"
                                  : "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              }`}
                            >
                              Ready
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No employee found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accessible Native Select Dropdown mirroring all 15 active employees */}
            <div>
              <label
                htmlFor="select-test-employee"
                className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1"
              >
                Standard Form Selector (All 15 Profiles):
              </label>
              <select
                id="select-test-employee"
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setLastScanResult(null);
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none cursor-pointer max-h-60 overflow-y-auto"
              >
                {completeRoster.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} — {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Profile Detail Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Target Identity:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedEmployee.name} ({selectedEmployee.id})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Designation:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {selectedEmployee.designation}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Master Status:</span>
                <StatusBadge label={selectedEmployee.status} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Biometric Template:</span>
                <span className="font-mono text-blue-600 dark:text-sky-400 font-semibold">
                  ENROLLED (v2.4)
                </span>
              </div>
            </div>
          </div>

          {/* Integration Specification & Mode Documentation */}
          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              Architectural Boundary Contract
            </h3>
            <p className="leading-relaxed">
              This station represents the hardware-software perimeter boundary.
              Production environments swap the internal simulation hook with:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">AWS Rekognition:</strong> `SearchFacesByImage` against registered S3 collection.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Azure Face API:</strong> `Face - Identify` with liveness detection and confidence matching.
              </li>
            </ul>

            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-500" />
                Tamper-Proof Audit Logging Active
              </div>
              <div>
                Every optical attempt (matching confidence scores, device telemetry, and supervisor overrides) is written directly to the append-only Activity Log.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode 2: Authorized Manual Verification Fallback Modal */}
      {showFallbackModal && (
        <div
          id="manual-fallback-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            id="manual-fallback-modal"
            className="w-full max-w-lg bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  Authorized Manual Verification Fallback
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-400">
                  Biometric mismatch threshold triggered. Supervisor credentials required to override.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualOverrideSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Target Employee:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedEmployee.name} ({selectedEmployee.id})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Failed AI Match:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    64.2% (Required &ge; 85%)
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-supervisor-emp-id"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Authorizing Supervisor Employee ID *
                </label>
                {/* Supervisor quick select dropdown from the 15 active employees */}
                <select
                  id="select-supervisor-roster"
                  value={supervisorEmpId}
                  onChange={(e) => setSupervisorEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none mb-2 cursor-pointer max-h-60 overflow-y-auto"
                >
                  {completeRoster.map((emp) => (
                    <option key={`sup-${emp.id}`} value={emp.id}>
                      {emp.id} — {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
                <input
                  id="input-supervisor-emp-id"
                  type="text"
                  value={supervisorEmpId}
                  onChange={(e) => setSupervisorEmpId(e.target.value)}
                  placeholder="e.g. MTK005 (Subhasish Das)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="input-supervisor-pin"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Supervisor Security PIN *
                </label>
                <input
                  id="input-supervisor-pin"
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="4-digit override PIN"
                  maxLength={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="textarea-override-notes"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Mandatory Override Justification Notes *
                </label>
                <textarea
                  id="textarea-override-notes"
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Detail lighting conditions, physical camera obstruction, or secondary ID verification..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-fallback-btn"
                  onClick={() => setShowFallbackModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-override-btn"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-slate-950 font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Authorize Check-In & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
