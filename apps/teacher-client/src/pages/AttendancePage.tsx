import { useEffect, useRef, useState } from "react";
import { detectFaces, matchFace, fileToBase64 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cropFacesFromImage(
  img: HTMLImageElement,
  faces: Array<{
    boundingBox?: {
      Left?: number;
      Top?: number;
      Width?: number;
      Height?: number;
    };
  }>,
  options: { padPct?: number; minOut?: number } = {},
): string[] {
  const padPct = options.padPct ?? 0.2;
  const minOut = options.minOut ?? 160;
  const crops: string[] = [];
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  for (const f of faces) {
    const bb = f.boundingBox;
    if (
      !bb ||
      bb.Width == null ||
      bb.Height == null ||
      bb.Left == null ||
      bb.Top == null
    )
      continue;
    let x = bb.Left * iw;
    let y = bb.Top * ih;
    let w = bb.Width * iw;
    let h = bb.Height * ih;
    const padW = w * padPct;
    const padH = h * padPct;
    x = Math.max(0, Math.floor(x - padW));
    y = Math.max(0, Math.floor(y - padH));
    w = Math.floor(w + padW * 2);
    h = Math.floor(h + padH * 2);
    if (x + w > iw) w = Math.floor(iw - x);
    if (y + h > ih) h = Math.floor(ih - y);
    if (w <= 0 || h <= 0) continue;
    const outW = Math.max(w, minOut);
    const outH = Math.max(h, minOut);
    const scale = Math.max(outW / w, outH / h);
    const destW = Math.floor(w * scale);
    const destH = Math.floor(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = destW;
    canvas.height = destH;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(img, x, y, w, h, 0, 0, destW, destH);
    crops.push(canvas.toDataURL("image/jpeg", 0.92));
  }
  return crops;
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<
    Array<{
      student: {
        id: string;
        firstName: string;
        lastName: string;
        secondLastName: string | null;
        identificationNumber: string;
        gradeId: string | null;
      };
      similarity: number | null;
    }>
  >([]);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Camera state
  const [useCamera, setUseCamera] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera(deviceId?: string) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("El navegador no soporta cámara");
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo acceder a la cámara");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function captureFromVideo(): Promise<string | null> {
    const video = videoRef.current;
    if (!video) return null;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices?.enumerateDevices?.();
        if (devices) {
          const vids = devices.filter((d) => d.kind === "videoinput");
          setVideoDevices(vids);
          if (!selectedDeviceId && vids.length)
            setSelectedDeviceId(vids[0].deviceId);
        }
      } catch {}
    }
    if (useCamera) {
      loadDevices();
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCamera, selectedDeviceId]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setMatches([]);
    setFaceCount(null);
    setPhoto(null);
    try {
      const base64 = await fileToBase64(file);
      setPhoto(base64);
      const det = await detectFaces(base64);
      setFaceCount(det.count);

      // Load original image to compute pixel crops
      const img = await loadImage(base64);
      const crops = cropFacesFromImage(img, det.faces, {
        padPct: 0.25,
        minOut: 192,
      });

      const results = await Promise.all(
        crops.map(async (crop) => {
          const r = await matchFace(crop, 90);
          return r.match;
        }),
      );

      // Dedupe by student id keeping max similarity
      const byStudent = new Map<
        string,
        { student: any; similarity: number | null }
      >();
      for (const m of results) {
        if (!m) continue;
        const prev = byStudent.get(m.student.id);
        if (!prev || (m.similarity ?? 0) > (prev.similarity ?? 0)) {
          byStudent.set(m.student.id, {
            student: m.student,
            similarity: m.similarity ?? null,
          });
        }
      }
      setMatches([...byStudent.values()]);
    } catch (err: any) {
      setError(err?.message || "Failed to capture attendance");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Foto de Asistencia (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              id="attendance-file"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              type="button"
              onClick={() => setUseCamera((v) => !v)}
              variant={useCamera ? "secondary" : "default"}
              disabled={loading}
            >
              {useCamera ? "Usar archivo" : "Usar cámara"}
            </Button>
            {!useCamera && (
              <Button
                type="button"
                onClick={() =>
                  document.getElementById("attendance-file")?.click()
                }
                disabled={loading}
              >
                {loading ? "Procesando…" : "Cargar foto"}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Captura o carga una foto del aula
            </span>
          </div>

          {useCamera && (
            <div className="space-y-2">
              {videoDevices.length > 1 && (
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cámara ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              )}
              <div className="aspect-video bg-black/80 rounded overflow-hidden">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setMatches([]);
                  setFaceCount(null);
                  try {
                    const base64 = await captureFromVideo();
                    if (!base64) throw new Error("No se pudo capturar");
                    setPhoto(base64);
                    const det = await detectFaces(base64);
                    setFaceCount(det.count);
                    const img = await loadImage(base64);
                    const crops = cropFacesFromImage(img, det.faces, {
                      padPct: 0.25,
                      minOut: 192,
                    });
                    const results = await Promise.all(
                      crops.map(
                        async (crop) => (await matchFace(crop, 90)).match,
                      ),
                    );
                    const byStudent = new Map<
                      string,
                      { student: any; similarity: number | null }
                    >();
                    for (const m of results) {
                      if (!m) continue;
                      const prev = byStudent.get(m.student.id);
                      if (
                        !prev ||
                        (m.similarity ?? 0) > (prev.similarity ?? 0)
                      ) {
                        byStudent.set(m.student.id, {
                          student: m.student,
                          similarity: m.similarity ?? null,
                        });
                      }
                    }
                    setMatches([...byStudent.values()]);
                  } catch (e: any) {
                    setError(e?.message || "Error al capturar");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Procesando…" : "Capturar foto"}
              </Button>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </CardContent>
      </Card>

      {(photo || matches.length || faceCount !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {photo && (
              <img src={photo} alt="captura" className="max-h-64 rounded" />
            )}
            {faceCount !== null && (
              <div className="text-sm">Rostros detectados: {faceCount}</div>
            )}
            <div className="text-sm">
              Coincidencias únicas: {matches.length}
            </div>
            <ul className="space-y-1">
              {matches.map((m) => (
                <li key={m.student.id} className="text-sm">
                  {m.student.firstName} {m.student.lastName}
                  {m.student.secondLastName
                    ? ` ${m.student.secondLastName}`
                    : ""}{" "}
                  — similitud {m.similarity?.toFixed(1) ?? "N/A"}%
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
