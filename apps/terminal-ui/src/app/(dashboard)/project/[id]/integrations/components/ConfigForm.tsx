"use client";

import React from "react";
import { clsx } from "clsx";

interface ConfigFieldProps {
    id: string;
    label: string;
    type: "string" | "select" | "json" | "boolean" | "number";
    required?: boolean;
    options?: string[];
    value: any;
    onChange: (value: any) => void;
}

function ConfigField({ id, label, type, required, options, value, onChange }: ConfigFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-[#666] text-xs font-bold tracking-widest uppercase">
                    {label}
                    {required && <span className="text-red-500/50 ml-1">*</span>}
                </label>
                <span className="text-xs text-[#444] font-mono italic opacity-50">{type.toUpperCase()}</span>
            </div>

            {type === "select" ? (
                <select
                    id={id}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-black border border-[#2A2A2E] rounded p-2 text-xs text-[#D8D8D8] outline-none focus:border-fuchsia-500/50 transition-colors uppercase font-mono"
                >
                    <option value="" disabled>SELECT_OPTION</option>
                    {options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : type === "json" ? (
                <textarea
                    id={id}
                    value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || "")}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            onChange(parsed);
                        } catch {
                            onChange(e.target.value);
                        }
                    }}
                    className="w-full h-32 bg-black border border-[#2A2A2E] rounded p-3 text-xs font-mono text-fuchsia-500/80 outline-none focus:border-fuchsia-500/50 transition-colors resize-none custom-scrollbar uppercase placeholder:text-[#333]"
                />
            ) : (
                <input
                    id={id}
                    type={type === "number" ? "number" : "text"}
                    value={value || ""}
                    onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={`ENTER_${id.toUpperCase()}`}
                    className="w-full bg-black border border-[#2A2A2E] rounded p-2 text-xs text-[#D8D8D8] outline-none focus:border-fuchsia-500/50 transition-colors font-mono uppercase placeholder:text-[#333]"
                    autoComplete="off"
                />
            )}
        </div>
    );
}

interface ConfigFormProps {
    schema: Record<string, any>;
    values: Record<string, any>;
    onChange: (field: string, value: any) => void;
}

export function ConfigForm({ schema, values, onChange }: ConfigFormProps) {
    if (!schema || Object.keys(schema).length === 0) {
        return (
            <div className="p-4 border border-[#2A2A2E] bg-black/20 rounded border-dashed text-center">
                <p className="text-[#444] text-xs font-mono italic">- NO_CONFIGURATION_REQUIRED -</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {Object.entries(schema).map(([key, field]) => (
                <ConfigField
                    key={key}
                    id={key}
                    label={field.label || key}
                    type={field.type || "string"}
                    required={field.required}
                    options={field.options}
                    value={values[key]}
                    onChange={(val) => onChange(key, val)}
                />
            ))}
        </div>
    );
}
