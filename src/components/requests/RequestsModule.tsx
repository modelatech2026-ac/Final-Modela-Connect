import React, { useState } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  DollarSign,
  Calendar,
  AlertCircle,
  Send,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../ui/StatusBadge";
import { RequestItem, RequestType } from "../../types";

export const RequestsModule: React.FC = () => {
  const { requests, employees, updateRequestStatus, createRequest } = useData();
  const { currentUser, currentRole } = useAuth();
  const { success, error: toastError } = useToast();

  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Request Form state
  const [reqType, setReqType] = useState<RequestType>("LEAVE");
  const [reqTitle, setReqTitle] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqAmountOrDays, setReqAmountOrDays] = useState("3 Days");

  const canApprove = ["Super Admin", "Admin", "HR Admin", "Manager"].includes(currentRole);

  const filteredRequests = requests.filter((r) => {
    const matchesType = filterType === "ALL" || r.type === filterType;
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    createRequest({
      employeeId: currentUser?.employeeId || "EMP104",
      employeeName: (currentUser?.name || "Marcus Vance").split(" (")[0],
      type: reqType,
      title: reqTitle,
      description: reqDescription,
      amountOrDays: reqAmountOrDays,
    });

    setIsCreateModalOpen(false);
    setReqTitle("");
    setReqDescription("");
    success("Request Submitted", "Your request has been routed to your direct reporting supervisor.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Requests & Approvals Workflow
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Role-Aware Workflow
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-0.5">
            Leave applications, expense reimbursements, and hardware requisition pipelines.
          </p>
        </div>

        <button
          id="new-request-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit New Request
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          Filter:
        </span>

        <select
          id="requests-type-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-[#22C55E]/40"
        >
          <option value="ALL">All Categories</option>
          <option value="LEAVE">Paid Time Off / Leave</option>
          <option value="EXPENSE">Expense Reimbursement</option>
          <option value="EQUIPMENT">Hardware & IT Access</option>
          <option value="GENERAL">General Inquiries</option>
        </select>

        <select
          id="requests-status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-[#22C55E]/40"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Requests Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            id={`request-card-${req.id}`}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stone-600 px-1.5 py-0.5 bg-stone-100 rounded">
                      {req.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {req.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1.5">{req.title}</h3>
                </div>
                <StatusBadge label={req.status} size="sm" />
              </div>

              <p className="text-xs text-stone-600 mt-2 leading-relaxed">{req.description}</p>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-500 text-[11px]">
                <span>Applicant: <strong className="text-stone-800">{req.employeeName}</strong> ({req.employeeId})</span>
                <span>Value / Scope: <strong className="text-stone-800">{req.amountOrDays}</strong></span>
              </div>

              {/* Action Buttons for Managers / HR */}
              {req.status === "PENDING" && canApprove && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id={`reject-req-${req.id}`}
                    onClick={() => {
                      updateRequestStatus(req.id, "REJECTED");
                      toastError("Request Rejected", `Request ${req.id} has been marked as rejected.`);
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    id={`approve-req-${req.id}`}
                    onClick={() => {
                      updateRequestStatus(req.id, "APPROVED");
                      success("Request Approved", `Request ${req.id} was approved by ${currentRole}.`);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#16a34a] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">Submit Administrative Request</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as RequestType)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#22C55E]/40 focus:outline-none"
                >
                  <option value="LEAVE">Leave / Paid Time Off</option>
                  <option value="EXPENSE">Expense Reimbursement</option>
                  <option value="EQUIPMENT">Hardware / Equipment</option>
                  <option value="GENERAL">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Title / Subject *</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Annual Vacation or External Conference Pass"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#22C55E]/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Value or Duration</label>
                <input
                  type="text"
                  value={reqAmountOrDays}
                  onChange={(e) => setReqAmountOrDays(e.target.value)}
                  placeholder="e.g. 5 Business Days or $450 USD"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#22C55E]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Detailed Explanation</label>
                <textarea
                  rows={3}
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Provide context for managerial evaluation..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#22C55E]/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A2E1A] hover:bg-[#253f25] text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
