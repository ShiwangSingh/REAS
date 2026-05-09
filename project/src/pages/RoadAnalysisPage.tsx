import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  road_coverage_pct: number;
  is_blocked: boolean;
  status: "clear" | "blocked";
  overlay_base64: string;
  raw_mask_base64: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function RoadAnalysisPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overlay" | "mask">("overlay");

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // ── Analysis ───────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<AnalysisResult>("/ml/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; hint?: string } } })
          ?.response?.data?.error ??
        "Analysis failed. Make sure the ML service is running.";
      const hint =
        (err as { response?: { data?: { hint?: string } } })?.response?.data
          ?.hint ?? "";
      setError(hint ? `${msg} — ${hint}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const coverageColor = (pct: number) => {
    if (pct >= 30) return "#22c55e";
    if (pct >= 10) return "#f59e0b";
    return "#ef4444";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="road-analysis-page">
      {/* ── Header ── */}
      <header className="ra-header">
        <button className="ra-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="ra-header-text">
          <h1>Road Analysis</h1>
          <p>AI-powered satellite road extraction</p>
        </div>
        <div className="ra-model-badge">
          <span className="ra-badge-dot" />
          U-Net AI
        </div>
      </header>

      <main className="ra-main">
        {/* ── Left panel: Upload ── */}
        <section className="ra-panel ra-upload-panel">
          <h2 className="ra-panel-title">Upload Satellite Image</h2>

          <div
            id="ra-dropzone"
            className={`ra-dropzone ${isDragging ? "ra-dragging" : ""} ${previewUrl ? "ra-has-preview" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="ra-preview-wrapper">
                <img src={previewUrl} alt="Uploaded satellite view" className="ra-preview-img" />
                <div className="ra-preview-overlay">
                  <button className="ra-change-btn" onClick={(e) => { e.stopPropagation(); reset(); }}>
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="ra-drop-placeholder">
                <div className="ra-drop-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="ra-drop-primary">Drag & drop your satellite image</p>
                <p className="ra-drop-secondary">or click to browse — JPG, PNG supported</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            id="ra-file-input"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          {file && (
            <div className="ra-file-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{file.name}</span>
              <span className="ra-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          <button
            id="ra-analyze-btn"
            className={`ra-analyze-btn ${!file || loading ? "ra-btn-disabled" : ""}`}
            onClick={analyze}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="ra-spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                Analyze Road
              </>
            )}
          </button>

          {error && (
            <div className="ra-error-box" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}
        </section>

        {/* ── Right panel: Results ── */}
        <section className="ra-panel ra-results-panel">
          <h2 className="ra-panel-title">Analysis Results</h2>

          {!result && !loading && (
            <div className="ra-empty-results">
              <div className="ra-empty-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p>Upload a satellite image and click <strong>Analyze Road</strong> to see AI predictions here.</p>
            </div>
          )}

          {loading && (
            <div className="ra-loading-state">
              <div className="ra-pulse-ring" />
              <p>Running road extraction model…</p>
              <span className="ra-loading-sub">This may take up to 30 seconds on CPU</span>
            </div>
          )}

          {result && (
            <div className="ra-result-content">
              {/* Status banner */}
              <div className={`ra-status-banner ${result.is_blocked ? "ra-blocked" : "ra-clear"}`}>
                <div className="ra-status-icon">
                  {result.is_blocked ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
                      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="ra-status-title">
                    {result.is_blocked ? "⚠️ Road Blockage Detected" : "✅ Clear Road"}
                  </div>
                  <div className="ra-status-sub">
                    {result.is_blocked
                      ? "Less than 5% road coverage detected — possible obstruction or no clear path."
                      : "Road is clearly visible and appears passable."}
                  </div>
                </div>
              </div>

              {/* Coverage meter */}
              <div className="ra-metric-card">
                <div className="ra-metric-header">
                  <span className="ra-metric-label">Road Coverage</span>
                  <span className="ra-metric-value" style={{ color: coverageColor(result.road_coverage_pct) }}>
                    {result.road_coverage_pct}%
                  </span>
                </div>
                <div className="ra-progress-bar">
                  <div
                    className="ra-progress-fill"
                    style={{
                      width: `${Math.min(result.road_coverage_pct, 100)}%`,
                      background: coverageColor(result.road_coverage_pct),
                    }}
                  />
                </div>
                <div className="ra-progress-labels">
                  <span>0%</span>
                  <span style={{ color: "#ef4444" }}>5% threshold</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Image tabs */}
              <div className="ra-image-tabs">
                <button
                  id="ra-tab-overlay"
                  className={`ra-tab ${activeTab === "overlay" ? "ra-tab-active" : ""}`}
                  onClick={() => setActiveTab("overlay")}
                >
                  Overlay
                </button>
                <button
                  id="ra-tab-mask"
                  className={`ra-tab ${activeTab === "mask" ? "ra-tab-active" : ""}`}
                  onClick={() => setActiveTab("mask")}
                >
                  Raw Mask
                </button>
              </div>

              <div className="ra-result-image-wrapper">
                <img
                  src={`data:image/png;base64,${
                    activeTab === "overlay" ? result.overlay_base64 : result.raw_mask_base64
                  }`}
                  alt={activeTab === "overlay" ? "Road overlay" : "Predicted road mask"}
                  className="ra-result-img"
                />
                <div className="ra-result-img-label">
                  {activeTab === "overlay"
                    ? "Green tint = detected road pixels"
                    : "White = road, Black = background"}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ── Inline styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .road-analysis-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a1628 100%);
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
        }

        /* ── Header ─────────────────────────── */
        .ra-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 32px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .ra-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ra-back-btn:hover { background: rgba(255,255,255,0.12); transform: translateX(-2px); }

        .ra-header-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ra-header-text p { margin: 0; font-size: 0.8rem; color: #64748b; }

        .ra-model-badge {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          background: rgba(96,165,250,0.1);
          border: 1px solid rgba(96,165,250,0.25);
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #60a5fa;
        }
        .ra-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── Main Layout ─────────────────────── */
        .ra-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .ra-main { grid-template-columns: 1fr; padding: 16px; }
          .ra-header { padding: 16px; }
        }

        /* ── Panels ──────────────────────────── */
        .ra-panel {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ra-panel-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0;
        }

        /* ── Dropzone ────────────────────────── */
        .ra-dropzone {
          border: 2px dashed rgba(96,165,250,0.3);
          border-radius: 16px;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s;
          overflow: hidden;
          position: relative;
        }
        .ra-dropzone:hover:not(.ra-has-preview) {
          border-color: rgba(96,165,250,0.7);
          background: rgba(96,165,250,0.05);
        }
        .ra-dragging {
          border-color: #60a5fa !important;
          background: rgba(96,165,250,0.1) !important;
          transform: scale(1.01);
        }
        .ra-has-preview { cursor: default; border-style: solid; border-color: rgba(255,255,255,0.1); }

        .ra-drop-placeholder { text-align: center; padding: 32px; }
        .ra-drop-icon {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: rgba(96,165,250,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #60a5fa;
        }
        .ra-drop-primary { font-size: 1rem; font-weight: 600; margin: 0 0 6px; }
        .ra-drop-secondary { font-size: 0.82rem; color: #64748b; margin: 0; }

        .ra-preview-wrapper { position: relative; width: 100%; height: 240px; }
        .ra-preview-img { width: 100%; height: 100%; object-fit: cover; }
        .ra-preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        .ra-preview-wrapper:hover .ra-preview-overlay { opacity: 1; }
        .ra-change-btn {
          padding: 10px 20px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 10px;
          color: #fff;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 500;
          backdrop-filter: blur(8px);
        }

        .ra-file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #94a3b8;
          background: rgba(255,255,255,0.04);
          padding: 8px 14px;
          border-radius: 8px;
        }
        .ra-file-size { color: #475569; }

        /* ── Analyze Button ──────────────────── */
        .ra-analyze-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        }
        .ra-analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(59,130,246,0.45);
        }
        .ra-btn-disabled { opacity: 0.45; cursor: not-allowed; }

        .ra-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Error Box ───────────────────────── */
        .ra-error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          font-size: 0.84rem;
          color: #fca5a5;
          line-height: 1.5;
        }

        /* ── Results Panel ───────────────────── */
        .ra-empty-results {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
          color: #475569;
          padding: 40px 20px;
        }
        .ra-empty-icon { color: #334155; }
        .ra-empty-results p { margin: 0; font-size: 0.9rem; line-height: 1.6; }

        .ra-loading-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
        }
        .ra-pulse-ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid rgba(96,165,250,0.2);
          border-top-color: #60a5fa;
          animation: spin 1s linear infinite;
        }
        .ra-loading-state p { margin: 0; font-weight: 600; }
        .ra-loading-sub { font-size: 0.8rem; color: #475569; }

        /* ── Result content ──────────────────── */
        .ra-result-content { display: flex; flex-direction: column; gap: 20px; }

        .ra-status-banner {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 14px;
          border: 1px solid;
        }
        .ra-blocked {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.3);
          color: #fca5a5;
        }
        .ra-clear {
          background: rgba(34,197,94,0.08);
          border-color: rgba(34,197,94,0.3);
          color: #86efac;
        }
        .ra-status-icon { flex-shrink: 0; margin-top: 2px; }
        .ra-status-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 4px; }
        .ra-status-sub { font-size: 0.82rem; opacity: 0.8; line-height: 1.5; }

        /* ── Metric card ─────────────────────── */
        .ra-metric-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 18px;
        }
        .ra-metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .ra-metric-label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
        .ra-metric-value { font-size: 1.5rem; font-weight: 700; }

        .ra-progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .ra-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ra-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: #475569;
        }

        /* ── Image tabs ──────────────────────── */
        .ra-image-tabs {
          display: flex;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          padding: 4px;
          border-radius: 10px;
        }
        .ra-tab {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ra-tab-active { background: rgba(96,165,250,0.15); color: #60a5fa; }
        .ra-tab:hover:not(.ra-tab-active) { color: #94a3b8; }

        .ra-result-image-wrapper { position: relative; }
        .ra-result-img {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          display: block;
        }
        .ra-result-img-label {
          text-align: center;
          font-size: 0.75rem;
          color: #475569;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
