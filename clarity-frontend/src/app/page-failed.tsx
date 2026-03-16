'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Download, 
  Search,
  Layout,
  CheckCircle2
} from 'lucide-react';

interface AuditIssue {
  title: string;
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
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

const startAudit = async () => {
    if (!image) return alert("Please select an image first!");
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

      // PARSING LOGIC: Memisahkan Isu dan Solusi Kode
      const issues = analysisText
        .split(/\d+\.\s+\*\*/g)
        .slice(1)
        .map((item: string) => {
          const parts = item.split(/\*\*[:\s]*/); 
          const title = parts[0]?.trim() || "Technical Issue";
          
          const remainingContent = parts.slice(1).join(' ');
          const solutionSplit = remainingContent.split(/\[SOLUTION\]/i);
          const description = solutionSplit[0]?.trim() || "Processing analysis...";
          
          let codeSolution = "";
          
          if (solutionSplit.length > 1) {
            // MENGGUNAKAN METODE SPLIT UNTUK MENGHINDARI ERROR REGEX
            // Cara ini 100% aman dari error kompilasi esbuild
            const solutionText = solutionSplit[1];
            if (solutionText.includes('```')) {
              const codeBlocks = solutionText.split('```');
              // Index 1 biasanya berisi blok kode, karena index 0 adalah spasi sebelum ```
              if (codeBlocks.length >= 3) {
                 // Menghapus nama bahasa pemrogramman (html, css, dll) yang mungkin ada di baris pertama
                 let rawCode = codeBlocks[1];
                 const firstNewLineIndex = rawCode.indexOf('\n');
                 if (firstNewLineIndex !== -1 && firstNewLineIndex < 15) {
                     rawCode = rawCode.substring(firstNewLineIndex + 1);
                 }
                 codeSolution = rawCode.trim();
              }
            }
          }

          return {
            title,
            description: description.replace(/\n/g, ' ').trim(),
            solution: codeSolution
          };
        });

      setResult({ score, issues, raw: analysisText });
    } catch (error) {
      alert("An error occurred during the analysis. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 md:p-12 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-3 pt-4 md:pt-0 print:hidden">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
            AI-Powered Accessibility Audit
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
            CLARITY<span className="text-blue-600">AI</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-lg font-medium max-w-sm md:max-w-md mx-auto leading-relaxed">
            Unveiling web accessibility barriers with <span className="text-slate-900 font-bold">Amazon Nova Pro</span>.
          </p>
        </div>

        {/* Action Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden ring-1 ring-slate-200 print:hidden">
          <CardContent className="p-5 md:p-8 flex flex-col items-center space-y-6">
            <div className="w-full max-w-sm">
               <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2">Upload Interface Screenshot</label>
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
              className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-3 text-sm md:text-base active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 fill-current" />
                  Run Audit
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div id="audit-report" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                <CardHeader className="pb-0 pt-6 md:pt-8">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-6 md:pb-8">
                  <div className="text-6xl md:text-8xl font-black tracking-tighter">{result.score}</div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${result.score}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-0 pt-6 md:pt-8">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row items-center gap-4 md:gap-6 py-6 md:py-8">
                   <div className="p-3 md:p-4 bg-orange-50 rounded-xl md:rounded-2xl ring-1 ring-orange-100 flex-shrink-0">
                      <ShieldAlert className="h-8 w-8 md:h-10 md:w-10 text-orange-600" />
                   </div>
                   <div>
                      <p className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{result.issues.length} Issues Found</p>
                      <p className="text-[10px] md:text-sm text-slate-500 font-medium italic">WCAG 2.1 Level AA Compliant Audit</p>
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Findings */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layout className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
                  Technical Findings
                </h3>
                
                <div className="flex items-center gap-2 print:hidden">
                  <button 
                    onClick={downloadPDF}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all active:bg-slate-100 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <Badge variant="outline" className="font-bold text-slate-500 py-1.5">{result.issues.length} Alerts</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {result.issues.map((issue, index) => (
                  <Card key={index} className="group transition-all duration-300 shadow-none border-slate-200 bg-white break-inside-avoid overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-3 md:gap-5">
                        <span className="flex-none flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-lg bg-slate-100 text-slate-900 text-[10px] md:text-xs font-black">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-900 text-base md:text-lg leading-tight group-hover:text-blue-600 transition-colors">{issue.title}</h4>
                          <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{issue.description}</p>
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
        <section className="mt-20 pt-10 border-t border-slate-200 space-y-12 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">The Purpose</h2>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Bridging the Digital Divide with AI.</h3>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                <strong>CLARITY AI</strong> is a cutting-edge web accessibility auditing tool developed to solve complex digital barriers. 
                Our mission is to empower developers and organizations to build inclusive digital experiences through the power of <strong>Multimodal Artificial Intelligence</strong>.
              </p>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  </div>
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Vision:</span> To set a new global standard for automated, instant, and accurate web accessibility auditing.</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  </div>
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Mission:</span> Democratizing WCAG compliance tools for independent developers and startups worldwide.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl ring-1 ring-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Why Clarity AI?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-slate-600"><strong>Nova Pro Intelligence:</strong> Leverages Amazon's latest multimodal model to detect accessibility barriers instantly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-slate-600"><strong>Efficiency:</strong> Reduces audit time significantly, transforming complex manual checks into seconds of AI analysis.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span className="text-sm text-slate-600"><strong>Cloud Native:</strong> Built on a scalable AWS serverless architecture for high performance and reliability.</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Developed by</p>
                <p className="text-lg font-black text-slate-900">Tarq Hilmar Siregar</p>
                <p className="text-xs text-slate-500 font-medium">Informatics Engineering Student & AWS Certified Cloud Practitioner</p>
              </div>
            </div>
          </div>
        </section>

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-12 md:py-20 opacity-20">
             <Search className="mx-auto h-12 w-12 md:h-20 md:w-20 mb-4" />
             <p className="text-base md:text-xl font-bold tracking-tight">Ready for System Audit</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] py-8 md:py-10">
          Official Report &middot; Amazon Nova Pro &middot; Clarity AI 2026
        </p>
      </div>
    </main>
  );
}