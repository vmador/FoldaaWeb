"use client"
import React, { useState, useEffect, useRef } from "react"
import {
    Upload,
    Trash2,
    Check,
    AlertCircle,
    Lock,
    Calendar,
    FileText,
    Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

interface CertificateUploaderProps {
    projectId: string
    onCertificateUploaded?: () => void
}

interface Certificate {
    id: string
    cert_name: string
    cert_expires_at: string
    profile_name: string
    profile_bundle_id: string
    profile_expires_at: string
    profile_type: string
    is_valid: boolean
    created_at: string
}

async function calculateSHA256(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function CertificateUploader({
    projectId,
    onCertificateUploaded,
}: CertificateUploaderProps) {
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [p12File, setP12File] = useState<File | null>(null)
    const [p12Password, setP12Password] = useState("")
    const [provisioningFile, setProvisioningFile] = useState<File | null>(null)

    const p12InputRef = useRef<HTMLInputElement>(null)
    const provisioningInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadCertificates()
    }, [projectId])

    const loadCertificates = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("ios_certificates")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })

            if (error) throw error
            setCertificates(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleP12Select = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.name.endsWith(".p12")) {
            setError("Please select a .p12 file")
            return
        }
        setP12File(file)
        setError("")
    }

    const handleProvisioningSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.name.endsWith(".mobileprovision")) {
            setError("Please select a .mobileprovision file")
            return
        }
        setProvisioningFile(file)
        setError("")
    }

    const handleUpload = async () => {
        if (!p12File || !p12Password || !provisioningFile) {
            setError("Please provide all required files and password")
            return
        }

        setUploading(true)
        setError("")
        setSuccess("")

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("Not authenticated")

            const p12SHA256 = await calculateSHA256(p12File)

            const formData = new FormData()
            formData.append("p12_file", p12File)
            formData.append("p12_password", p12Password)
            formData.append("provisioning_file", provisioningFile)
            formData.append("project_id", projectId)
            formData.append("p12_sha256_frontend", p12SHA256)

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-ios-certificate`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || `Upload failed with status ${response.status}`)
            }

            const result = await response.json()
            if (!result.success) throw new Error(result.error || "Failed to upload certificate")

            setSuccess("Certificate uploaded successfully!")
            setP12File(null)
            setP12Password("")
            setProvisioningFile(null)
            if (p12InputRef.current) p12InputRef.current.value = ""
            if (provisioningInputRef.current) provisioningInputRef.current.value = ""

            await loadCertificates()
            onCertificateUploaded?.()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            setError(err.message || "Failed to upload certificate")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (certId: string) => {
        if (!confirm("Are you sure you want to delete this certificate?")) return
        try {
            const { error } = await supabase.from("ios_certificates").delete().eq("id", certId)
            if (error) throw error
            setSuccess("Certificate deleted")
            await loadCertificates()
            setTimeout(() => setSuccess(""), 2000)
        } catch (err: any) {
            setError(err.message || "Failed to delete certificate")
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }

    const isExpired = (dateString: string) => new Date(dateString) < new Date()

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-5 h-5 text-[#666] animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            {/* Alerts */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div className="flex-1">{error}</div>
                    <button onClick={() => setError("")} className="hover:text-red-300">×</button>
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] text-xs text-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                </div>
            )}

            {/* Upload Form */}
            <div className="bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90">Upload New Certificate</h3>
                
                <div className="grid gap-4">
                    <div>
                        <label className="block text-[11px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">Distribution Certificate (.p12)</label>
                        <input ref={p12InputRef} type="file" accept=".p12" onChange={handleP12Select} className="hidden" />
                        <button
                            onClick={() => p12InputRef.current?.click()}
                            className="w-full h-10 border border-dashed border-[#2A2A2E] rounded-[10px] flex items-center justify-center gap-2 text-xs text-[#666] hover:bg-[#1C1C1E] hover:border-[#3A3A3E] transition-all"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            {p12File ? p12File.name : "Choose .p12 file"}
                        </button>
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">Certificate Password</label>
                        <input
                            type="password"
                            value={p12Password}
                            onChange={(e) => setP12Password(e.target.value)}
                            placeholder="Enter password"
                            className="w-full h-10 bg-transparent border border-[#2A2A2E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#3A3A3E] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">Provisioning Profile (.mobileprovision)</label>
                        <input ref={provisioningInputRef} type="file" accept=".mobileprovision" onChange={handleProvisioningSelect} className="hidden" />
                        <button
                            onClick={() => provisioningInputRef.current?.click()}
                            className="w-full h-10 border border-dashed border-[#2A2A2E] rounded-[10px] flex items-center justify-center gap-2 text-xs text-[#666] hover:bg-[#1C1C1E] hover:border-[#3A3A3E] transition-all"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            {provisioningFile ? provisioningFile.name : "Choose .mobileprovision file"}
                        </button>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !p12File || !p12Password || !provisioningFile}
                        className={clsx(
                            "w-full h-10 rounded-[10px] text-xs font-bold transition-all",
                            uploading || !p12File || !p12Password || !provisioningFile
                                ? "bg-[#1C1C1E] text-[#444] cursor-not-allowed"
                                : "bg-white text-black hover:bg-[#E0E0E0]"
                        )}
                    >
                        {uploading ? "Uploading..." : "Upload Certificate"}
                    </button>
                </div>
            </div>

            {/* Existing Certificates */}
            {certificates.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Your Certificates</h3>
                    <div className="grid gap-3">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#1C1C1E] flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-[#888]" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{cert.cert_name || "iOS Distribution"}</div>
                                            <div className="text-[10px] font-mono text-[#666]">{cert.profile_bundle_id}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(cert.id)} className="p-1.5 text-[#444] hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1C1C1E]">
                                    <div>
                                        <div className="text-[10px] text-[#666] mb-1 flex items-center gap-1.5"><Lock className="w-2.5 h-2.5" /> Cert Expiry</div>
                                        <div className={clsx("text-xs font-mono", isExpired(cert.cert_expires_at) ? "text-red-400" : "text-[#888]")}>
                                            {formatDate(cert.cert_expires_at)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[#666] mb-1 flex items-center gap-1.5"><Calendar className="w-2.5 h-2.5" /> Profile Expiry</div>
                                        <div className={clsx("text-xs font-mono", isExpired(cert.profile_expires_at) ? "text-red-400" : "text-[#888]")}>
                                            {formatDate(cert.profile_expires_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className={clsx(
                                    "inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                    cert.is_valid && !isExpired(cert.cert_expires_at) && !isExpired(cert.profile_expires_at)
                                        ? "bg-green-500/5 text-green-500/80 border-green-500/10"
                                        : "bg-red-500/5 text-red-500/80 border-red-500/10"
                                )}>
                                    <div className={clsx("w-1.5 h-1.5 rounded-full", cert.is_valid ? "bg-green-500" : "bg-red-500")} />
                                    {cert.is_valid && !isExpired(cert.cert_expires_at) ? "✓ Valid" : "⚠ Expired"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
