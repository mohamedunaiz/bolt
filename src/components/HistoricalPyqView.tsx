import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  Compass,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { HistoricalPyq } from "../types";

// Comprehensive fallback dataset spanning 1855 to 2026
const DEFAULT_HISTORICAL_PYQS: HistoricalPyq[] = [
  // 19th Century (1855 - 1899)
  {
    id: "pyq-1855-1",
    year: 1855,
    era: "19th_century",
    eraLabel: "19th Century (1855–1899)",
    subject: "Modern History & Administrative Evolution",
    topic: "Macaulay Committee & Competitive ICS Exam Birth",
    isPeripheralArea: true,
    peripheralTag: "Colonial Civil Service Evolution (1855-1947)",
    isCurrentAffairs: false,
    difficulty: "Hard",
    questionText:
      "With reference to the open competitive examination for the Indian Civil Service introduced under the Charter Act of 1853 and the Macaulay Committee (1854), consider the following statements:\n\n1. The Charter Act of 1853 ended the patronage system of the Court of Directors of the East India Company.\n2. The Macaulay Committee recommended that the examination be conducted exclusively on specialized administrative legal codes rather than general liberal education.\n3. The first open competitive examination was held in London in July 1855.\n\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "1 and 3 only" },
      { key: "C", text: "2 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "B",
    explanation:
      "Statements 1 and 3 are correct. The Charter Act of 1853 abolished the Court of Directors' patronage to Haileybury College and established an open merit-based competitive examination. The first exam occurred in London in 1855. Statement 2 is incorrect because Lord Macaulay firmly insisted on a broad-based, liberal university education (Classics, Mathematics, Moral Sciences) believing that general intellectual excellence was superior to early vocational specialization.",
    optionAnalysis: [
      { optionKey: "1", analysis: "Correct: Charter Act 1853 Section 36 terminated proprietary patronage.", isCorrect: true },
      { optionKey: "2", analysis: "Incorrect: Macaulay advocated general liberal arts education rather than vocational legalism.", isCorrect: false },
      { optionKey: "3", analysis: "Correct: First examination was conducted in London in July 1855.", isCorrect: true },
    ],
    historicalContext: "The birth of competitive meritocracy in modern civil services, predating Britain's own domestic civil service reform.",
    relatedConcept: "Meritocracy, Charter Act 1853, Macaulay Committee 1854",
  },
  {
    id: "pyq-1861-1",
    year: 1861,
    era: "19th_century",
    eraLabel: "19th Century (1855–1899)",
    subject: "Modern History & Polity",
    topic: "Indian Civil Service Act & Councils Act 1861",
    isPeripheralArea: true,
    peripheralTag: "Colonial Civil Service Evolution (1855-1947)",
    isCurrentAffairs: false,
    difficulty: "Hard",
    questionText:
      "Consider the following statements regarding the Indian Councils Act of 1861 and the Indian Civil Service Act of 1861:\n\n1. The Indian Councils Act of 1861 gave statutory recognition to the portfolio system introduced by Lord Canning in 1859.\n2. The Indian Civil Service Act of 1861 reserved all senior civil posts exclusively for persons who had resided in India for at least seven years.\n3. It restored legislative powers of making laws to the Governors-in-Council of Bombay and Madras, reversing the centralization of the 1833 Act.\n\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "1 and 3 only" },
      { key: "B", text: "2 only" },
      { key: "C", text: "1 and 2 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "A",
    explanation:
      "Statements 1 and 3 are correct. The Act of 1861 institutionalized Canning's portfolio system (ancestor of cabinet ministries) and initiated legislative decentralization by returning law-making powers to Bombay and Madras. Statement 2 is incorrect because the Indian Civil Service Act 1861 explicitly reserved covenanted offices for members who had passed the London competitive examination, though it allowed exceptional appointments under rigid covenants.",
    optionAnalysis: [
      { optionKey: "1", analysis: "Correct: Canning's portfolio system was legally recognized under Section 8.", isCorrect: true },
      { optionKey: "2", analysis: "Incorrect: Covenanted positions were reserved for competitive exam entrants.", isCorrect: false },
      { optionKey: "3", analysis: "Correct: Legislative decentralization reversed the unitary 1833 centralization.", isCorrect: true },
    ],
    historicalContext: "Foundation of ministerial governance and modern federal legislative division in British India.",
    relatedConcept: "Portfolio System, Decentralization, Covenanted Civil Service",
  },
  {
    id: "pyq-1886-1",
    year: 1886,
    era: "19th_century",
    eraLabel: "19th Century (1855–1899)",
    subject: "Modern History & Administration",
    topic: "Aitchison Commission & Tripartite Civil Service Classification",
    isPeripheralArea: true,
    peripheralTag: "Colonial Commissions & Civil Service Restructuring",
    isCurrentAffairs: false,
    difficulty: "Medium",
    questionText:
      "The Public Service Commission of 1886, chaired by Sir Charles Aitchison, was appointed by Lord Dufferin. Which of the following recommendations were made by this commission?\n\n1. Abolition of the Statutory Civil Service created in 1879.\n2. Reorganization of civil services into three tiers: Imperial, Provincial, and Subordinate.\n3. Holding simultaneous examinations for the ICS in London and India immediately.\n\nSelect the correct answer using the code given below:",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 and 3 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "A",
    explanation:
      "Statements 1 and 2 are correct. Aitchison Commission recommended abolishing the ineffective Statutory Civil Service (which nominated Indians of aristocratic birth) and establishing the three-fold classification: Imperial Civil Service (London exam), Provincial Civil Service, and Subordinate Civil Service. Statement 3 is incorrect because the Aitchison Commission expressly rejected simultaneous examinations in India and London, arguing it would compromise administrative efficiency.",
    optionAnalysis: [
      { optionKey: "1", analysis: "Correct: Recommended abolition of 1879 Statutory Civil Service.", isCorrect: true },
      { optionKey: "2", analysis: "Correct: Created the Imperial, Provincial, Subordinate structure that survived into independent India.", isCorrect: true },
      { optionKey: "3", analysis: "Incorrect: Rejected simultaneous exams (simultaneous exams were only accepted in principle after the 1893 Commons resolution and implemented in 1922).", isCorrect: false },
    ],
    historicalContext: "Pre-independence structural framework directly inherited by modern All-India Services and State Civil Services.",
    relatedConcept: "Aitchison Commission 1886, Imperial Civil Service, Statutory Civil Service",
  },

  // Pre-Independence (1900 - 1947)
  {
    id: "pyq-1919-1",
    year: 1919,
    era: "pre_independence",
    eraLabel: "Pre-Independence (1900–1947)",
    subject: "Polity & Constitutional History",
    topic: "Montagu-Chelmsford Reforms & Dyarchy in Provinces",
    isPeripheralArea: true,
    peripheralTag: "Peripheral Dyarchy Transferred vs Reserved Subjects",
    isCurrentAffairs: false,
    difficulty: "Medium",
    questionText:
      "Under the Government of India Act 1919, the provincial subjects were bifurcated into 'Reserved' and 'Transferred' subjects. Which of the following were treated as 'Reserved' subjects?\n\n1. Administration of Justice\n2. Local Self-Government\n3. Land Revenue\n4. Police\n\nSelect the correct answer using the code given below:",
    options: [
      { key: "A", text: "1, 2 and 3" },
      { key: "B", text: "2, 3 and 4" },
      { key: "C", text: "1, 3 and 4" },
      { key: "D", text: "1, 2, 3 and 4" },
    ],
    correctOption: "C",
    explanation:
      "Subjects 1, 3, and 4 (Administration of Justice, Land Revenue, and Police) were 'Reserved' subjects administered by the Governor with his Executive Council (not responsible to the provincial legislature). Local Self-Government, Education, and Public Health were 'Transferred' subjects administered by Ministers responsible to the Legislative Council.",
    optionAnalysis: [
      { optionKey: "1", analysis: "Reserved: Essential law and justice remained with executive council.", isCorrect: true },
      { optionKey: "2", analysis: "Transferred: Given to Indian ministers under legislative accountability.", isCorrect: false },
      { optionKey: "3", analysis: "Reserved: Fiscal revenue collection stayed with Governor.", isCorrect: true },
      { optionKey: "4", analysis: "Reserved: Police was kept under direct colonial executive control.", isCorrect: true },
    ],
    historicalContext: "Classic UPSC Prelims theme testing precise subject division under the 1919 Dyarchy.",
    relatedConcept: "Dyarchy, GOI Act 1919, Mont-Ford Reforms",
  },
  {
    id: "pyq-1935-1",
    year: 1935,
    era: "pre_independence",
    eraLabel: "Pre-Independence (1900–1947)",
    subject: "Polity & Constitutional History",
    topic: "Government of India Act 1935 & Federal Court",
    isPeripheralArea: false,
    peripheralTag: "Constitutional Blueprint of the 1950 Constitution",
    isCurrentAffairs: false,
    difficulty: "Medium",
    questionText:
      "With reference to the Government of India Act 1935, consider the following provisions:\n\n1. It provided for the establishment of an All-India Federation consisting of Provinces and Princely States as units.\n2. The federation never came into being because the required number of Princely States refused to sign the Instruments of Accession.\n3. It abolished Dyarchy at the provincial level and introduced it at the Federal Centre.\n\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 and 3 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "D",
    explanation:
      "All three statements are correct. The 1935 Act proposed an All-India Federation with three legislative lists (Federal, Provincial, Concurrent). The federation never materialized as Princely States stayed away. It replaced Provincial Dyarchy with Provincial Autonomy and introduced Dyarchy at the Central executive level.",
    historicalContext: "Over 60% of the structural articles in the 1950 Constitution trace their origin directly to the 1935 Act.",
    relatedConcept: "GOI Act 1935, Provincial Autonomy, Federal Court",
  },

  // Early Republic (1948 - 1999)
  {
    id: "pyq-1979-1",
    year: 1979,
    era: "early_republic",
    eraLabel: "Early Republic (1948–1999)",
    subject: "Polity & Governance",
    topic: "Article 356 & State Emergency Judicial Review",
    isPeripheralArea: true,
    peripheralTag: "Peripheral Emergency Provisions & Federal Safeguards",
    isCurrentAffairs: false,
    difficulty: "Hard",
    questionText:
      "In the context of President's Rule under Article 356 of the Constitution of India, consider the following statements:\n\n1. The 44th Constitutional Amendment Act (1978) introduced a provision requiring approval of a proclamation by both Houses of Parliament within one month.\n2. Beyond one year, President's Rule can only be extended if a National Emergency is in operation and the Election Commission certifies that elections cannot be held.\n3. Dissolution of the State Legislative Assembly takes effect immediately upon the issuance of the Presidential Proclamation.\n\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "2 only" },
      { key: "B", text: "1 and 2 only" },
      { key: "C", text: "2 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "A",
    explanation:
      "Statement 2 is correct: Under Article 356(5) (inserted by the 44th Amendment), extension beyond one year requires two conditions: National Emergency in operation and EC certification. Statement 1 is incorrect because Article 356 proclamations must be approved within TWO months (unlike Article 352 which was reduced to one month). Statement 3 is incorrect because, as held in S.R. Bommai (1994), the Assembly cannot be dissolved until Parliament approves the proclamation; it can only be suspended initially.",
    historicalContext: "The evolution of judicial and legislative curbs on executive misuse of Article 356 post-Internal Emergency.",
    relatedConcept: "Article 356, 44th Amendment Act 1978, S.R. Bommai Case 1994",
  },

  // Modern Era (2000 - 2026) with Peripheral Areas & Current Affairs
  {
    id: "pyq-2024-peri-1",
    year: 2024,
    era: "modern",
    eraLabel: "Modern Era (2000–2026)",
    subject: "Polity & Governance",
    topic: "PESA Act 1996 & Tribal Customary Autonomous Powers",
    isPeripheralArea: true,
    peripheralTag: "Tribal Customary Laws & PESA Peripheral Provisions",
    isCurrentAffairs: true,
    difficulty: "Hard",
    questionText:
      "With reference to the Provisions of the Panchayats (Extension to the Scheduled Areas) Act, 1996 (PESA), consider the following statements regarding peripheral powers of the Gram Sabha in Fifth Schedule Areas:\n\n1. The Gram Sabha possesses the mandatory right to be consulted prior to acquiring land in Scheduled Areas for development projects.\n2. Recommendation of the Gram Sabha is mandatory prior to grant of prospective license or mining lease for minor minerals in Scheduled Areas.\n3. Ownership of minor forest produce is endowed entirely in the state Forest Development Corporation, excluding the Gram Sabha.\n\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 and 3 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "A",
    explanation:
      "Statements 1 and 2 are correct under Section 4 of PESA 1996. Gram Sabhas must be consulted before land acquisition and their recommendation is mandatory prior to granting mining concessions for minor minerals. Statement 3 is incorrect because Section 4(m)(ii) explicitly endows the ownership of minor forest produce directly in the Gram Sabha and Panchayats at the appropriate level.",
    historicalContext: "UPSC frequently tests deep peripheral nuances of PESA rules and tribal customary self-rule.",
    relatedConcept: "PESA 1996, Minor Forest Produce, Fifth Schedule",
  },
  {
    id: "pyq-2025-peri-2",
    year: 2025,
    era: "modern",
    eraLabel: "Modern Era (2000–2026)",
    subject: "Environment & International Treaties",
    topic: "Deep Ecology Conventions: Minamata, Rotterdam & Kunming-Montreal",
    isPeripheralArea: true,
    peripheralTag: "Deep Ecology & Lesser-Known Treaties",
    isCurrentAffairs: true,
    difficulty: "Hard",
    questionText:
      "Consider the following international environmental agreements and their specialized regulatory mandates:\n\n1. Minamata Convention — Phasing out intentional anthropogenic mercury emissions across artisanal gold mining and dental amalgams.\n2. Rotterdam Convention — Promoting shared responsibility and Prior Informed Consent (PIC) procedure for hazardous industrial chemicals.\n3. Kunming-Montreal Global Biodiversity Framework — Target 3 mandates protection of at least 30% of planetary terrestrial and inland water areas by 2030 ('30x30').\n\nWhich of the pairs given above are correctly matched?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 and 3 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "D",
    explanation:
      "All three are correctly matched. Minamata Convention (2013, entered into force 2017) targets mercury pollution. Rotterdam Convention (1998) enforces the Prior Informed Consent procedure for banned or severely restricted chemicals. The Kunming-Montreal Global Biodiversity Framework adopted under the CBD in 2022 includes Target 3, known globally as the 30x30 biodiversity conservation target.",
    historicalContext: "High-yield peripheral multilateral treaties frequently tested in UPSC Prelims.",
    relatedConcept: "Minamata, Rotterdam, Kunming-Montreal GBF, 30x30",
  },
  {
    id: "pyq-2026-curr-1",
    year: 2026,
    era: "modern",
    eraLabel: "Modern Era (2000–2026)",
    subject: "Economy & Monetary Technology",
    topic: "UPI Merchant Discount Rate (MDR) Framework 2026",
    isPeripheralArea: false,
    peripheralTag: "Digital Public Infrastructure & Monetary Governance",
    isCurrentAffairs: true,
    difficulty: "Medium",
    questionText:
      "Consider the following statements regarding the Unified Payments Interface (UPI) Merchant Discount Rate (MDR) framework introduced in 2026:\n\n1. The new UPI MDR framework excludes peer-to-peer (P2P) transactions entirely.\n2. A flat capped MDR applies to high-value transactions in essential sectors including fuel and railway bookings.\n3. The collected MDR is retained exclusively by the merchant's acquiring bank without ecosystem revenue sharing.\n\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "2 only" },
      { key: "B", text: "1 and 3 only" },
      { key: "C", text: "1 and 2 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "C",
    explanation:
      "Statements 1 and 2 are correct. Under the NPCI framework, P2P transactions and small merchants remain fully exempt, while essential utilities incur a low flat fee above ₹2,000. Statement 3 is incorrect because the MDR is distributed across payment ecosystem partners including the issuing bank, acquiring bank, NPCI, and third-party application providers (TPAPs).",
    historicalContext: "2026 Financial Governance and Digital Public Goods sustainability reforms.",
    relatedConcept: "UPI, NPCI, MDR, Payment and Settlement Systems Act 2007",
  },
  {
    id: "pyq-2026-curr-2",
    year: 2026,
    era: "modern",
    eraLabel: "Modern Era (2000–2026)",
    subject: "Science & Peripheral Technology",
    topic: "EUV Lithography & Semiconductor Fabrication Peripheral S&T",
    isPeripheralArea: true,
    peripheralTag: "Semiconductor & Quantum S&T Fringe",
    isCurrentAffairs: true,
    difficulty: "Hard",
    questionText:
      "In the context of the India Semiconductor Mission (ISM) and sub-2-nanometer chip fabrication, what is the primary technological significance of Extreme Ultraviolet (EUV) lithography?\n\n1. It utilizes light with a wavelength of 13.5 nanometers produced by laser-pulsed molten tin droplets in a vacuum.\n2. Unlike DUV (Deep Ultraviolet), EUV light can travel through standard refractive glass optical lenses without being absorbed.\n3. High-NA (Numerical Aperture) EUV lithography allows printing of atomic-scale transistor features in a single exposure without multi-patterning.\n\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "1 and 3 only" },
      { key: "C", text: "2 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "B",
    explanation:
      "Statements 1 and 3 are correct. EUV lithography operates at 13.5 nm wavelength generated by pulsing CO2 lasers onto molten tin droplets. High-NA EUV increases numerical aperture from 0.33 to 0.55, enabling printing of 2nm-and-below nodes without complex multi-patterning. Statement 2 is incorrect because 13.5 nm EUV light is absorbed by almost all matter, including glass and air; hence EUV systems must operate in a high vacuum using ultra-flat Bragg reflective mirrors (molybdenum/silicon layers), not conventional refractive lenses.",
    historicalContext: "Cutting-edge peripheral science topic critical for UPSC GS 3 and technological sovereignty.",
    relatedConcept: "EUV Lithography, High-NA, India Semiconductor Mission",
  },
];

interface HistoricalPyqViewProps {
  onAskBoltQuestion?: (qText: string) => void;
}

export const HistoricalPyqView: React.FC<HistoricalPyqViewProps> = ({
  onAskBoltQuestion,
}) => {
  const [pyqs, setPyqs] = useState<HistoricalPyq[]>(DEFAULT_HISTORICAL_PYQS);
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [peripheralOnly, setPeripheralOnly] = useState<boolean>(false);
  const [currentAffairsOnly, setCurrentAffairsOnly] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch from Python backend endpoint with failover to searchUpscPyqs
  useEffect(() => {
    const fetchPyqs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedEra !== "all") params.append("era", selectedEra);
        if (peripheralOnly) params.append("peripheral", "true");
        if (currentAffairsOnly) params.append("currentAffairs", "true");
        if (selectedSubject !== "all") params.append("subject", selectedSubject);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());

        const res = await fetch(`/api/python/pyqs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data?.questions) && data.data.questions.length > 0) {
            setPyqs(data.data.questions);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend PYQ fetch fallback to client collection:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPyqs();
  }, [selectedEra, peripheralOnly, currentAffairsOnly, selectedSubject, searchQuery]);

  // Client-side filtering when using fallback
  const filteredPyqs = useMemo(() => {
    return pyqs.filter((q) => {
      if (selectedEra !== "all" && q.era !== selectedEra) return false;
      if (selectedTier !== "all") {
        if (selectedTier === "PRACTICE_QUESTION" && q.verificationTier !== "PRACTICE_QUESTION") return false;
        if (selectedTier === "VERIFIED_OFFICIAL_PYQ" && q.verificationTier !== "VERIFIED_OFFICIAL_PYQ") return false;
        if (selectedTier === "VERIFIED_RELIABLE_ARCHIVE" && q.verificationTier !== "VERIFIED_RELIABLE_ARCHIVE") return false;
      }
      if (peripheralOnly && !q.isPeripheralArea) return false;
      if (currentAffairsOnly && !q.isCurrentAffairs) return false;
      if (selectedSubject !== "all" && !q.subject.toLowerCase().includes(selectedSubject.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const qSearch = searchQuery.toLowerCase();
        const matchesText = q.questionText.toLowerCase().includes(qSearch);
        const matchesTopic = q.topic.toLowerCase().includes(qSearch);
        const matchesSubject = q.subject.toLowerCase().includes(qSearch);
        const matchesYear = q.year.toString().includes(qSearch);
        const matchesPeripheral = q.peripheralTag?.toLowerCase().includes(qSearch);
        const matchesSource = q.source?.toLowerCase().includes(qSearch);
        if (!matchesText && !matchesTopic && !matchesSubject && !matchesYear && !matchesPeripheral && !matchesSource) {
          return false;
        }
      }
      return true;
    });
  }, [pyqs, selectedEra, selectedTier, peripheralOnly, currentAffairsOnly, selectedSubject, searchQuery]);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    if (userAnswers[questionId]) return; // already answered
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    // Auto-reveal explanation on answer
    setExpandedExplanations((prev) => ({ ...prev, [questionId]: true }));
  };

  const toggleExplanation = (questionId: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleResetTest = () => {
    setUserAnswers({});
    setExpandedExplanations({});
  };

  // Score statistics
  const answeredQuestions = Object.keys(userAnswers);
  const totalAnswered = answeredQuestions.length;
  let correctCount = 0;
  answeredQuestions.forEach((qId) => {
    const q = pyqs.find((item) => item.id === qId);
    if (q && userAnswers[qId] === q.correctOption) {
      correctCount += 1;
    }
  });

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const marksScored = (correctCount * 2 - (totalAnswered - correctCount) * 0.66).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#121824] border border-[#232f45] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>1855 – 2026 Historical Archive</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">
                19th Century to Modern Era
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                Peripheral & Current Affairs Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              UPSC PYQ Historical Archive (19th Century – 2026)
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              Master the entire continuum of civil services examinations—from the inaugural 1855
              competitive ICS exam under the Macaulay Committee through the 2026 modern Prelims.
              Specially curated to highlight <strong className="text-amber-300">peripheral edge areas</strong> (lesser-known statutory rules, customary provisions, treaties) and <strong className="text-blue-300">contemporary current affairs</strong>.
            </p>
          </div>

          {/* Score Snapshot Badge */}
          {totalAnswered > 0 && (
            <div className="p-3.5 rounded-xl bg-[#172033] border border-slate-700/80 text-right flex flex-col sm:items-end justify-center">
              <span className="text-[11px] text-slate-400 font-medium">Session Score</span>
              <div className="text-lg font-bold text-white">
                {marksScored} <span className="text-xs text-slate-400 font-normal">/ {totalAnswered * 2} Marks</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {accuracy}% Accuracy ({correctCount}/{totalAnswered})
              </span>
            </div>
          )}
        </div>

        {/* Quick Era Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Era:</span>
          </span>
          {[
            { id: "all", label: "All Eras (1855–2026)" },
            { id: "19th_century", label: "19th Century (1855–1899)" },
            { id: "pre_independence", label: "Pre-Independence (1900–1947)" },
            { id: "early_republic", label: "Early Republic (1948–1999)" },
            { id: "modern", label: "Modern Era (2000–2026)" },
          ].map((era) => (
            <button
              key={era.id}
              onClick={() => setSelectedEra(era.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedEra === era.id
                  ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#121824] border border-[#232f45] rounded-2xl p-4 shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword (e.g. Macaulay, PESA, Governor, Treaty, 1855)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects</option>
              <option value="Polity">Polity & Governance</option>
              <option value="History">Modern History & Administration</option>
              <option value="Environment">Environment & Treaties</option>
              <option value="Economy">Economy & Monetary Tech</option>
              <option value="Science">Science & Technology</option>
            </select>
          </div>

          {/* Verification Tier Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Tiers (Official + Practice)</option>
              <option value="VERIFIED_OFFICIAL_PYQ">Official UPSC PYQs Only</option>
              <option value="VERIFIED_RELIABLE_ARCHIVE">Historical Archives (1855–1947)</option>
              <option value="PRACTICE_QUESTION">BOLT Practice Drills</option>
            </select>
          </div>

          {/* Peripheral Areas Toggle */}
          <div className="md:col-span-2">
            <button
              onClick={() => setPeripheralOnly(!peripheralOnly)}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border ${
                peripheralOnly
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "bg-[#0d121c] text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Peripheral Only</span>
            </button>
          </div>

          {/* Current Affairs Toggle */}
          <div className="md:col-span-2">
            <button
              onClick={() => setCurrentAffairsOnly(!currentAffairsOnly)}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border ${
                currentAffairsOnly
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm"
                  : "bg-[#0d121c] text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-blue-400" />
              <span>Current Affairs</span>
            </button>
          </div>
        </div>

        {/* Results stats & reset */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <span>
              Showing <strong className="text-white">{filteredPyqs.length}</strong> questions in historical archive
            </span>
            {peripheralOnly && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                Peripheral Filter Active
              </span>
            )}
            {currentAffairsOnly && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                Current Affairs Active
              </span>
            )}
          </div>

          {totalAnswered > 0 && (
            <button
              onClick={handleResetTest}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset My Answers</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions Stream */}
      <div className="space-y-6">
        {filteredPyqs.length === 0 ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800 space-y-3">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No historical PYQs matched your filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try switching the Era filter back to "All Eras" or toggling off the Peripheral / Current
              Affairs filters.
            </p>
            <button
              onClick={() => {
                setSelectedEra("all");
                setPeripheralOnly(false);
                setCurrentAffairsOnly(false);
                setSelectedSubject("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredPyqs.map((q, idx) => {
            const userAnswer = userAnswers[q.id];
            const isAnswered = !!userAnswer;
            const isCorrect = userAnswer === q.correctOption;
            const isExpanded = expandedExplanations[q.id];

            return (
              <div
                key={q.id}
                className={`rounded-2xl border transition-all p-5 sm:p-6 space-y-4 ${
                  isAnswered
                    ? isCorrect
                      ? "bg-[#0e1919] border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                      : "bg-[#181116] border-rose-500/40 shadow-lg shadow-rose-950/20"
                    : "bg-[#121824] border-[#232f45] hover:border-slate-700"
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.verificationTier === "PRACTICE_QUESTION" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>BOLT Practice Drill ({q.year})</span>
                      </span>
                    ) : q.verificationTier === "VERIFIED_RELIABLE_ARCHIVE" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Historical Archive ({q.year})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>UPSC {q.year} Official PYQ</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                      {q.eraLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">{q.subject}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {q.officialAnswerVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Official Key</span>
                      </span>
                    )}
                    {q.isPeripheralArea && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center space-x-1">
                        <Compass className="w-3 h-3 text-amber-400" />
                        <span>Peripheral Area</span>
                      </span>
                    )}
                    {q.isCurrentAffairs && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-blue-400" />
                        <span>Current Affairs</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        q.difficulty === "Hard"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                {/* Provenance & Source Attribution */}
                {(q.source || q.verificationTier) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-medium">Source / Provenance:</span>
                      <span className="text-slate-200 font-semibold">
                        {q.source || (q.verificationTier === "PRACTICE_QUESTION" ? "BOLT Practice Drill" : "Official UPSC Examination Records")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {q.sourceUrl && (
                        <a
                          href={q.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline font-medium flex items-center space-x-1"
                        >
                          <span>Official Reference</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtopic / Peripheral Tag */}
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <strong className="text-slate-200">Topic:</strong>
                  <span>{q.topic}</span>
                  {q.peripheralTag && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">Tag: {q.peripheralTag}</span>
                    </>
                  )}
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base text-slate-100 whitespace-pre-line leading-relaxed font-['Outfit'] font-normal">
                  {q.questionText}
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = userAnswer === opt.key;
                    const isThisCorrect = opt.key === q.correctOption;

                    let btnStyle = "bg-[#0d121c] border-slate-700/80 text-slate-200 hover:border-slate-500 hover:bg-[#151d2d]";
                    if (isAnswered) {
                      if (isThisCorrect) {
                        btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500";
                      } else if (isSelected) {
                        btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500";
                      } else {
                        btnStyle = "bg-[#0d121c] border-slate-800 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                            isAnswered && isThisCorrect
                              ? "bg-emerald-500 text-white border-emerald-400"
                              : isAnswered && isSelected
                              ? "bg-rose-500 text-white border-rose-400"
                              : "bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed flex-grow">
                          {opt.text}
                        </span>
                        {isAnswered && isThisCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {isAnswered && isSelected && !isThisCorrect && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Drawer */}
                {isAnswered && (
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExplanation(q.id)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <span>
                        {isExpanded ? "Hide Detailed UPSC Explanation" : "View Detailed UPSC Rationale & Historical Context"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-[#0d121c] border border-slate-800 space-y-3 animate-fadeIn">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            Correct Answer: Option {q.correctOption}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>

                        {/* Statement-wise Option Analysis if available */}
                        {q.optionAnalysis && q.optionAnalysis.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Statement-wise Dissection:
                            </span>
                            {q.optionAnalysis.map((oa, i) => (
                              <div
                                key={i}
                                className={`text-xs p-2 rounded-lg flex items-start space-x-2 ${
                                  oa.isCorrect
                                    ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/40"
                                    : "bg-rose-950/30 text-rose-300 border border-rose-900/40"
                                }`}
                              >
                                <span className="font-bold">Stmt {oa.optionKey}:</span>
                                <span>{oa.analysis}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Historical Context & Why UPSC Tests This */}
                        {q.historicalContext && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                            <strong className="text-amber-300 block mb-0.5">
                              Historical Context & UPSC Pedagogical Importance:
                            </strong>
                            {q.historicalContext}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] text-slate-400">
                            Related: <strong className="text-slate-300">{q.relatedConcept || q.topic}</strong>
                          </span>
                          <button
                            onClick={() =>
                              onAskBoltQuestion?.(
                                `Explain the historical and constitutional nuances of UPSC question from year ${q.year} on "${q.topic}": ${q.questionText}`
                              )
                            }
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ask Bolt Mentor</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
