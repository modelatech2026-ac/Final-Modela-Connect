import React, { useState } from "react";
import {
  UserPlus,
  CheckCircle2,
  Phone,
  Calendar,
  Briefcase,
  Hash,
  User,
  ArrowRight,
  Plus,
  Users,
  X,
  FileCheck2,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../ui/StatusBadge";

interface OnboardingTaskItem {
  name: string;
  completed: boolean;
}

interface LocalCandidate {
  id: string;
  empId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  doj: string;
  designation: string;
  contact: string;
  progress: number;
  tasks: OnboardingTaskItem[];
}

const DEFAULT_ONBOARDING_MILESTONES = [
  { name: "Verify Official Joining Date (DOJ)", completed: true },
  { name: "Issue Employee ID Badge", completed: true },
  { name: "Verify Phone Contact in Master Directory", completed: false },
  { name: "Countersign Appointment & Role Letter", completed: false },
];

export const OnboardingModule: React.FC = () => {
  const { createEmployee, getNextEmployeeId, employees } = useData();
  const { success, error: toastError } = useToast();

  // Wiped sample onboarding records - clean pipeline
  const [candidates, setCandidates] = useState<LocalCandidate[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form State
  const nextId = getNextEmployeeId();
  const [empId, setEmpId] = useState(nextId);
  const [fullName, setFullName] = useState("");
  const [doj, setDoj] = useState(new Date().toISOString().split("T")[0]);
  const [designation, setDesignation] = useState("");
  const [contact, setContact] = useState("");

  const handleOpenModal = () => {
    setEmpId(getNextEmployeeId());
    setFullName("");
    setDoj(new Date().toISOString().split("T")[0]);
    setDesignation("");
    setContact("");
    setIsNewModalOpen(true);
  };

  const toggleTask = (candidateId: string, taskIndex: number) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const newTasks = [...c.tasks];
        newTasks[taskIndex].completed = !newTasks[taskIndex].completed;
        const completedCount = newTasks.filter((t) => t.completed).length;
        const newProgress = Math.round((completedCount / newTasks.length) * 100);
        return {
          ...c,
          tasks: newTasks,
          progress: newProgress,
        };
      })
    );
  };

  const handleCreateOnboardingCandidate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !designation.trim() || !contact.trim()) {
      toastError("Validation Error", "Please fill in Name, Designation, and Contact Phone.");
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Employee";
    const lastName = nameParts.slice(1).join(" ") || "";
    const cleanId = empId.trim().toUpperCase() || getNextEmployeeId();

    try {
      // Direct insertion into Employee Master database
      await createEmployee({
        id: cleanId,
        firstName,
        lastName,
        joiningDate: doj,
        designation: designation.trim(),
        phone: contact.trim(),
        department: deriveDepartment(designation),
        status: "ONBOARDING",
      });

      // Also add to local tracking card
      const newCand: LocalCandidate = {
        id: "ONB-" + Date.now().toString().slice(-4),
        empId: cleanId,
        fullName: fullName.trim(),
        firstName,
        lastName,
        doj,
        designation: designation.trim(),
        contact: contact.trim(),
        progress: 50,
        tasks: [
          { name: "Verify Official Joining Date (DOJ)", completed: true },
          { name: "Issue Employee ID Badge", completed: true },
          { name: "Verify Phone Contact in Master Directory", completed: false },
          { name: "Countersign Appointment & Role Letter", completed: false },
        ],
      };

      setCandidates((prev) => [newCand, ...prev]);
      setIsNewModalOpen(false);

      success(
        "Onboarding Initiated",
        `${fullName} (${cleanId}) has been registered in the Employee Master and Onboarding pipeline.`
      );
    } catch (err: any) {
      toastError("Onboarding Error", err.message || "Failed to register candidate.");
    }
  };

  const handlePromoteToActive = (cand: LocalCandidate) => {
    success(
      "Candidate Activated",
      `${cand.fullName} (${cand.empId}) onboarding milestones verified. Active status confirmed in Employee Master.`
    );
    setCandidates((prev) => prev.filter((c) => c.id !== cand.id));
  };

  const deriveDepartment = (role: string): string => {
    const r = role.toLowerCase();
    if (r.includes("mep") || r.includes("hod")) return "MEP & Automation";
    if (r.includes("bim") || r.includes("acs")) return "BIM Engineering";
    if (r.includes("sales") || r.includes("development")) return "Business Development";
    if (r.includes("hr") || r.includes("admin")) return "HR & Admin";
    return "Engineering";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Talent Onboarding
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
              {candidates.length} In Progress
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Track onboarding milestones for newly registered employees entering the master roster.
          </p>
        </div>

        <button
          id="open-onboard-new-employee-modal-btn"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Onboard New Employee
        </button>
      </div>

      {/* Empty State */}
      {candidates.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Onboarding Pipeline Clear
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All active personnel have completed onboarding. Register a new candidate to create an entry directly in Employee Master.
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Start Onboarding
          </button>
        </div>
      )}

      {/* Candidates Grid */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-800 dark:text-sky-300 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 rounded border border-blue-200 dark:border-blue-800/60">
                      {cand.empId}
                    </span>
                    <StatusBadge label={cand.progress === 100 ? "ACTIVE" : "ONBOARDING"} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                    {cand.fullName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {cand.designation}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xl font-extrabold text-blue-900 dark:text-sky-400">
                    {cand.progress}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${cand.progress}%` }}
                />
              </div>

              {/* Strict Metadata (DOJ & Contact) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>DOJ: <strong className="font-mono">{cand.doj}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact: <strong className="font-mono">{cand.contact}</strong></span>
                </div>
              </div>

              {/* Task Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Onboarding Milestones
                </span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cand.tasks.map((task, idx) => (
                    <div
                      key={task.name}
                      onClick={() => toggleTask(cand.id, idx)}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-2 rounded-lg transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            task.completed
                              ? "bg-blue-600 text-white"
                              : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`${
                            task.completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-200 font-medium"
                          }`}
                        >
                          {task.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bottom */}
              {cand.progress === 100 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handlePromoteToActive(cand)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Confirm Active in Master
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Onboard New Employee Modal */}
      {isNewModalOpen && (
        <div
          id="onboard-employee-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="onboard-employee-modal-card"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Onboard New Employee
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct entry to Employee Master: Emp ID, Name, DOJ, Designation, Contact.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateOnboardingCandidate} className="p-6 space-y-4 text-xs">
              {/* Emp ID */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emp ID (Authoritative Identifier) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. MTK023"
                    className="w-full pl-9 pr-3 py-2.5 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Mukherjee"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* DOJ */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Joining (DOJ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={doj}
                    onChange={(e) => setDoj(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior BIM Engineer"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact (Phone ONLY) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact (Phone Number ONLY) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. 9831808910"
                    className="w-full pl-9 pr-3 py-2.5 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Register & Create In Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
