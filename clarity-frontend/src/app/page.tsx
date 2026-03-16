'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, BarChart3, ShieldAlert, Zap, 
  Download, Search, Layout, CheckCircle2, AlertTriangle
} from 'lucide-react';

interface AuditIssue {
  title: string;
  metadata: string;
  description: string;
}

interface AuditResult {
  score: number;
  issues: AuditIssue[];
  raw: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const startAudit = async () => {
    if (!image) return alert("Silakan unggah gambar terlebih dahulu!");
    setLoading(true);
    setResult(null);

    try {
      const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: cleanBase64 }),
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      const data = await response.json();
      const analysisText = data.analysis;

      const scoreMatch = analysisText.match(/Clarity Score:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

      // PARSING SEDERHANA & SUPER STABIL
      const issues = analysisText
        .split(/\d+\.\s+\*\*/g)
        .slice(1)
        .map((item: string) => {
          const parts = item.split(/\*\*[:\s]*/); 
          // Membersihkan kurung siku [] dari judul jika AI menyertakannya
          const title = (parts[0]?.trim() || "Accessibility Issue").replace(/[\[\]]/g, '');
          
          const bodyText = parts.slice(1).join(' ').trim();
          
          // Memisahkan Metadata (Severity/Principle) dari Deskripsi
          const descSplit = bodyText.split(/Description:/i);
          const metadata = descSplit[0]?.trim() || "";
          
          // Membersihkan teks 'Clarity Score' yang bocor ke deskripsi terakhir
          let description = descSplit[1]?.trim() || bodyText;
          description = description.replace(/Clarity Score:\s*\d+/i, '').trim();

          return {
            title: title,
            metadata: metadata.replace(/\n/g, ' '),
            description: description.replace(/\n/g, ' ')
          };
        });

      setResult({ score, issues, raw: analysisText });
    } catch (error) {
      alert("Terjadi kesalahan saat analisis. Pastikan AWS Lambda berjalan dengan baik.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
        
        {/* Header Section */}
        <header className="text-center space-y-3 pt-6 md:pt-0 print:hidden text-center md:text-left">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
            Enterprise Accessibility Audit
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-900">
              CLARITY<span className="text-blue-600">AI</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
              Detecting barriers and generating <span className="text-slate-900 font-bold underline decoration-blue-600 decoration-2">actionable insights</span> via Amazon Nova Pro.
            </p>
          </div>
        </header>

        {/* Action Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden ring-1 ring-slate-200 print:hidden">
          <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 justify-center md:justify-start">
            <div className="w-full sm:flex-1 max-w-sm">
               <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2 text-center sm:text-left">Upload Interface Screenshot</label>
               <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange} 
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] md:file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-all cursor-pointer bg-slate-50 rounded-xl border border-slate-100 p-1"
              />
            </div>
            
            <button 
              onClick={startAudit} 
              disabled={loading || !image}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 whitespace-nowrap"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-5 w-5" /> Analyzing UI...</>
              ) : (
                <><Zap className="h-5 w-5 fill-current" /> Run Deep Audit</>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div id="audit-report" className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              
              {/* Compliance Score */}
              <Card className="bg-slate-900 text-white border-none shadow-xl rounded-2xl md:rounded-3xl">
                <CardHeader className="pb-0 pt-6">
                  <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-blue-400">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-6 md:pb-8">
                  <div className="text-6xl md:text-7xl font-black">{result.score}</div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${result.score}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              {/* Executive Summary */}
              <Card className="md:col-span-2 shadow-sm border-slate-200 bg-white rounded-2xl md:rounded-3xl flex flex-col justify-center">
                <CardHeader className="pb-0 pt-6 md:pt-8">
                  <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4 py-6">
                   <div className="p-3 md:p-4 bg-blue-50 rounded-2xl flex-shrink-0">
                    <ShieldAlert className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
                   </div>
                   <div>
                    <p className="text-xl md:text-2xl font-black text-slate-900">{result.issues.length} Critical Issues Found</p>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Evaluated against WCAG 2.1 Guidelines.</p>
                   </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-blue-600" /> Audit Findings
                </h3>
                <button 
                  onClick={downloadPDF}
                  className="print:hidden w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-all"
                >
                  <Download className="h-4 w-4" /> Export Report
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:gap-5">
                {result.issues.map((issue, index) => (
                  <Card key={index} className="border-slate-200 shadow-sm rounded-2xl md:rounded-3xl overflow-hidden hover:border-blue-200 transition-colors">
                    <CardContent className="p-5 md:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <span className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-slate-900 text-white text-xs md:text-sm flex items-center justify-center font-bold shadow-md flex-shrink-0 mt-1">
                          {index + 1}
                        </span>
                        <div className="space-y-2.5 flex-1">
                          <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight">{issue.title}</h4>
                          
                          {issue.metadata && (
                            <div className="inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                              <span className="leading-none">{issue.metadata}</span>
                            </div>
                          )}
                          
                          <p className="text-slate-600 text-sm md:text-base leading-relaxed mt-1">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About Us Section */}
        <section className="mt-16 md:mt-24 pt-12 border-t border-slate-200 space-y-8 md:space-y-12 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-blue-600">The Mission</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Inclusivity Powered by AI.</h3>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium max-w-md mx-auto md:mx-0">
                <strong>CLARITY AI</strong> leverages <strong>Amazon Nova Pro</strong> to perceive UI like a human auditor, generating actionable insights to ensure digital inclusion for everyone.
              </p>
            </div>
            <div className="bg-white p-8 md:p-10 rounded-3xl ring-1 ring-slate-200 shadow-sm text-center md:text-left">
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Developed by</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">Tarq Hilmar Siregar</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">AWS Certified Cloud Practitioner</p>
            </div>
          </div>
        </section>

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-16 md:py-24 opacity-20">
             <Search className="mx-auto h-12 w-12 md:h-16 md:w-16 mb-4" />
             <p className="text-base md:text-xl font-bold tracking-tight">Ready for System Audit</p>
          </div>
        )}

        <footer className="text-center pt-8 pb-12">
          <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">
            Official Agentic Report &middot; Amazon Nova Pro &middot; Clarity AI 2026
          </p>
        </footer>
      </div>
    </main>
  );
}