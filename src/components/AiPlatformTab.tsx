import React, { useState, useEffect } from "react";
import {
  Brain,
  Database,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Plus,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Check,
} from "lucide-react";

interface DatasetItem {
  id: string;
  instruction: string;
  input?: string;
  output: string;
  category: "pubadmin_paper1" | "pubadmin_paper2" | "ethics_gs4" | "general_upsc";
  status: "pending_review" | "approved" | "rejected";
  reviewer?: string;
  qualityScore?: number;
  addedAt: string;
}

interface TrainingJob {
  id: string;
  modelName: string;
  baseArchitecture: string;
  datasetId: string;
  epochs: number;
  loraRank: number;
  status: "preparing" | "loading_weights" | "training" | "evaluating_benchmarks" | "completed" | "failed";
  progressPercent: number;
  currentStep: number;
  totalSteps: number;
  currentLoss: number;
  benchmarkScore?: number;
  startedAt: string;
  completedAt?: string;
}

interface RegisteredModel {
  id: string;
  name: string;
  baseArchitecture: string;
  adapterPath: string;
  benchmarkPass: boolean;
  benchmarkScore: number;
  registeredAt: string;
  isActive: boolean;
}

interface AiPlatformTabProps {
  onNotify?: (msg: string) => void;
}

export const AiPlatformTab: React.FC<AiPlatformTabProps> = ({ onNotify = (_msg: string) => {} }) => {
  const [activeSection, setActiveSection] = useState<"gateway" | "dataset" | "training" | "registry">("gateway");

  // Gateway Settings State
  const [gatewayConfig, setGatewayConfig] = useState<{
    defaultProvider: "cloud" | "local" | "auto";
    localEndpoint: string;
    localModelId: string;
    cloudModelId: string;
    strictContextTokens: number;
    activeAdapter?: string;
  }>({
    defaultProvider: "auto",
    localEndpoint: "http://localhost:11434",
    localModelId: "llama3.1:8b-instruct-q4_K_M",
    cloudModelId: "gemini-3.1-flash-lite",
    strictContextTokens: 2048,
    activeAdapter: "bolt-upsc-pubadmin-8b-v1",
  });
  const [savingGateway, setSavingGateway] = useState(false);

  // Dataset Builder State
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [datasetFilter, setDatasetFilter] = useState<string>("all");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    instruction: "",
    input: "",
    output: "",
    category: "pubadmin_paper1" as const,
  });

  // Training Queue State
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [newJobParams, setNewJobParams] = useState({
    modelName: "bolt-upsc-custom-adapter",
    baseArchitecture: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    datasetId: "upsc-pubadmin-mains-pyq",
    epochs: 3,
    loraRank: 16,
  });

  // Registry State
  const [models, setModels] = useState<RegisteredModel[]>([]);

  // Polling helper
  const loadPlatformData = async () => {
    try {
      const [settingsRes, datasetRes, jobsRes, registryRes] = await Promise.all([
        fetch("/api/ai/settings").then((r) => r.json()),
        fetch("/api/ai/dataset/items").then((r) => r.json()),
        fetch("/api/ai/training/jobs").then((r) => r.json()),
        fetch("/api/ai/registry/models").then((r) => r.json()),
      ]);

      if (settingsRes.success && settingsRes.config) {
        setGatewayConfig(settingsRes.config);
      }
      if (datasetRes.success && datasetRes.items) {
        setDatasetItems(datasetRes.items);
      }
      if (jobsRes.success && jobsRes.jobs) {
        setJobs(jobsRes.jobs);
      }
      if (registryRes.success && registryRes.models) {
        setModels(registryRes.models);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    }
  };

  useEffect(() => {
    loadPlatformData();
    const interval = setInterval(loadPlatformData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveGateway = async () => {
    setSavingGateway(true);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gatewayConfig),
      });
      const data = await res.json();
      if (data.success) {
        onNotify("AI Gateway configuration saved successfully.");
      }
    } catch (err) {
      console.error("Failed to update AI gateway:", err);
    } finally {
      setSavingGateway(false);
    }
  };

  const handleReviewDatasetItem = async (id: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/ai/dataset/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, reviewer: "Faculty Reviewer" }),
      });
      const data = await res.json();
      if (data.success) {
        loadPlatformData();
        onNotify(`Item ${id} was marked as ${decision}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDatasetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.instruction || !newItem.output) return;

    try {
      const res = await fetch("/api/ai/dataset/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddingItem(false);
        setNewItem({ instruction: "", input: "", output: "", category: "pubadmin_paper1" });
        loadPlatformData();
        onNotify("New dataset instruction-pair added for review.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStartingJob(true);
    try {
      const res = await fetch("/api/ai/training/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJobParams),
      });
      const data = await res.json();
      if (data.success) {
        loadPlatformData();
        setActiveSection("training");
        onNotify("Asynchronous training job dispatched! The application will NOT block.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingJob(false);
    }
  };

  const handleActivateModel = async (modelId: string) => {
    try {
      const res = await fetch("/api/ai/registry/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      if (data.success) {
        loadPlatformData();
        onNotify(`Model ${modelId} activated for inference!`);
      } else {
        onNotify(data.message || "Cannot activate model");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDataset = datasetItems.filter((i) => {
    if (datasetFilter === "all") return true;
    return i.status === datasetFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px] mb-1">
          <Brain className="w-4 h-4" />
          <span>Local Model & Intelligence Platform</span>
        </div>
        <h3 className="text-sm font-bold text-white">
          AI Gateway, Dataset Studio & Async Training Worker
        </h3>
        <p className="text-slate-400 text-xs">
          Decoupled AI Gateway abstraction, verified instruction-tuning pairs, non-blocking asynchronous training jobs, and benchmark-verified model registry.
        </p>
      </div>

      {/* Internal Navigation */}
      <div className="flex space-x-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection("gateway")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSection === "gateway" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          AI Gateway Config
        </button>
        <button
          onClick={() => setActiveSection("dataset")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeSection === "dataset" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Dataset Builder</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
            {datasetItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection("training")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeSection === "training" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Training Queue</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
            {jobs.filter((j) => j.status !== "completed").length} Active
          </span>
        </button>
        <button
          onClick={() => setActiveSection("registry")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeSection === "registry" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Model Registry</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
            {models.length}
          </span>
        </button>
      </div>

      {/* 1. GATEWAY CONFIG */}
      {activeSection === "gateway" && (
        <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs">AI Gateway Abstraction Layer</h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Zero Hard-Wired Models
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">Default Execution Provider</label>
              <select
                value={gatewayConfig.defaultProvider}
                onChange={(e) =>
                  setGatewayConfig({ ...gatewayConfig, defaultProvider: e.target.value as any })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="auto">Hybrid Auto (Prefer Local, Fallback to Cloud)</option>
                <option value="local">Local Only (Ollama / vLLM / Local Worker)</option>
                <option value="cloud">Cloud Only (Google Gemini 3.8 Flash)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Local Daemon Endpoint</label>
              <input
                type="text"
                value={gatewayConfig.localEndpoint}
                onChange={(e) =>
                  setGatewayConfig({ ...gatewayConfig, localEndpoint: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Local Model Target</label>
              <input
                type="text"
                value={gatewayConfig.localModelId}
                onChange={(e) =>
                  setGatewayConfig({ ...gatewayConfig, localModelId: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Active Adapter</label>
              <input
                type="text"
                value={gatewayConfig.activeAdapter || ""}
                onChange={(e) =>
                  setGatewayConfig({ ...gatewayConfig, activeAdapter: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono"
                placeholder="e.g. bolt-upsc-pubadmin-8b-v1"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveGateway}
              disabled={savingGateway}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{savingGateway ? "Saving..." : "Save Gateway Settings"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. DATASET BUILDER */}
      {activeSection === "dataset" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filter Status:</span>
              {["all", "pending_review", "approved", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setDatasetFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                    datasetFilter === st ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="/api/ai/dataset/export"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSONL</span>
              </a>

              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Instruction Pair</span>
              </button>
            </div>
          </div>

          {/* Add Item Form */}
          {isAddingItem && (
            <form onSubmit={handleAddDatasetItem} className="p-4 rounded-xl bg-[#162033] border border-blue-500/40 space-y-3">
              <h5 className="font-bold text-white text-xs">New Instruction Tuning Pair</h5>
              <div>
                <label className="text-[11px] text-slate-400">Instruction Prompt</label>
                <input
                  type="text"
                  required
                  value={newItem.instruction}
                  onChange={(e) => setNewItem({ ...newItem, instruction: e.target.value })}
                  placeholder="e.g. Evaluate Herbert Simon's Bounded Rationality with respect to Indian disaster management."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Context / Input (Optional)</label>
                <input
                  type="text"
                  value={newItem.input}
                  onChange={(e) => setNewItem({ ...newItem, input: e.target.value })}
                  placeholder="e.g. 2nd ARC recommendations or statutory framework"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Ground Truth Model Output</label>
                <textarea
                  required
                  rows={3}
                  value={newItem.output}
                  onChange={(e) => setNewItem({ ...newItem, output: e.target.value })}
                  placeholder="High-scoring, topper-level structured UPSC answer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          )}

          {/* Dataset Items Table */}
          <div className="space-y-2">
            {filteredDataset.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No items match the filter.</p>
            ) : (
              filteredDataset.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-[#141b2a] border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">
                          {item.category.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            item.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : item.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs">{item.instruction}</p>
                    </div>

                    {/* Review Actions */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {item.status !== "approved" && (
                        <button
                          onClick={() => handleReviewDatasetItem(item.id, "approved")}
                          className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                      {item.status !== "rejected" && (
                        <button
                          onClick={() => handleReviewDatasetItem(item.id, "rejected")}
                          className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/50 p-2 rounded border border-slate-800/80 font-mono">
                    {item.output}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. NON-BLOCKING TRAINING QUEUE */}
      {activeSection === "training" && (
        <div className="space-y-4">
          <form onSubmit={handleStartTraining} className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs">Dispatch Non-Blocking Asynchronous Training Job</h4>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Non-Blocking Background Worker
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400">Adapter Name</label>
                <input
                  type="text"
                  value={newJobParams.modelName}
                  onChange={(e) => setNewJobParams({ ...newJobParams, modelName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Base Architecture</label>
                <select
                  value={newJobParams.baseArchitecture}
                  onChange={(e) => setNewJobParams({ ...newJobParams, baseArchitecture: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="meta-llama/Meta-Llama-3.1-8B-Instruct">Meta Llama 3.1 8B</option>
                  <option value="meta-llama/Llama-3.2-3B-Instruct">Meta Llama 3.2 3B</option>
                  <option value="Qwen/Qwen2.5-7B-Instruct">Qwen 2.5 7B</option>
                  <option value="mistralai/Mistral-7B-Instruct-v0.3">Mistral 7B v0.3</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Epochs</label>
                <select
                  value={newJobParams.epochs}
                  onChange={(e) => setNewJobParams({ ...newJobParams, epochs: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 Epoch</option>
                  <option value="3">3 Epochs</option>
                  <option value="5">5 Epochs</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isStartingJob}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isStartingJob ? "Submitting..." : "Start Training Job (Async)"}</span>
              </button>
            </div>
          </form>

          {/* Jobs List */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-xs">Active & Recent Training Jobs</h5>
            {jobs.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No jobs currently queued.</p>
            ) : (
              jobs.map((j) => (
                <div key={j.id} className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{j.modelName}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            j.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : j.status === "failed"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300 animate-pulse"
                          }`}
                        >
                          {j.status.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{j.baseArchitecture}</span>
                    </div>

                    <span className="font-mono text-xs font-bold text-white">{j.progressPercent}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        j.status === "completed" ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-amber-500"
                      }`}
                      style={{ width: `${j.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      Step: {j.currentStep} / {j.totalSteps}
                    </span>
                    <span className="font-mono text-emerald-400">Loss: {j.currentLoss}</span>
                    {j.benchmarkScore && (
                      <span className="text-purple-300 font-bold">
                        Benchmark: {j.benchmarkScore}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. MODEL REGISTRY */}
      {activeSection === "registry" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-xs">UPSC Model Registry & Benchmark Verification</h4>
              <p className="text-[11px] text-slate-400">
                Architectural mandate: Models can only be activated after passing the UPSC 7-dimension benchmark.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {models.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  m.isActive
                    ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40"
                    : "bg-[#141b2a] border-slate-800"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{m.name}</span>
                    {m.isActive && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500 text-white font-bold uppercase">
                        Active for Inference
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        m.benchmarkPass
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {m.benchmarkPass ? "Benchmark Passed" : "Benchmark Failed"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono">
                    Base: {m.baseArchitecture} • Path: {m.adapterPath}
                  </p>
                  <p className="text-[11px] text-purple-300 font-semibold">
                    UPSC Bench Score: {m.benchmarkScore}% (Minimum threshold: 75%)
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  {m.isActive ? (
                    <span className="text-xs text-blue-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Live Active Model</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivateModel(m.id)}
                      disabled={!m.benchmarkPass}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        m.benchmarkPass
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Activate for Inference
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
