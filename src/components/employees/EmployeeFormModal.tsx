import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, UserPlus, Save, Calendar, Briefcase, Phone, Hash, User } from "lucide-react";
import { Employee } from "../../types";
import { useData } from "../../context/DataContext";

const employeeSchema = z.object({
  empId: z.string().min(2, "Emp ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  doj: z.string().min(4, "Date of Joining (DOJ) is required"),
  designation: z.string().min(2, "Designation is required"),
  phone: z.string().min(5, "Contact phone number is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { createEmployee, updateEmployee, getNextEmployeeId } = useData();

  const nextEmpId = employeeToEdit ? employeeToEdit.id : getNextEmployeeId();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      empId: nextEmpId,
      firstName: "",
      lastName: "",
      doj: new Date().toISOString().split("T")[0],
      designation: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (employeeToEdit) {
      reset({
        empId: employeeToEdit.id,
        firstName: employeeToEdit.firstName,
        lastName: employeeToEdit.lastName,
        doj: employeeToEdit.joiningDate,
        designation: employeeToEdit.designation,
        phone: employeeToEdit.phone || "",
      });
    } else {
      reset({
        empId: nextEmpId,
        firstName: "",
        lastName: "",
        doj: new Date().toISOString().split("T")[0],
        designation: "",
        phone: "",
      });
    }
  }, [employeeToEdit, nextEmpId, reset]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employeeToEdit) {
        await updateEmployee(employeeToEdit.id, {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          joiningDate: data.doj,
          designation: data.designation.trim(),
          phone: data.phone.trim(),
        });
      } else {
        await createEmployee({
          id: data.empId.trim().toUpperCase(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          joiningDate: data.doj,
          designation: data.designation.trim(),
          phone: data.phone.trim(),
          department: "MEP & Automation",
          status: "ACTIVE",
          managerId: "MTK005",
          managerName: "Subhasish Das",
          compensation: { basic: 30000, allowances: 10000 },
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save employee:", err);
    }
  };

  return (
    <div
      id="employee-form-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="employee-form-modal-container"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
              {employeeToEdit ? <Briefcase className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
                {employeeToEdit ? "Edit Employee Record" : "Add New Employee"}
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Enter details matching the central Employee Master schema.
              </p>
            </div>
          </div>

          <button
            id="close-employee-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 rounded-xl hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Emp ID Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              Emp ID <span className="text-blue-600 dark:text-sky-400 font-normal">(Authoritative Identifier)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                id="input-emp-id"
                type="text"
                {...register("empId")}
                disabled={Boolean(employeeToEdit)}
                placeholder="e.g. EMP101"
                className={`w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl border transition-colors ${
                  employeeToEdit
                    ? "bg-stone-100 dark:bg-slate-800/60 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700 cursor-not-allowed"
                    : "bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                }`}
              />
            </div>
            {errors.empId && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.empId.message}</p>
            )}
          </div>

          {/* Name Fields (First Name & Last Name) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  id="input-first-name"
                  type="text"
                  {...register("firstName")}
                  placeholder="e.g. Jordan"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>
              {errors.firstName && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                <input
                  id="input-last-name"
                  type="text"
                  {...register("lastName")}
                  placeholder="e.g. Taylor"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>
              {errors.lastName && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* DOJ (Date of Joining) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              DOJ (Date of Joining) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                id="input-doj"
                type="date"
                {...register("doj")}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-xl bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.doj && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.doj.message}</p>
            )}
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              Designation (Job Title/Position) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                id="input-designation"
                type="text"
                {...register("designation")}
                placeholder="e.g. Senior Software Engineer"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.designation && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.designation.message}</p>
            )}
          </div>

          {/* Contact (Phone Number ONLY) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              Contact (Phone Number) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                id="input-phone"
                type="text"
                {...register("phone")}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              id="cancel-employee-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-employee-modal-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {employeeToEdit ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
