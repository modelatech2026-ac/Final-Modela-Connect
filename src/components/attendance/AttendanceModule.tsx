import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  ScanFace,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../ui/StatusBadge";

export const AttendanceModule: React.FC = () => {
  const { attendanceRecords, employees } = useData();
  const { currentUser, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isEmployee = !isSuperAdmin && !isAdmin;
  const myEmployeeId = currentUser?.employeeId || "MOD004";

  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRecords = attendanceRecords.filter((rec) => {
    if (isEmployee && rec.employeeId !== myEmployeeId) return false;
    const matchesMethod = methodFilter === "ALL" || rec.verificationMethod === methodFilter;
    const matchesStatus = statusFilter === "ALL" || rec.status === statusFilter;
    return matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Attendance & Time Tracking
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Biometric Synchronized
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-0.5">
            Real-time biometric checkpoint records and supervisory override timestamps.
          </p>
        </div>

        <button
          id="go-to-facial-scanner-btn"
          onClick={() => navigate("/facial-verification")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <ScanFace className="w-4 h-4" />
          Open Facial Verification Station
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          Filter Records:
        </span>

        <select
          id="attendance-method-filter"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-[#22C55E]/40"
        >
          <option value="ALL">All Verification Methods</option>
          <option value="FACIAL_AI">Facial AI Neural Match</option>
          <option value="MANUAL_OVERRIDE">Manual Supervisor Override</option>
          <option value="RFID_CARD">RFID Perimeter Badge</option>
        </select>

        <select
          id="attendance-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:ring-2 focus:ring-[#22C55E]/40"
        >
          <option value="ALL">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>

        <span className="text-xs text-stone-400 ml-auto font-medium">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7FAF3] border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supervisor Override Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                return (
                  <tr key={rec.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-stone-700">{rec.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : rec.employeeId}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">{rec.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">
                      {rec.checkInTime}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">{rec.checkOutTime}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          rec.verificationMethod === "FACIAL_AI"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : rec.verificationMethod === "MANUAL_OVERRIDE"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {rec.verificationMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700">
                      {rec.confidenceScore ? `${rec.confidenceScore}%` : "100%"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={rec.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate text-[11px]">
                      {rec.overrideNotes ? (
                        <span className="text-amber-800 font-medium">
                          {rec.overrideNotes} (by {rec.overrideApprovedBy})
                        </span>
                      ) : (
                        <span className="text-stone-400">Automated Match</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
