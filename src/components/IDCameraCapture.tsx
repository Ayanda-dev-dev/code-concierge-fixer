import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Camera, RotateCcw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/firebase";
import { dataUrlToBlob } from "@/lib/catbox";

export type IDCameraCaptureProps = {
  appId: string;
  onCapturesComplete: (data: {
    frontUrl: string;
    backUrl: string;
    uploadedAt: number;
  }) => void;
  isUploaded?: boolean;
};

const CAPTURE_INSTRUCTIONS = {
  front: "📷 Place the FRONT of your South African ID card in the frame. Ensure it's well-lit and clearly visible.",
  back: "📷 Place the BACK of your South African ID card in the frame. Ensure it's well-lit and clearly visible.",
};

export function IDCameraCapture({
  appId,
  onCapturesComplete,
  isUploaded = false,
}: IDCameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [captureState, setCaptureState] = useState<"front" | "back" | "complete">(
    isUploaded ? "complete" : "front"
  );
  const [frontCapture, setFrontCapture] = useState<string | null>(null);
  const [backCapture, setBackCapture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback(() => {
    setCameraError(
      "Camera access denied. Please check your browser permissions and try again."
    );
    setCameraReady(false);
  }, []);

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) {
      setError("Camera not ready");
      return;
    }

    try {
      setError(null);
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture photo");
        return;
      }

      if (captureState === "front") {
        setFrontCapture(imageSrc);
        setCaptureState("back");
        toast.success("Front photo captured. Now capture the back.");
      } else if (captureState === "back") {
        setBackCapture(imageSrc);
        setCaptureState("complete");
        // Auto-upload after both captures
        await handleUpload(imageSrc);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Capture failed";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }, [captureState]);

  const handleUpload = async (backImageUrl?: string) => {
    if (!frontCapture || !backImageUrl) {
      setError("Both captures are required");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert data URLs to blobs
      const frontBlob = dataUrlToBlob(frontCapture);
      const backBlob = dataUrlToBlob(backImageUrl);

      // Upload front photo
      const frontResult = await uploadDocument(
        new File([frontBlob], "id_front.jpg", { type: "image/jpeg" }),
        appId,
        "idScan_front"
      );

      // Upload back photo
      const backResult = await uploadDocument(
        new File([backBlob], "id_back.jpg", { type: "image/jpeg" }),
        appId,
        "idScan_back"
      );

      toast.success("ID photos uploaded successfully");
      
      // Keep the captures in state so they can be displayed
      setIsUploading(false);
      setUploadSuccess(true);
      
      onCapturesComplete({
        frontUrl: frontResult.downloadUrl,
        backUrl: backResult.downloadUrl,
        uploadedAt: Math.max(frontResult.uploadedAt, backResult.uploadedAt),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsUploading(false);
    }
  };

  const handleRetake = (side: "front" | "back") => {
    if (side === "front") {
      setFrontCapture(null);
      setCaptureState("front");
      setError(null);
      setUploadSuccess(false);
    } else if (side === "back") {
      setBackCapture(null);
      setCaptureState("back");
      setError(null);
      setUploadSuccess(false);
    }
  };

  const handleRetakeAll = () => {
    setFrontCapture(null);
    setBackCapture(null);
    setCaptureState("front");
    setError(null);
    setUploadSuccess(false);
  };

  if (isUploaded || uploadSuccess) {
    return (
      <Card className="w-full border-success/40 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            ID Photos Captured & Uploaded
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your South African ID photos have been successfully captured and uploaded.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {frontCapture && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Front Photo</p>
                <img
                  src={frontCapture}
                  alt="ID Front"
                  className="h-48 w-full rounded-lg object-cover border border-success/20"
                />
              </div>
            )}
            {backCapture && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Back Photo</p>
                <img
                  src={backCapture}
                  alt="ID Back"
                  className="h-48 w-full rounded-lg object-cover border border-success/20"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (captureState === "complete" && frontCapture && backCapture) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Review Your ID Photos</CardTitle>
          <CardDescription>
            Verify that both photos are clear and readable before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Front Photo</p>
              <img
                src={frontCapture}
                alt="ID Front"
                className="h-48 w-full rounded-lg object-cover"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetake("front")}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Front
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Back Photo</p>
              <img
                src={backCapture}
                alt="ID Back"
                className="h-48 w-full rounded-lg object-cover"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetake("back")}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Back
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRetakeAll}
              disabled={isUploading}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake All
            </Button>
            <Button
              onClick={() => handleUpload(backCapture)}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm & Upload
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {captureState === "front" ? "Capture ID Front" : "Capture ID Back"}
        </CardTitle>
        <CardDescription>
          {CAPTURE_INSTRUCTIONS[captureState]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cameraError ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Camera Access Required</p>
              <p className="text-xs text-destructive/80">{cameraError}</p>
              <p className="text-xs text-destructive/80 mt-2">
                To proceed:
              </p>
              <ul className="list-inside list-disc text-xs text-destructive/80 space-y-1">
                <li>Check your browser camera permissions</li>
                <li>Refresh the page and try again</li>
                <li>Ensure your device has a working camera</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-lg bg-black">
              <Webcam
                ref={webcamRef}
                onUserMedia={handleCameraReady}
                onUserMediaError={handleCameraError}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "user",
                }}
                className="h-96 w-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 border-2 border-yellow-400 opacity-30" />
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              {captureState === "back" && (
                <Button
                  variant="outline"
                  onClick={() => handleRetake("front")}
                  disabled={!cameraReady}
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Back to Front
                </Button>
              )}
              <Button
                onClick={handleCapture}
                disabled={!cameraReady}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-900">
                ✓ Make sure the ID is fully visible and well-lit
              </p>
              <p className="text-xs text-blue-900">
                ✓ Avoid shadows and glare on the card
              </p>
              <p className="text-xs text-blue-900">
                ✓ Take a straight-on photo, not at an angle
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
