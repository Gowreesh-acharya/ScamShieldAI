import { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Trash2,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Zap,
  Info
} from 'lucide-react';
import { scanScreenshotApi, scanMessageApi } from '../services/api';
import { saveScan } from '../utils/storage';
import RiskResultCard from '../components/RiskResultCard';
import ScanProgress from '../components/ScanProgress';

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const SAMPLE_SCREENSHOTS = [
  {
    name: 'sbi_kyc_suspension_alert.png',
    size: '184 KB',
    text: 'Dear Customer, your SBI YONO account will be blocked today. Please update your PAN immediately by visiting http://sbi-kyc-verify.update-portal.xyz/login to avoid suspension.',
    previewGradient: 'linear-gradient(135deg, #1e293b, #0f172a)'
  },
  {
    name: 'bescom_electricity_threat.jpg',
    size: '242 KB',
    text: 'URGENT BESCOM ALERT: Your electricity connection will be disconnected tonight at 09:30 PM due to previous month bill update failure. Call bill officer immediately at 8912345678 or pay here: http://bescom-bill-desk.online/pay',
    previewGradient: 'linear-gradient(135deg, #261e3b, #0f172a)'
  },
  {
    name: 'whatsapp_movie_job_scam.png',
    size: '310 KB',
    text: 'Congratulations! You have been selected for part-time remote movie rating job. Earn Rs. 4,500 to Rs. 8,000 daily from home. Contact HR on WhatsApp +91-9876543210 to claim bonus.',
    previewGradient: 'linear-gradient(135deg, #1e3b2e, #0f172a)'
  }
];

export default function ScreenshotScanner({ onScanComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [ocrStatus, setOcrStatus] = useState(null); // null | 'extracted' | 'fallback_required'
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const handleValidateAndSelectFile = (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setError('Unsupported file type. Please upload a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller screenshot.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResult(null);

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Initial check: Prompt to extract
    setExtractedText('');
    setOcrStatus('fallback_required'); // Default to allowing text verification/input
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidateAndSelectFile(e.target.files[0]);
    }
  };

  const handleLoadSample = (sample) => {
    setError(null);
    setSelectedFile({ name: sample.name, sizeFormatted: sample.size });
    setPreviewUrl(null); // Samples show simulated gradient card
    setExtractedText(sample.text);
    setOcrStatus('extracted');
    setResult(null);
  };

  const handleExtractAndAnalyze = async () => {
    if (!selectedFile && !extractedText) {
      setError('Please upload a screenshot or enter text to analyze.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      let textToScan = extractedText;

      // If text not already entered/extracted and file is actual File object, try OCR
      if (!textToScan && selectedFile instanceof File) {
        setLoadingMessage('Processing image via OCR Engine...');
        const ocrResponse = await scanScreenshotApi(selectedFile);

        if (ocrResponse.success && ocrResponse.extractedText) {
          textToScan = ocrResponse.extractedText;
          setExtractedText(textToScan);
          setOcrStatus('extracted');
        } else {
          // Transparent fallback when OCR is unavailable
          setLoading(false);
          setOcrStatus('fallback_required');
          setError(ocrResponse.message || 'Automated OCR service is currently offline. Please enter or review the message text from the screenshot below.');
          return;
        }
      }

      if (!textToScan.trim()) {
        setLoading(false);
        setError('No text could be extracted. Please enter the message text shown in the screenshot.');
        setOcrStatus('fallback_required');
        return;
      }

      setLoadingMessage('Scanning extracted text for cyber fraud indicators...');
      const scanResult = await scanMessageApi(textToScan);

      const enhancedResult = {
        ...scanResult,
        type: 'screenshot',
        target: `[Screenshot: ${selectedFile?.name || 'Uploaded Image'}] ${textToScan.slice(0, 100)}...`
      };

      setResult(enhancedResult);
      saveScan(enhancedResult);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.message || 'An error occurred during screenshot analysis.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setOcrStatus(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="page-content">
      <div className="scanner-grid">
        {/* Left Column: Upload, Preview & Extracted Text */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <FileImage size={16} color="var(--accent-sky)" />
              Screenshot Scam Scanner
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Optical Character Analysis
            </span>
          </div>

          {/* Test Samples Bar */}
          <div className="presets-container">
            <span className="presets-title">Load Test Scenarios:</span>
            <div className="presets-list">
              {SAMPLE_SCREENSHOTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleLoadSample(sample)}
                >
                  <Zap size={11} color="var(--accent-sky)" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!selectedFile && (
            <div
              className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-surface-input)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <UploadCloud size={36} color="var(--accent-sky)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Drag and drop screenshot here
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Supported formats: PNG, JPG, JPEG, WEBP (Max {MAX_FILE_SIZE_MB}MB)
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '32px', fontSize: '11px', margin: '0 auto' }}
              >
                Browse Files
              </button>
            </div>
          )}

          {/* Image Preview & Details Card */}
          {selectedFile && (
            <div style={{ backgroundColor: 'var(--bg-surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileImage size={20} color="var(--accent-sky)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : selectedFile.sizeFormatted}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={handleClear}
                  title="Remove image"
                >
                  <Trash2 size={16} color="var(--threat-danger)" />
                </button>
              </div>

              {/* Preview Thumbnail */}
              {previewUrl && (
                <div style={{ maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Uploaded screenshot preview"
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Extracted Text Review & Edit Area */}
          {(selectedFile || extractedText) && (
            <div className="form-group">
              <div className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit3 size={13} color="var(--accent-sky)" />
                  Extracted Screenshot Text (Review & Correct)
                  {ocrStatus === 'extracted' && (
                    <span className="scan-type-tag" style={{ fontSize: '10px', color: 'var(--threat-safe)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      OCR Active
                    </span>
                  )}
                  {ocrStatus === 'fallback_required' && (
                    <span className="scan-type-tag" style={{ fontSize: '10px', color: 'var(--threat-warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                      Manual Review
                    </span>
                  )}
                </span>
                <span className="char-counter">{extractedText.length} chars</span>
              </div>

              <textarea
                className="cyber-textarea"
                rows={5}
                placeholder="Enter or verify the message text from the screenshot..."
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
              />

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} />
                <span>You can edit or correct any OCR misreadings before running the security analysis.</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="alert-banner warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleExtractAndAnalyze}
              disabled={loading || (!selectedFile && !extractedText.trim())}
            >
              <ShieldAlert size={15} />
              <span>{loading ? (loadingMessage || 'Analyzing...') : 'Analyse Screenshot'}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              disabled={loading || (!selectedFile && !extractedText && !result && !error)}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Right Column: Scan Progress or Results */}
        <div>
          {loading && <ScanProgress type="message" />}

          {!loading && result && (
            <RiskResultCard result={result} />
          )}

          {!loading && !result && (
            <div className="empty-results-box">
              <FileImage size={32} color="var(--border-medium)" />
              <h4>Awaiting Screenshot Upload</h4>
              <p style={{ maxWidth: '320px', fontSize: '13px' }}>
                Upload an image or select a sample scenario to extract text via OCR and run linguistic scam analysis.
              </p>

              <div className="empty-checklist">
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Supports PNG, JPG, JPEG, and WEBP image uploads</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>OCR extraction with manual correction fallback</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Identifies banking fraud, impersonation, and phishing URLs in images</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
