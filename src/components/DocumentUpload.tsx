import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Check, AlertCircle, Loader2, File } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/firebase";

export type DocumentUploadProps = {
  appId: string;
  documentType: "idScan" | "photo" | "signature" | "certifiedId" | "proofResidence" | "eyeCert" | "learnerCert";
  label: string;
  onUploadComplete: (data: { url: string; uploadedAt: number }) => void;
  isUploaded?: boolean;
  uploadedFileName?: string;
};

export function DocumentUpload({
  appId,
  documentType,
  label,
  onUploadComplete,
  isUploaded = false,
  uploadedFileName,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const result = await uploadDocument(file, appId, documentType);
      onUploadComplete({
        url: result.downloadUrl,
        uploadedAt: result.uploadedAt,
      });
      toast.success(`${label} uploaded successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />

      <div className={`flex items-center justify-between rounded-lg border p-4 transition ${
        isUploaded ? "border-success/40 bg-success/5" : error ? "border-destructive/40 bg-destructive/5" : ""
      }`}>
        <div className="flex items-start gap-3">
          {isUploaded ? (
            <div className="mt-1 text-success">
              <Check className="h-5 w-5" />
            </div>
          ) : error ? (
            <div className="mt-1 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
          ) : (
            <div className="mt-1 text-muted-foreground">
              <File className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isUploaded && uploadedFileName ? (
                <span className="text-success">✓ Uploaded: {uploadedFileName}</span>
              ) : error ? (
                <span className="text-destructive">Error: {error}</span>
              ) : (
                <span>PDF, JPG or PNG · max 50MB · Powered by Catbox</span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant={isUploaded ? "outline" : "default"}
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : isUploaded ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
