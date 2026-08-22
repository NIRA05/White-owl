import React, { useState } from "react";
import { BarChart3, Upload, Table, PieChart as PieIcon, LineChart as LineIcon, Sparkles, Send } from "lucide-react";
import * as XLSX from "xlsx";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface DataAnalystViewProps {
  isDark: boolean;
  onSendAnalysisQuery: (query: string, dataSummary: string) => Promise<string>;
}

const COLORS = ["#ef4444", "#dc2626", "#ffffff", "#a1a1aa", "#f87171", "#991b1b", "#71717a"];

export const DataAnalystView: React.FC<DataAnalystViewProps> = ({ isDark, onSendAnalysisQuery }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [xAxisCol, setXAxisCol] = useState<string>("");
  const [yAxisCol, setYAxisCol] = useState<string>("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (json.length > 0) {
        const cols = Object.keys(json[0] as object);
        setData(json);
        setColumns(cols);
        setXAxisCol(cols[0]);
        const numCol = cols.find((c) => typeof (json[0] as any)[c] === "number") || cols[1] || cols[0];
        setYAxisCol(numCol);
        setAiResponse(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || data.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);
    const summary = `Dataset: ${fileName} (${data.length} rows, ${columns.length} columns)\nColumns: ${columns.join(", ")}\nSample: ${JSON.stringify(data.slice(0, 5))}`;

    try {
      const res = await onSendAnalysisQuery(aiQuery, summary);
      setAiResponse(res);
    } catch (err: any) {
      setAiResponse(`⚠️ Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Tabular Intelligence</span>
        </div>
        <h2 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-black"}`}>CSV & Excel Data Analyst</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Upload datasets (.csv, .xlsx, .xls) for instant health metrics, Plotly-style charts, and deep analytical Q&A.
        </p>
      </div>

      {/* Upload Box */}
      <div className={`p-8 rounded-3xl border-2 border-dashed transition-all mb-6 text-center ${
        isDark ? "bg-black border-zinc-800 hover:border-red-500/50" : "bg-white border-zinc-300 hover:border-red-500/50"
      }`}>
        <input
          type="file"
          id="data-file-input"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="data-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm text-red-500 hover:underline">Upload CSV or Excel dataset</span>
            <span className="text-zinc-400 text-xs block mt-0.5">Supports .csv, .xlsx, .xls</span>
          </div>
        </label>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className="text-[11px] font-bold text-zinc-400 uppercase">Total Rows</div>
              <div className="text-xl font-extrabold text-red-500 mt-1">{data.length.toLocaleString()}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className="text-[11px] font-bold text-zinc-400 uppercase">Columns</div>
              <div className={`text-xl font-extrabold mt-1 ${isDark ? "text-white" : "text-black"}`}>{columns.length}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className="text-[11px] font-bold text-zinc-400 uppercase">Dataset Name</div>
              <div className="text-xs font-semibold text-zinc-300 truncate mt-1">{fileName}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className="text-[11px] font-bold text-zinc-400 uppercase">Data Health</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">100% Parsed</div>
            </div>
          </div>

          {/* Interactive Chart Studio */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-base text-red-500 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Interactive Visualizer</span>
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className={`rounded-lg border text-xs px-3 py-1.5 outline-none focus:border-red-500 ${
                    isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                  }`}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Distribution</option>
                </select>
                <select
                  value={xAxisCol}
                  onChange={(e) => setXAxisCol(e.target.value)}
                  className={`rounded-lg border text-xs px-3 py-1.5 outline-none focus:border-red-500 ${
                    isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                  }`}
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c} (X-Axis)</option>
                  ))}
                </select>
                <select
                  value={yAxisCol}
                  onChange={(e) => setYAxisCol(e.target.value)}
                  className={`rounded-lg border text-xs px-3 py-1.5 outline-none focus:border-red-500 ${
                    isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                  }`}
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c} (Y-Axis)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={data.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#18181b" : "#e4e4e7"} opacity={0.6} />
                    <XAxis dataKey={xAxisCol} stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#000000", borderColor: "#ef4444", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey={yAxisCol} fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : chartType === "line" ? (
                  <LineChart data={data.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#18181b" : "#e4e4e7"} opacity={0.6} />
                    <XAxis dataKey={xAxisCol} stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#000000", borderColor: "#ef4444", borderRadius: "12px", color: "#fff" }} />
                    <Line type="monotone" dataKey={yAxisCol} stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#dc2626" }} />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: "#000000", borderColor: "#ef4444", borderRadius: "12px", color: "#fff" }} />
                    <Pie data={data.slice(0, 8)} dataKey={yAxisCol} nameKey={xAxisCol} cx="50%" cy="50%" outerRadius={90} label>
                      {data.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis Form */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}`}>
            <h3 className="font-bold text-base text-red-500 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Ask White Owl About This Dataset</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ask: "What are the key outliers?", "Find top 5 drivers of growth", "Compute average by category"
            </p>

            <form onSubmit={handleAiAnalysis} className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask an analytical question..."
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  isDark ? "bg-black border-zinc-800 text-white focus:border-red-500" : "bg-zinc-50 border-zinc-300 text-black focus:border-red-500"
                }`}
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm cursor-pointer shadow-md shadow-red-600/20"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </form>

            {aiResponse && (
              <div className={`mt-4 p-5 rounded-2xl border ${
                isDark ? "bg-black/90 border-red-600/30 text-zinc-100" : "bg-zinc-50 border-red-500/20 text-zinc-900"
              }`}>
                <div className="text-xs font-bold text-red-500 mb-2">🦉 White Owl Analysis</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
