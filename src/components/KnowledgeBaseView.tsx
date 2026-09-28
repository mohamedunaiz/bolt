import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Upload,
  Search,
  FileText,
  Trash2,
  Tag,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Info,
  ShieldCheck,
  Archive,
  ArchiveRestore,
  AlertCircle,
} from "lucide-react";
import { KnowledgeDocument, KnowledgeChunk } from "../types";

export function KnowledgeBaseView() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "search">("library");

  // Upload Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeDocument["category"]>("Administrative Thinkers");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search Testbed State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [searchResults, setSearchResults] = useState<KnowledgeChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Chunk Inspector Modal
  const [inspectDoc, setInspectDoc] = useState<{ doc: KnowledgeDocument; chunks: KnowledgeChunk[] } | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/knowledge/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setUploading(true);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          tags,
          content: content.trim(),
          userId: "aspirant",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadError(null);
        setUploadSuccess(`Successfully indexed "${title}" into ${data.document.chunkCount} searchable RAG chunks!`);
        setTitle("");
        setContent("");
        setTagsInput("");
        await fetchDocuments();
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError(data.message || "Failed to index document");
        setTimeout(() => setUploadError(null), 6000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Error uploading document to RAG engine. Check server connection.");
      setTimeout(() => setUploadError(null), 6000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, _docTitle?: string) => {
    try {
      const res = await fetch(`/api/knowledge/documents/${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (inspectDoc?.doc.id === docId) {
          setInspectDoc(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  const handleToggleArchive = async (docId: string, currentStatus?: string) => {
    const shouldArchive = currentStatus !== "archived";
    try {
      const res = await fetch("/api/knowledge/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, archive: shouldArchive }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: shouldArchive ? "archived" : "active" } : d))
        );
      }
    } catch (err) {
      console.error("Failed to toggle archive status:", err);
    }
  };

  const handleInspect = async (doc: KnowledgeDocument) => {
    try {
      setLoadingChunks(true);
      const res = await fetch(`/api/knowledge/documents/${encodeURIComponent(doc.id)}`);
      const data = await res.json();
      if (data.success) {
        setInspectDoc({ doc: data.document, chunks: data.chunks });
      }
    } catch (err) {
      console.error("Inspect error:", err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          category: selectedCategoryFilter,
          limit: 6,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.chunks);
      }
    } catch (err) {
      console.error("Knowledge search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="knowledge-base-view">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                RAG Knowledge Architecture
              </span>
              <span className="text-xs text-slate-400">Immediate Retrieval • Zero Training Delay</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-amber-400" />
              UPSC Knowledge & Document Repository
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Upload notes, 2nd ARC reports, thinker compilations, and PYQs. BOLT splits documents into semantic chunks and provides verified citations in answer evaluations and chat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Indexed Docs</div>
              <div className="text-xl font-bold text-amber-400">{documents.length}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Searchable Chunks</div>
              <div className="text-xl font-bold text-emerald-400">{totalChunks}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "library"
                ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Indexed Library ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "upload"
                ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload & Index Notes
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "search"
                ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Search className="w-4 h-4" />
            Semantic RAG Search
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-300 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span className="text-sm font-medium">{uploadError}</span>
        </div>
      )}

      {/* TAB 1: INDEXED LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                Knowledge Base Repository
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full document lifecycle: upload, semantic chunking, keyword extraction, search, inspection, archive, and deletion.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "active"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Active ({documents.filter((d) => d.status !== "archived").length})
                </button>
                <button
                  onClick={() => setStatusFilter("archived")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === "archived"
                      ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Archived ({documents.filter((d) => d.status === "archived").length})
                </button>
              </div>

              <button
                onClick={fetchDocuments}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              Loading indexed documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-400 opacity-60" />
              <p className="font-medium text-slate-800 dark:text-slate-200">No documents indexed yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload notes, 2nd ARC reports, or PYQ sets to power BOLT RAG.</p>
              <button
                onClick={() => setActiveTab("upload")}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-semibold text-xs rounded-xl hover:bg-amber-400 transition-colors"
              >
                Upload First Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents
                .filter((doc) => {
                  if (statusFilter === "active") return doc.status !== "archived";
                  if (statusFilter === "archived") return doc.status === "archived";
                  return true;
                })
                .map((doc) => {
                  const isArchived = doc.status === "archived";
                  return (
                    <div
                      key={doc.id}
                      className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                        isArchived
                          ? "border-slate-200/60 dark:border-slate-800/60 opacity-75"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              {doc.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                isArchived
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                              }`}
                            >
                              {isArchived ? "Archived" : "Active"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {doc.chunkCount} chunks
                          </span>
                        </div>

                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mb-1.5 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {doc.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {doc.snippet || "Standard UPSC indexed reference notes."}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {doc.tags?.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {doc.fileSize || "12 KB"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleInspect(doc)}
                            className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-medium transition-all text-xs"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleToggleArchive(doc.id, doc.status)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isArchived
                                ? "text-amber-500 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                            title={isArchived ? "Unarchive Document" : "Archive Document"}
                          >
                            {isArchived ? (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD & INDEX NOTES */}
      {activeTab === "upload" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Index UPSC Material into BOLT RAG
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Paste your typed notes, 2nd ARC summary, or textbook chapter. The engine automatically creates semantic chunks, extracts keywords, and indexes them for immediate citation.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 2nd ARC Report 10: Personnel Administration"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Administrative Thinkers">Administrative Thinkers (Paper 1)</option>
                    <option value="2nd ARC Reports">2nd ARC Reports (Ethics/Personnel/Local)</option>
                    <option value="Public Administration Notes">Public Administration Notes</option>
                    <option value="UPSC PYQs">UPSC PYQs & Model Answers</option>
                    <option value="General Studies">General Studies (GS1/GS2/GS3/GS4)</option>
                    <option value="Current Affairs">Current Affairs & PIB Compilations</option>
                    <option value="Custom Upload">Custom Student Upload</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g., Civil Services, Article 311, Lateral Entry, ARC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Text Content * (Paste notes or chapter text)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {content.length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste raw text, OCR output, or structured chapter summary here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Processed securely on backend vector store.
                </div>
                <button
                  type="submit"
                  disabled={uploading || !title.trim() || !content.trim()}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Chunking & Indexing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Index into RAG
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SEMANTIC RAG SEARCH */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-500" />
              Live RAG Retrieval Testbed
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Query your indexed notes and see the exact chunks and confidence scores BOLT uses to answer questions.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Chester Barnard Zone of Indifference or 2nd ARC Citizen Charter..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Administrative Thinkers">Administrative Thinkers</option>
                <option value="2nd ARC Reports">2nd ARC Reports</option>
                <option value="Public Administration Notes">Public Administration Notes</option>
                <option value="UPSC PYQs">UPSC PYQs</option>
              </select>

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Retrieve
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">Quick tests:</span>
              {[
                "Barnard Acceptance Theory",
                "Herbert Simon Satisficing",
                "Fred Riggs Sala Model",
                "2nd ARC Ethics & Lokpal",
                "Sarkaria Commission Art 356",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Top {searchResults.length} Retrieved Chunks</span>
                <span>Sorted by Term Frequency & Inverted Index Score</span>
              </div>

              {searchResults.map((chunk, idx) => (
                <div
                  key={chunk.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {chunk.documentTitle}
                      </span>
                      <span className="text-slate-400">• Approx. Page {chunk.approxPage || 1}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Relevance Score: {chunk.score || 10}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg font-mono text-xs border border-slate-200/50 dark:border-slate-700/50">
                    {chunk.text}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>Keywords: {chunk.keywords?.slice(0, 5).join(", ") || "UPSC"}</span>
                    </div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Category: {chunk.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHUNKS INSPECTOR MODAL */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {inspectDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: {inspectDoc.doc.category} • {inspectDoc.chunks.length} Semantic Chunks
                </p>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {inspectDoc.chunks.map((chk, i) => (
                <div
                  key={chk.id || i}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="font-bold text-amber-500">Chunk #{chk.chunkIndex + 1}</span>
                    <span>Approx. Page {chk.approxPage || 1}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-mono">
                    {chk.text}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Keywords: {chk.keywords?.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
