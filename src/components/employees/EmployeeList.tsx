import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  ArrowUpDown,
  Download,
  Upload,
} from "lucide-react";
import { Employee } from "../../types";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { TableSkeleton } from "../ui/Skeleton";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { EmployeeProfileView } from "./EmployeeProfileView";
import { BulkImportModal } from "./BulkImportModal";

export const EmployeeList: React.FC = () => {
  const { employees, deleteEmployee, isLoading } = useData();
  const { currentRole, currentUser, isSuperAdmin, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  // Search & Filter State
  const initialSearch = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortField, setSortField] = useState<"id" | "name" | "doj" | "designation">("id");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const canManage = isSuperAdmin || isAdmin;

  // Filtered & Sorted employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const query = searchTerm.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const empId = emp.id.toLowerCase();
        const phone = (emp.phone || "").toLowerCase();
        const designation = emp.designation.toLowerCase();
        const doj = (emp.joiningDate || "").toLowerCase();

        return (
          fullName.includes(query) ||
          empId.includes(query) ||
          phone.includes(query) ||
          designation.includes(query) ||
          doj.includes(query)
        );
      })
      .sort((a, b) => {
        let valA = "";
        let valB = "";

        if (sortField === "id") {
          valA = a.id;
          valB = b.id;
        } else if (sortField === "name") {
          valA = `${a.firstName} ${a.lastName}`;
          valB = `${b.firstName} ${b.lastName}`;
        } else if (sortField === "doj") {
          valA = a.joiningDate || "";
          valB = b.joiningDate || "";
        } else if (sortField === "designation") {
          valA = a.designation || "";
          valB = b.designation || "";
        }

        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [employees, searchTerm, sortField, sortAsc]);

  const toggleSort = (field: "id" | "name" | "doj" | "designation") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Emp ID,Name,DOJ,Designation,Contact Phone"];
    const rows = filteredEmployees.map(
      (e) =>
        `"${e.id}","${e.firstName} ${e.lastName}","${e.joiningDate}","${e.designation}","${e.phone || ""}"`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Modela_Connect_Employees_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Employee Master
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
              {filteredEmployees.length} Records
            </span>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
            Authoritative directory tracking employee identity, joining date, designation, and contact details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="export-employees-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            Export CSV
          </button>

          {canManage && (
            <>
              <button
                id="bulk-import-employees-btn"
                onClick={() => setIsBulkImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-900 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Bulk Import CSV
              </button>

              <button
                id="add-new-employee-btn"
                onClick={() => {
                  setEmployeeToEdit(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add New Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            id="employee-filter-search-input"
            type="text"
            placeholder="Search by Emp ID, Name, DOJ, Designation, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-stone-50 dark:bg-stone-900/80 hover:bg-stone-100/80 dark:hover:bg-stone-900 focus:bg-white dark:focus:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200/80 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <TableSkeleton rows={6} cols={6} />}

      {/* Empty State */}
      {!isLoading && filteredEmployees.length === 0 && (
        <div
          id="employee-master-empty-state"
          className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-stone-300 dark:border-slate-800 shadow-xs space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800/40">
            {employees.length === 0 ? <UserPlus className="w-7 h-7" /> : <Search className="w-7 h-7" />}
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {employees.length === 0
                ? "Employee Master Directory Ready"
                : "No matching employees found"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
              {employees.length === 0
                ? "The employee database is currently clean. Click 'Add New Employee' to register records with Emp ID, Name, DOJ, Designation, and Contact information."
                : `No employee records matched "${searchTerm}". Try clearing your query or adding a new employee.`}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
            {employees.length > 0 && (
              <button
                id="empty-state-reset-filters-btn"
                onClick={() => setSearchTerm("")}
                className="px-4 py-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-stone-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Reset Search
              </button>
            )}
            {canManage && (
              <button
                id="empty-state-add-employee-btn"
                onClick={() => {
                  setEmployeeToEdit(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Add New Employee
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Master Table View */}
      {!isLoading && filteredEmployees.length > 0 && (
        <div className="hidden md:block bg-white dark:bg-[#141F14] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7FAF3] dark:bg-[#101910] border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  {/* Emp ID */}
                  <th
                    onClick={() => toggleSort("id")}
                    className="py-3.5 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors w-32"
                  >
                    <div className="flex items-center gap-1.5">
                      Emp ID
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Name */}
                  <th
                    onClick={() => toggleSort("name")}
                    className="py-3.5 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Name
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* DOJ */}
                  <th
                    onClick={() => toggleSort("doj")}
                    className="py-3.5 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors w-36"
                  >
                    <div className="flex items-center gap-1.5">
                      DOJ
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Designation */}
                  <th
                    onClick={() => toggleSort("designation")}
                    className="py-3.5 px-4 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Designation
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Contact */}
                  <th className="py-3.5 px-4">
                    Contact
                  </th>

                  {/* Actions */}
                  <th className="py-3.5 px-4 text-right w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    id={`employee-row-${emp.id}`}
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors group"
                  >
                    {/* Emp ID */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 dark:text-sky-400">
                      <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 group-hover:border-blue-500/40 transition-colors inline-block">
                        {emp.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setViewingEmployee(emp)}
                        className="font-bold text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-sky-400 text-left cursor-pointer transition-colors"
                      >
                        {emp.firstName} {emp.lastName}
                      </button>
                    </td>

                    {/* DOJ */}
                    <td className="py-3 px-4 text-stone-700 dark:text-stone-300 font-mono text-xs">
                      {emp.joiningDate}
                    </td>

                    {/* Designation */}
                    <td className="py-3 px-4 text-stone-800 dark:text-stone-200 font-medium">
                      {emp.designation}
                    </td>

                    {/* Contact (Phone Number ONLY) */}
                    <td className="py-3 px-4">
                      <div className="text-stone-800 dark:text-stone-200 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{emp.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`view-emp-${emp.id}`}
                          onClick={() => setViewingEmployee(emp)}
                          title="View Profile Dossier"
                          className="p-1.5 text-stone-500 hover:text-blue-700 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(canManage || currentUser?.employeeId === emp.id) && (
                          <button
                            id={`edit-emp-${emp.id}`}
                            onClick={() => {
                              setEmployeeToEdit(emp);
                              setIsFormOpen(true);
                            }}
                            title={currentUser?.employeeId === emp.id ? "Edit My Profile" : "Edit Record"}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-blue-900 dark:hover:text-sky-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canManage && (
                          <button
                            id={`delete-emp-${emp.id}`}
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete ${emp.firstName} ${emp.lastName} (${emp.id})?`
                                )
                              ) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            title="Delete Record"
                            className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Stacked Card View */}
      {!isLoading && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 md:hidden">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              id={`mobile-emp-card-${emp.id}`}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300 px-1.5 py-0.5 bg-stone-100 dark:bg-slate-800 rounded">
                    {emp.id}
                  </span>
                  <h3
                    onClick={() => setViewingEmployee(emp)}
                    className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 cursor-pointer hover:text-blue-600 dark:hover:text-sky-400"
                  >
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{emp.designation}</p>
                </div>
              </div>

              {/* DOJ & Contact Info */}
              <div className="p-2.5 bg-stone-50 dark:bg-slate-800/80 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 dark:text-stone-500 text-[11px]">DOJ:</span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">{emp.joiningDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 dark:text-stone-500 text-[11px]">Contact:</span>
                  <div className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{emp.phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800">
                <button
                  onClick={() => setViewingEmployee(emp)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-sky-400 hover:text-blue-800 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEmployeeToEdit(emp);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 rounded-lg cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${emp.firstName} ${emp.lastName}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-lg cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employeeToEdit={employeeToEdit}
      />

      {/* Bulk Import CSV Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* Profile Dossier Modal */}
      {viewingEmployee && (
        <EmployeeProfileView
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={(emp) => {
            setEmployeeToEdit(emp);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
};
