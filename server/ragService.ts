import fs from "fs";
import path from "path";

import { generateEmbedding, cosineSimilarity, rerankDocuments } from "./aiGateway";

export interface KnowledgeDocument {
  id: string;
  userId?: string;
  title: string;
  category: "2nd ARC Reports" | "Administrative Thinkers" | "Public Administration Notes" | "UPSC PYQs" | "General Studies" | "Current Affairs" | "Custom Upload";
  tags: string[];
  sourceUrl?: string;
  uploadedAt: string;
  fileSize?: string;
  chunkCount: number;
  snippet?: string;
  status?: "active" | "archived";
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  category: string;
  chunkIndex: number;
  text: string;
  keywords: string[];
  approxPage?: number;
  heading?: string;
  score?: number;
  vector?: number[];
}

interface RagStore {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
}

const STORE_PATH = path.join(process.cwd(), "server", "knowledge_store.json");

// Seed documents for foundational UPSC Public Administration & GS material
const SEED_DOCUMENTS: {
  title: string;
  category: KnowledgeDocument["category"];
  tags: string[];
  content: string;
}[] = [
  {
    title: "2nd ARC 4th Report: Ethics in Governance",
    category: "2nd ARC Reports",
    tags: ["Ethics", "Corruption", "Civil Service Reforms", "ARC", "Accountability"],
    content: `Chapter 1: Ethical Framework for Public Life. Public service values in a democracy demand integrity, impartiality, objectivity, dedication to public duty, and exemplary probity. The Committee notes that corruption in developing economies distorts resource allocation and harms vulnerable segments.
Chapter 2: Code of Conduct and Public Service Bill. Recommends replacing archaic conduct rules with an enforceable statutory Civil Service Bill. Recommends institutionalizing values like Nolan Principles: Selflessness, Integrity, Objectivity, Accountability, Openness, Honesty, and Leadership.
Chapter 3: Strengthening Anti-Corruption Mechanisms. Recommends reforming Article 311 of the Constitution to prevent judicial delays while preserving genuine whistleblower protections. Advocates establishing a National Ombudsman (Lokpal) and state-level Lokayuktas with independent investigative wings.
Chapter 4: Citizen-Centric Administration. Recommends making Citizen's Charters legally enforceable with clear service delivery standards, public grievance redressal officers, and automatic compensation for administrative delays.`,
  },
  {
    title: "Chester Barnard: The Functions of the Executive",
    category: "Administrative Thinkers",
    tags: ["Barnard", "Acceptance Theory", "Zone of Indifference", "Authority", "Formal/Informal"],
    content: `Section 1: Organization as a Cooperative System. Chester Barnard defines formal organization as a system of consciously coordinated personal activities or forces of two or more persons. Cooperation requires willingness to cooperate, common purpose, and effective communication.
Section 2: Acceptance Theory of Authority. Contrary to classical top-down views (Weber, Taylor), Barnard argues that authority is determined by the recipient, not the issuer. An order carries authority only if the employee understands it, believes it is consistent with organizational purpose, compatible with personal interest, and mentally and physically capable of compliance.
Section 3: The Zone of Indifference. Each subordinate has a zone of indifference within which orders will be accepted unquestioningly without conscious evaluation of authority. The executive's primary task is to maintain the net balance of inducements vs. contributions to broaden this zone.
Section 4: Informal Organization. Barnard was among the first to emphasize that informal organization—spontaneous social interactions, grapevines, and customs—naturally arises within all formal systems and is essential to preserve organizational vitality and morale.`,
  },
  {
    title: "Herbert Simon: Administrative Behavior & Bounded Rationality",
    category: "Administrative Thinkers",
    tags: ["Simon", "Bounded Rationality", "Decision Making", "Satisficing", "Fact-Value"],
    content: `Section 1: Critique of Classical Proverbs. Herbert Simon famously described the classical 'principles of administration' (Fayol, Gulick, Urwick) as unscientific proverbs because they occur in contradictory pairs (e.g., specialization vs. unity of command, centralization vs. span of control).
Section 2: The Core of Administration is Decision-Making. Simon states that administration is fundamentally a process of decision-making. Every decision contains two elements: Fact propositions (empirical, verifiable, concerning means) and Value propositions (ethical, non-verifiable, concerning goals).
Section 3: Bounded Rationality and Satisficing. Rejecting the classical 'Economic Man' who possesses complete knowledge and optimizes payoffs, Simon proposes 'Administrative Man'. Humans are bounded by cognitive constraints, limited information, time pressures, and psychological factors. Therefore, decision-makers do not optimize; they 'satisfice'—choosing the first alternative that meets their aspiration threshold.
Section 4: Programmed vs. Non-Programmed Decisions. Programmed decisions are repetitive, routine, and handled via standard operating procedures (SOPs). Non-programmed decisions deal with unstructured, novel dilemmas requiring managerial judgment and heuristic exploration.`,
  },
  {
    title: "Fred W. Riggs: Ecological Approach and Prismatic Society",
    category: "Administrative Thinkers",
    tags: ["Riggs", "Prismatic Model", "Sala Model", "Diffracted", "Fused", "Ecology"],
    content: `Section 1: Ecological Perspective in Public Administration. Fred Riggs pioneered the comparative ecological model, examining how public administration shapes, and is shaped by, its surrounding socio-cultural, economic, and political environment.
Section 2: The Agraria-Industria to Fused-Prismatic-Diffracted Typology. Traditional agricultural societies are 'Fused' (single structures perform multiple functions). Modern industrialized societies are 'Diffracted' (highly differentiated structures with specific functions). Developing transition societies are 'Prismatic' (trapped between tradition and modernity).
Section 3: Structural Features of Prismatic Societies.
1. Heterogeneity: High-tech institutions coexist with tribal panchayats.
2. Formalism: The discrepancy between prescribed law and observed administrative practice. Rules exist on paper but are subverted in practice.
3. Overlapping: Modern administrative structures exist, but traditional loyalties (caste, religion, kinship) dominate real operations.
Section 4: The Sala Model of Administration. The prismatic bureau is called 'Sala'. Characteristics include Poly-communalism (caste-based quotas and patronage), Bazaar-Canteen Model (prices determined by kinship/power rather than supply-demand), Price Indeterminacy, Nepotism, and Institutionalized Bureaucratic Power.`,
  },
  {
    title: "Indian Constitutional Framework: Centre-State Relations & Commissions",
    category: "Public Administration Notes",
    tags: ["Federalism", "Sarkaria Commission", "Punchhi Commission", "Art 356", "Inter-State Council"],
    content: `Section 1: Legislative and Administrative Relations (Articles 245–263). The Indian Constitution provides a distinct union-leaning federal structure. Article 246 schedules distribution via Union, State, and Concurrent lists. Article 256 and 257 obligate States to comply with Union laws, backed by Article 365 sanctions.
Section 2: Sarkaria Commission (1988) Recommendations.
1. Article 356 (President's Rule): Must be used strictly as a last resort, after issuing formal warnings to the State government.
2. Appointment of Governors: The Governor must be an eminent person outside state politics, appointed after active consultation with the State Chief Minister.
3. Inter-State Council (Article 263): Must be made a permanent, actively functioning constitutional forum for cooperative federalism.
Section 3: Punchhi Commission (2010) Recommendations.
1. Localised Emergency: Amend Article 355 to allow localized central intervention without dismissing the elected State legislative assembly.
2. Governor's Term and Impeachment: Fixed 5-year tenure; removal should follow an impeachment procedure analogous to the President or High Court judges.
3. Treaty Making Power: State consultation should precede treaties on State list subjects (Article 253).`,
  },
];

