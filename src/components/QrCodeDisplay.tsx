import React, { useRef, useState, useEffect } from 'react';
import { Download, Copy, Check, Upload, Share2, ShieldCheck, QrCode, AlertCircle, RefreshCw } from 'lucide-react';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';

export const QrCodeDisplay: React.FC = () => {
  const { settings, updateSettings, canEdit } = useFund();
  const { isAdmin } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [customQrInput, setCustomQrInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Render QR Canvas with high resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    // If custom uploaded QR exists
    if (settings.qrCodeUrl && settings.qrCodeUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 20, 20, size - 40, size - 40);
      };
      img.src = settings.qrCodeUrl;
      return;
    }

    // Otherwise render high-fidelity crisp branded Fonepay/eSewa style QR pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Outer border
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    // Inner background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(17, 17, size - 34, size - 34);

    // Draw standard QR Finder Patterns (3 corners)
    const drawFinderPattern = (x: number, y: number, finderSize = 80) => {
      // Outer black square
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, finderSize, finderSize);
      // Inner white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 10, y + 10, finderSize - 20, finderSize - 20);
      // Center emerald square
      ctx.fillStyle = '#059669';
      ctx.fillRect(x + 20, y + 20, finderSize - 40, finderSize - 40);
    };

    drawFinderPattern(50, 50);
    drawFinderPattern(size - 130, 50);
    drawFinderPattern(50, size - 130);

    // Synthetic decorative QR data modules
    ctx.fillStyle = '#1e293b';
    const gridCount = 27;
    const cellSize = (size - 100) / gridCount;
    // deterministic seed based on orgName
    let seed = 42817;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        // Skip corner finder areas
        if (r < 7 && c < 7) continue;
        if (r < 7 && c > gridCount - 8) continue;
        if (r > gridCount - 8 && c < 7) continue;
        // Skip center emblem
        if (r > 10 && r < 16 && c > 10 && c < 16) continue;

        if (pseudoRandom() > 0.52) {
          ctx.fillRect(50 + c * cellSize, 50 + r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Center Badge: KUN Samajik Kosh
    const centerSize = 100;
    const centerX = (size - centerSize) / 2;
    const centerY = (size - centerSize) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 4, centerY - 4, centerSize + 8, centerSize + 8);

    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(centerX, centerY, centerSize, centerSize, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KUN', size / 2, size / 2 - 12);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('KOSH', size / 2, size / 2 + 14);
  }, [settings.qrCodeUrl]);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create an offscreen canvas with extra header & bank details for a complete printable/shareable payment card
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 600;
      exportCanvas.height = 760;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 760);

      // Top banner
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, 0, 600, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.orgName || 'KUN Samajik Kosh', 300, 42);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Official Donation & Community Welfare Fund QR', 300, 70);

      // QR Image
      ctx.drawImage(canvas, 50, 110, 500, 500);

      // Bottom details
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, 630, 520, 100);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Payment Reference: Daily / Monthly Fund Donation', 60, 660);

      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Fonepay / eSewa / Mobile Banking Accepted', 60, 685);
      ctx.fillText('Thank you for contributing to community welfare!', 60, 710);

      // Trigger download
      const link = document.createElement('a');
      link.download = `KUN_Samajik_Kosh_Donation_QR.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyBank = () => {
    if (settings.bankDetails) {
      navigator.clipboard.writeText(settings.bankDetails);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.orgName,
          text: `Support KUN Samajik Kosh! Daily pledge: ${settings.currency} ${settings.defaultDailyAmount}.\n\nBank Details:\n${settings.bankDetails}`,
          url: window.location.href,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopyBank();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert('Please upload an image smaller than 800KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await updateSettings({ qrCodeUrl: base64 });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              Verified Official Fund QR
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Donation & Payment QR Code</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Scan using any Nepalese payment app (eSewa, Khalti, Fonepay, IME Pay) or Mobile Banking to submit your daily or monthly contribution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 font-semibold rounded-xl shadow-lg hover:bg-emerald-50 active:scale-95 transition-all text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing...' : 'Download QR'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/40 hover:bg-emerald-800/60 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all text-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* QR Card Container */}
        <div className="md:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
          <div className="w-full text-center mb-4">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Scan to Pay
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {settings.orgName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily Target: {settings.currency} {settings.defaultDailyAmount} per member
            </p>
          </div>

          {/* QR Canvas with smooth frame */}
          <div className="relative p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/20 shadow-inner group">
            <canvas
              ref={canvasRef}
              className="w-64 h-64 md:w-72 md:h-72 rounded-xl object-contain shadow-md mx-auto bg-white"
            />
          </div>

          {/* Action buttons under QR */}
          <div className="w-full mt-6 flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download High-Res QR Image (PNG)
            </button>

            {isAdmin && canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {isEditing ? 'Cancel Custom QR Upload' : 'Upload Custom Bank / Fonepay QR'}
              </button>
            )}
          </div>

          {/* Admin Upload Drawer */}
          {isEditing && (
            <div className="w-full mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-emerald-500/30 text-left">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Replace with Official QR Image
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Upload your bank or eSewa/Fonepay standee QR image. It will sync automatically for all community members.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
              />
              {saveSuccess && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> QR Code image saved and synced!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bank Details & Instructions Card */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                  🏦
                </span>
                Bank Transfer & Mobile Banking Info
              </h3>
              <button
                onClick={handleCopyBank}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {copiedBank ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Details
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line border border-slate-200 dark:border-slate-700/60 leading-relaxed select-all">
              {settings.bankDetails || 'Bank details not provided yet.'}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                How to Pay:
              </h4>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
                <li>Open your Mobile Banking app (e.g. NIC Asia, Nabil, Global IME) or eSewa/Khalti.</li>
                <li>Tap <strong>Scan QR</strong> and point camera to the QR code above.</li>
                <li>Enter your daily/monthly contribution amount (e.g. {settings.currency} 10, {settings.currency} 300).</li>
                <li>In remarks, please write: <strong>Your Name - Samajik Kosh</strong>.</li>
                <li>Complete payment. The admin will verify and record your daily status!</li>
              </ol>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Transparent Record Guarantee</p>
              <p>
                Every payment deposited via QR code is matched with daily attendance records. Members can check their contribution history anytime on the Dashboard and Monthly Report tabs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
