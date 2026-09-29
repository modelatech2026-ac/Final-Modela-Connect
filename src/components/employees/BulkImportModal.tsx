import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Check,
  RefreshCw,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Employee } from "../../types";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedEmployeeRow {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  doj: string;
  designation: string;
  contact: string;
  isValid: boolean;
  validationError?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { bulkCreateEmployees, getNextEmployeeId } = useData();
  const { success, error: toastError } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      "Emp ID,Name,DOJ,Designation,Contact\n" +
      "MOD001,Sourav Ganguly,2026-09-15,Senior BIM Engineer,9830012345\n" +
      "MOD002,Pooja Sharma,2026-09-16,MEP Designer,9876543210\n" +
      "MOD003,Rahul Banerjee,2026-09-16,Automation Associate,8899776655";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Modela_Connect_Employee_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVText = (text: string) => {
    setParseError(null);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      setParseError("The CSV file must contain a header row and at least one employee data row.");
      return;
    }

    // Parse header
    const headers = lines[0]
      .split(",")
      .map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

    const idIdx = headers.findIndex(
      (h) => h.includes("id") || h.includes("emp id") || h.includes("empid")
    );
    const nameIdx = headers.findIndex(
      (h) => h.includes("name") || h.includes("employee")
    );
    const dojIdx = headers.findIndex(
      (h) => h.includes("doj") || h.includes("join") || h.includes("date")
    );
    const desigIdx = headers.findIndex(
      (h) => h.includes("designation") || h.includes("role") || h.includes("title")
    );
    const contactIdx = headers.findIndex(
      (h) => h.includes("contact") || h.includes("phone") || h.includes("mobile")
    );

    if (nameIdx === -1) {
      setParseError(
        "Could not detect 'Name' column. Please ensure header includes: Emp ID, Name, DOJ, Designation, Contact."
      );
      return;
    }

    const rows: ParsedEmployeeRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV line parser respecting quotes
      const rawCols: string[] = [];
      let inQuotes = false;
      let curVal = "";
      for (let c = 0; c < lines[i].length; c++) {
        const char = lines[i][c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          rawCols.push(curVal.trim());
          curVal = "";
        } else {
          curVal += char;
        }
      }
      rawCols.push(curVal.trim());

      const empId = idIdx !== -1 && rawCols[idIdx] ? rawCols[idIdx].trim() : "";
      const rawName = nameIdx !== -1 && rawCols[nameIdx] ? rawCols[nameIdx].trim() : "";
      const doj = dojIdx !== -1 && rawCols[dojIdx] ? rawCols[dojIdx].trim() : "";
      const designation = desigIdx !== -1 && rawCols[desigIdx] ? rawCols[desigIdx].trim() : "";
      const contact = contactIdx !== -1 && rawCols[contactIdx] ? rawCols[contactIdx].trim() : "";

      if (!rawName && !empId && !designation) {
        continue;
      }

      // Split Name into First & Last
      const nameParts = rawName.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "Employee";
      const lastName = nameParts.slice(1).join(" ") || "";

      let isValid = true;
      let validationError = "";

      if (!rawName) {
        isValid = false;
        validationError = "Missing Name";
      }

      rows.push({
        id: empId,
        fullName: rawName,
        firstName,
        lastName,
        doj: doj || new Date().toISOString().split("T")[0],
        designation: designation || "Staff",
        contact: contact || "—",
        isValid,
        validationError,
      });
    }

    if (rows.length === 0) {
      setParseError("No valid employee rows detected in CSV.");
      return;
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Please select a standard .csv file format.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCSVText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Please drop a valid .csv file format.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCSVText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toastError("Import Error", "No valid employee rows to import.");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = validRows.map((r) => ({
        id: r.id || undefined,
        firstName: r.firstName,
        lastName: r.lastName,
        joiningDate: r.doj,
        designation: r.designation,
        phone: r.contact !== "—" ? r.contact : "",
        department: deriveDepartment(r.designation),
        status: "ACTIVE" as const,
      }));

      await bulkCreateEmployees(payload);

      setIsProcessing(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsProcessing(false);
      toastError("Import Failed", err.message || "An unexpected error occurred during batch write.");
    }
  };

  const deriveDepartment = (designation: string): string => {
    const d = designation.toLowerCase();
    if (d.includes("hod") || d.includes("mep")) return "MEP & Automation";
    if (d.includes("acs") || d.includes("bim")) return "BIM Engineering";
    if (d.includes("development") || d.includes("sales")) return "Business Development";
    if (d.includes("hr") || d.includes("admin")) return "HR & Admin";
    if (d.includes("intern") || d.includes("operations")) return "Operations";
    return "Engineering";
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div
      id="bulk-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="bulk-import-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between bg-stone-50/70 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Bulk Import Employee Master (CSV)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Upload CSV dataset containing Emp ID, Name, DOJ, Designation, and Contact.
              </p>
            </div>
          </div>

          <button
            id="close-bulk-import-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Instructions & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200/60 dark:border-slate-700 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-stone-800 dark:text-stone-200">
                Required Columns:
              </span>
              <p className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                Emp ID, Name, DOJ, Designation, Contact
              </p>
            </div>
            <button
              id="download-csv-sample-btn"
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300 font-semibold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              Download Template
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            id="csv-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]"
                : "border-stone-300 dark:border-slate-700 hover:border-blue-500/70 hover:bg-stone-50/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
              {fileName ? (
                <span className="text-blue-700 dark:text-sky-400">{fileName}</span>
              ) : (
                "Click to browse or drag and drop your CSV file here"
              )}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Supports standard comma-separated .csv files up to 5MB
            </p>
          </div>

          {/* Parsing Errors */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Preview ({validCount} Valid Records Ready)
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-sky-400">
                  Total parsed: {parsedRows.length}
                </span>
              </div>

              <div className="border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-stone-100 dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 text-[11px] font-bold text-stone-600 dark:text-stone-400">
                    <tr>
                      <th className="py-2.5 px-3">Emp ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">DOJ</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.isValid
                            ? "hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
                            : "bg-rose-50/40 dark:bg-rose-950/30 text-rose-700"
                        }
                      >
                        <td className="py-2 px-3 font-mono font-bold text-blue-900 dark:text-sky-400">
                          {row.id || (
                            <span className="text-stone-400 text-[11px]">Auto-Gen</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-stone-900 dark:text-stone-100">
                          {row.fullName}
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-600 dark:text-stone-400">
                          {row.doj}
                        </td>
                        <td className="py-2 px-3 text-stone-700 dark:text-stone-300">
                          {row.designation}
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-700 dark:text-stone-300">
                          {row.contact}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-sky-400">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <AlertCircle className="w-3 h-3" /> {row.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="commit-bulk-import-btn"
            type="button"
            onClick={handleCommitImport}
            disabled={isProcessing || validCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Writing Batch to Database...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Import {validCount > 0 ? `${validCount} Employees` : "Records"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