function ensureStore(): RagStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initialStore: RagStore = { documents: [], chunks: [] };
      // Populate seed documents
      for (const seed of SEED_DOCUMENTS) {
        addDocumentToStore(initialStore, {
          title: seed.title,
          category: seed.category,
          tags: seed.tags,
          content: seed.content,
          userId: "system",
        });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(initialStore, null, 2), "utf-8");
      return initialStore;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read knowledge store, resetting:", err);
    const fallbackStore: RagStore = { documents: [], chunks: [] };
    for (const seed of SEED_DOCUMENTS) {
      addDocumentToStore(fallbackStore, {
        title: seed.title,
        category: seed.category,
        tags: seed.tags,
        content: seed.content,
        userId: "system",
      });
    }
    return fallbackStore;
  }
}

function writeStore(store: RagStore) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write knowledge store:", err);
  }
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const stopWords = new Set([
    "this", "that", "with", "from", "have", "were", "which", "their", "there", "about",
    "would", "these", "other", "after", "between", "under", "should", "could", "while",
    "section", "chapter", "recommends", "notes", "based",
  ]);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}

function chunkText(
  text: string,
  docId: string,
  docTitle: string,
  category: string
): KnowledgeChunk[] {
  // Split into logical sections by double newlines or chapter/section indicators
  const rawSections = text
    .split(/\n\s*\n|(?=Chapter \d|Section \d)/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  const chunks: KnowledgeChunk[] = [];
  let pageCounter = 1;

  rawSections.forEach((section, idx) => {
    // If a section is very long (> 700 chars), subdivide it
    if (section.length > 900) {
      const subParts = section.match(/[^.!?]+[.!?]+(\s+|$)/g) || [section];
      let currentBuf = "";
      let subIdx = 0;
      for (const sent of subParts) {
        if ((currentBuf + sent).length > 700) {
          if (currentBuf.trim().length > 30) {
            chunks.push({
              id: `${docId}-chk-${idx}-${subIdx++}`,
              documentId: docId,
              documentTitle: docTitle,
              category,
              chunkIndex: chunks.length,
              text: currentBuf.trim(),
              keywords: extractKeywords(currentBuf),
              approxPage: pageCounter,
              heading: currentBuf.slice(0, 60).replace(/\n/g, " ") + "...",
            });
          }
          currentBuf = sent;
          if (subIdx % 2 === 0) pageCounter++;
        } else {
          currentBuf += sent;
        }
      }
      if (currentBuf.trim().length > 30) {
        chunks.push({
          id: `${docId}-chk-${idx}-${subIdx}`,
          documentId: docId,
          documentTitle: docTitle,
          category,
          chunkIndex: chunks.length,
          text: currentBuf.trim(),
          keywords: extractKeywords(currentBuf),
          approxPage: pageCounter,
          heading: currentBuf.slice(0, 60).replace(/\n/g, " ") + "...",
        });
      }
    } else {
      chunks.push({
        id: `${docId}-chk-${idx}`,
        documentId: docId,
        documentTitle: docTitle,
        category,
        chunkIndex: chunks.length,
        text: section,
        keywords: extractKeywords(section),
        approxPage: pageCounter,
        heading: section.slice(0, 60).replace(/\n/g, " ") + "...",
      });
      if (idx % 2 === 1) pageCounter++;
    }
  });

  return chunks;
}

function addDocumentToStore(
  store: RagStore,
  params: {
    title: string;
    category: KnowledgeDocument["category"];
    tags: string[];
    content: string;
    userId?: string;
    sourceUrl?: string;
  }
): KnowledgeDocument {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const chunks = chunkText(params.content, docId, params.title, params.category);

  const newDoc: KnowledgeDocument = {
    id: docId,
    userId: params.userId || "aspirant",
    title: params.title.trim().replace(/<[^>]*>?/gm, ""), // Sanitize HTML tags
    category: params.category,
    tags: params.tags && params.tags.length ? params.tags : ["UPSC", params.category],
    sourceUrl: params.sourceUrl,
    uploadedAt: new Date().toISOString(),
    fileSize: `${(params.content.length / 1024).toFixed(1)} KB`,
    chunkCount: chunks.length,
    snippet: params.content.slice(0, 180).replace(/\n/g, " ") + "...",
    status: "active",
  };

  store.documents.unshift(newDoc);
  store.chunks.push(...chunks);
  return newDoc;
}

// Public API Functions

export function listDocuments(userId?: string): KnowledgeDocument[] {
  const store = ensureStore();
  if (!userId) return store.documents;
  return store.documents.filter((d) => d.userId === "system" || d.userId === userId);
}

export function getDocumentById(id: string): { document: KnowledgeDocument; chunks: KnowledgeChunk[] } | null {
  const store = ensureStore();
  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return null;
  const chunks = store.chunks.filter((c) => c.documentId === id);
  return { document: doc, chunks };
}

export function indexNewDocument(params: {
  title: string;
  category: KnowledgeDocument["category"];
  tags?: string[];
  content: string;
  userId?: string;
  sourceUrl?: string;
}): { success: boolean; document?: KnowledgeDocument; message?: string } {
  // Upload security validation
  if (!params.title || !params.title.trim()) {
    return { success: false, message: "Document title is required." };
  }
  if (!params.content || params.content.trim().length < 20) {
    return { success: false, message: "Document content must contain at least 20 characters." };
  }
  if (params.content.length > 2_000_000) {
    return { success: false, message: "Document exceeds maximum allowed size (2MB)." };
  }
  // Sanitize title against directory traversal or injection
  const sanitizedTitle = params.title.trim().replace(/[/\\?%*:|"<>]/g, "");
  if (sanitizedTitle.length === 0) {
    return { success: false, message: "Invalid document title provided." };
  }

  const store = ensureStore();
  const doc = addDocumentToStore(store, {
    title: sanitizedTitle,
    category: params.category || "Custom Upload",
    tags: params.tags || [],
    content: params.content,
    userId: params.userId,
    sourceUrl: params.sourceUrl,
  });

  writeStore(store);
  return { success: true, document: doc };
}

export function archiveDocument(docId: string, archive: boolean = true): boolean {
  const store = ensureStore();
  const doc = store.documents.find((d) => d.id === docId);
  if (!doc) return false;

  doc.status = archive ? "archived" : "active";
  writeStore(store);
  return true;
}

export function deleteDocument(docId: string): boolean {
  const store = ensureStore();
  const docIndex = store.documents.findIndex((d) => d.id === docId);
  if (docIndex === -1) return false;

  store.documents.splice(docIndex, 1);
  store.chunks = store.chunks.filter((c) => c.documentId !== docId);
  writeStore(store);
  return true;
}

export function searchKnowledgeChunks(
  query: string,
  optionsOrCategory?: string | { category?: string; limit?: number; includeArchived?: boolean; userId?: string },
  maybeLimit?: number
): KnowledgeChunk[] {
  const store = ensureStore();
  const archivedDocIds = new Set(
    store.documents.filter((d) => d.status === "archived").map((d) => d.id)
  );

  let categoryFilter: string | undefined = undefined;
  let limit = 4;
  let includeArchived = false;
  let userId: string | undefined;

  if (typeof optionsOrCategory === "string") {
    categoryFilter = optionsOrCategory;
    if (typeof maybeLimit === "number") limit = maybeLimit;
  } else if (optionsOrCategory && typeof optionsOrCategory === "object") {
    categoryFilter = optionsOrCategory.category;
    if (typeof optionsOrCategory.limit === "number") limit = optionsOrCategory.limit;
    includeArchived = Boolean(optionsOrCategory.includeArchived);
    userId = optionsOrCategory.userId;
  }

  if (!query || query.trim().length === 0) {
    return store.chunks
      .filter((c) => {
        const document = store.documents.find((d) => d.id === c.documentId);
        const visibleToUser = !document || document.userId === "system" || document.userId === userId;
        return visibleToUser && (includeArchived || !archivedDocIds.has(c.documentId));
      })
      .slice(0, limit);
  }

  const normalized = query.toLowerCase();
  const queryTokens = normalized.split(/\s+/).filter((t) => t.length > 2);
  const queryVector = generateEmbedding(query);

  const candidateChunks = store.chunks.filter((chunk) => {
    const document = store.documents.find((d) => d.id === chunk.documentId);
    if (document && document.userId !== "system" && document.userId !== userId) {
      return false;
    }
    if (!includeArchived && archivedDocIds.has(chunk.documentId)) {
      return false;
    }
    if (categoryFilter && categoryFilter !== "All" && chunk.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  // 1. Compute Hybrid Scores (Dense Vector 55% + BM25/Keyword 45%)
  const scored = candidateChunks.map((chunk) => {
    if (!chunk.vector || chunk.vector.length === 0) {
      chunk.vector = generateEmbedding(chunk.text);
    }
    const vectorSimilarity = cosineSimilarity(queryVector, chunk.vector);

    let keywordScore = 0;
    const chunkLower = chunk.text.toLowerCase();
    const titleLower = chunk.documentTitle.toLowerCase();

    if (chunkLower.includes(normalized)) keywordScore += 15;
    if (titleLower.includes(normalized)) keywordScore += 10;

    for (const token of queryTokens) {
      if (titleLower.includes(token)) keywordScore += 4;
      if (chunk.keywords.includes(token)) keywordScore += 3;
      const count = (chunkLower.match(new RegExp(token, "g")) || []).length;
      keywordScore += Math.min(count * 1.5, 6);
    }

    // Normalized combined hybrid score (0 to 100)
    const hybridScore = vectorSimilarity * 55 + Math.min(keywordScore * 3, 45);

    return {
      ...chunk,
      score: Math.round(hybridScore * 10) / 10,
    };
  });

  // Filter positive scores and sort
  const topCandidates = scored
    .filter((c) => (c.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, Math.max(limit * 2, 8));

  if (topCandidates.length === 0) return [];

  // 2. Cross-Encoder Multi-Factor Reranker
  const rerankInputs = topCandidates.map((c) => ({
    id: c.id,
    title: c.documentTitle,
    category: c.category,
    page: c.approxPage || 1,
    text: c.text,
    initialScore: c.score,
  }));

  const reranked = rerankDocuments(query, rerankInputs, limit);

  // Map reranked back to KnowledgeChunk with final calibrated score
  return reranked.map((r) => {
    const orig = topCandidates.find((c) => c.id === r.chunk.id)!;
    return {
      ...orig,
      score: Math.round(r.relevance * 100),
    };
  });
}

export interface AdvancedRagRetrievalResult {
  query: string;
  chunks: KnowledgeChunk[];
  confidence: "high" | "medium" | "low" | "insufficient";
  confidenceScore: number; // 0.0 to 1.0
  insufficientEvidence: boolean;
  refusalExplanation?: string;
  citations: Array<{
    documentId: string;
    title: string;
    page: number;
    chunkId: string;
    excerpt: string;
    relevance: number;
    verifiedSupport: boolean;
  }>;
}

/**
 * Advanced RAG pipeline with hybrid retrieval, cross-encoder reranking,
 * calibrated confidence scoring, strict citation verification, and explicit
 * insufficient-evidence guardrail.
 */
export function searchKnowledgeChunksAdvanced(
  query: string,
  options?: { category?: string; limit?: number; minConfidenceThreshold?: number; userId?: string }
): AdvancedRagRetrievalResult {
  const threshold = options?.minConfidenceThreshold ?? 0.38;
  const limit = options?.limit ?? 4;
  const chunks = searchKnowledgeChunks(query, { category: options?.category, limit, userId: options?.userId });

  if (chunks.length === 0) {
    return {
      query,
      chunks: [],
      confidence: "insufficient",
      confidenceScore: 0.0,
      insufficientEvidence: true,
      refusalExplanation:
        "Based strictly on the indexed knowledge base, no authoritative sources were found for this query. BOLT will not hallucinate unverified assertions.",
      citations: [],
    };
  }

  // Calculate composite confidence score based on top score, score separation, and token overlap
  const topScore = (chunks[0].score || 0) / 100;
  const avgTopScores = chunks.slice(0, 2).reduce((sum, c) => sum + (c.score || 0) / 100, 0) / Math.min(chunks.length, 2);
  const confidenceScore = Math.round((topScore * 0.7 + avgTopScores * 0.3) * 100) / 100;

  let confidence: "high" | "medium" | "low" | "insufficient";
  if (confidenceScore >= 0.72) {
    confidence = "high";
  } else if (confidenceScore >= 0.52) {
    confidence = "medium";
  } else if (confidenceScore >= threshold) {
    confidence = "low";
  } else {
    confidence = "insufficient";
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  // Generate verified citations with factual claim groundings
  const citations = chunks.map((c) => {
    const chunkLower = c.text.toLowerCase();
    const matches = queryTerms.filter((term) => chunkLower.includes(term));
    const tokenHitRatio = queryTerms.length > 0 ? matches.length / queryTerms.length : 0;
    const verifiedSupport = tokenHitRatio >= 0.4 || (c.score || 0) >= 65;

    return {
      documentId: c.documentId,
      title: c.documentTitle,
      page: c.approxPage || 1,
      chunkId: c.id,
      excerpt: c.text.slice(0, 240) + "...",
      relevance: Math.round(((c.score || 50) / 100) * 100) / 100,
      verifiedSupport,
    };
  });

  const insufficientEvidence = confidence === "insufficient";

  return {
    query,
    chunks,
    confidence,
    confidenceScore,
    insufficientEvidence,
    refusalExplanation: insufficientEvidence
      ? "Based strictly on the indexed documents, insufficient authoritative evidence is available to verify this claim. BOLT will not extrapolate or hallucinate ungrounded assertions."
      : undefined,
    citations,
  };
}

