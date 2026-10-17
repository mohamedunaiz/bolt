import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  History,
  Compass,
  Calendar,
  Filter,
} from "lucide-react";
import { PrelimsQuestion } from "../types";

interface PrelimsPracticeViewProps {
  questions: PrelimsQuestion[];
  onAskBoltQuestion: (q: PrelimsQuestion) => void;
  onRecordAnswer?: (questionId: string, isCorrect: boolean) => void;
}

const HISTORICAL_ADDITIONAL_PYQS: PrelimsQuestion[] = [
  {
    id: "pyq-1855-ics",
    questionNumber: 101,
    subject: "Modern History & Administration",
    difficulty: "Hard",
    isCurrentAffairs: false,
    questionText:
      "Regarding the introduction of open competitive examinations for the Indian Civil Service under the Charter Act of 1853 and the Macaulay Committee Report of 1854, which of the following statements is correct?",
    options: [
      { key: "A", text: "Examinations were simultaneously held in London and Calcutta from 1855 onwards." },
      { key: "B", text: "The first competitive examination was conducted in London in 1855, with maximum age limit initially fixed at 23 years." },
      { key: "C", text: "The examination syllabus gave decisive weightage to Sanskrit and Persian literature over European classics." },
      { key: "D", text: "Satyendranath Tagore topped the very first examination held in 1855." },
    ],
    correctOption: "B",
    explanation:
      "Following the Macaulay Committee (1854), the first open competitive examination for the Indian Civil Service was conducted in London in July 1855 under the British Civil Service Commission. The age limit was initially 18 to 23 years, later reduced to disadvantage Indian aspirants. Satyendranath Tagore became the first Indian to qualify later in 1863.",
    source: "Charter Act of 1853 & 1855 ICS Examination Records (Colonial Era Archive)",
    relatedConcept: "Civil Services Evolution, Charter Act 1853, Macaulay Committee 1854",
  },
  {
    id: "pyq-1883-ilbert",
    questionNumber: 102,
    subject: "Modern History",
    difficulty: "Hard",
    isCurrentAffairs: false,
    questionText:
      "The Ilbert Bill controversy (1883) during the viceroyalty of Lord Ripon was essentially related to which of the following issues?",
    options: [
      { key: "A", text: "Imposition of strict censorship on vernacular Indian press." },
      { key: "B", text: "Removal of disqualifications imposed on Indian magistrates regarding the trial of European British subjects." },
      { key: "C", text: "Reduction in the minimum tariff duties levied on Lancashire cotton imports." },
      { key: "D", text: "Disbanding of provincial legislative councils." },
    ],
    correctOption: "B",
    explanation:
      "The Ilbert Bill (1883), drafted by Sir Courtenay Ilbert (Law Member of Viceroy Ripon's Council), sought to abolish racial discrimination in the judicial system by enabling Indian district magistrates and sessions judges to try European British subjects in criminal cases.",
    source: "Historical PYQs Archive (19th Century British India)",
    relatedConcept: "Lord Ripon, Ilbert Bill 1883, Judicial Racial Discrimination",
  },
  {
    id: "pyq-peri-tribal-1908",
    questionNumber: 103,
    subject: "Peripheral History & Tribal Rights",
    difficulty: "Hard",
    isCurrentAffairs: false,
    questionText:
      "The Chotanagpur Tenancy (CNT) Act of 1908 was enacted by the British administration primarily as a direct legislative response to which agrarian/tribal rebellion?",
    options: [
      { key: "A", text: "Santhal Hool (1855-56)" },
      { key: "B", text: "Birsa Munda's Ulgulan Movement (1899-1900)" },
      { key: "C", text: "Kol Mutiny (1831-32)" },
      { key: "D", text: "Rampa Rebellion (1922-24)" },
    ],
    correctOption: "B",
    explanation:
      "The Chotanagpur Tenancy Act of 1908 was enacted to prohibit the transfer of tribal land to non-tribal persons (dikus) and legally recognize Khuntkatti customary tenancy rights, following Birsa Munda's intense Ulgulan (Great Tumult) uprising.",
    source: "UPSC Peripheral History & Tribal Customary Tenure Archives",
    relatedConcept: "Birsa Munda, Chotanagpur Tenancy Act 1908, Khuntkatti Rights",
  },
  {
    id: "pyq-peri-deep-eco",
    questionNumber: 104,
    subject: "Environment & Ecology (Peripheral)",
    difficulty: "Medium",
    isCurrentAffairs: false,
    questionText:
      "The philosophical concept of 'Deep Ecology', which posits that the living environment as a whole has moral rights to live and flourish independent of its utilitarian value to human beings, was originally coined by whom?",
    options: [
      { key: "A", text: "Arne Næss (1973)" },
      { key: "B", text: "Rachel Carson (1962)" },
      { key: "C", text: "Garrett Hardin (1968)" },
      { key: "D", text: "Aldo Leopold (1949)" },
    ],
    correctOption: "A",
    explanation:
      "The term 'Deep Ecology' was coined by Norwegian philosopher Arne Næss in 1973. It rejects shallow environmentalism (which views nature purely as a resource for human survival) and argues that all living things have an intrinsic right to exist and thrive.",
    source: "UPSC Peripheral Area PYQ - Environmental Philosophy",
    relatedConcept: "Deep Ecology, Arne Næss, Intrinsic Ecological Worth",
  },
  {
    id: "pyq-curr-2026-bhashini",
    questionNumber: 105,
    subject: "Current Affairs & Science Tech (2025-2026)",
    difficulty: "Medium",
    isCurrentAffairs: true,
    questionText:
      "With reference to the 'Bhashini' initiative and 'BharatGen' launched under the National Language Translation Mission, consider the following statements:\n\n1. It develops sovereign multimodal foundational AI models trained in 22 scheduled Indian languages.\n2. It operates exclusively in closed proprietary cloud silos without open-source public APIs.\n\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "1 only" },
      { key: "B", text: "2 only" },
      { key: "C", text: "Both 1 and 2" },
      { key: "D", text: "Neither 1 nor 2" },
    ],
    correctOption: "A",
    explanation:
      "Statement 1 is correct: BharatGen / Bhashini is a pioneering sovereign foundational generative AI initiative for Indian languages. Statement 2 is incorrect because the initiative adheres to open digital public infrastructure (DPI) principles, offering open APIs and crowdsourced repositories (Bhasha Daan) for public and developer integration.",
    source: "Current Affairs 2025-2026 / MeitY Science & Technology",
    relatedConcept: "BharatGen, Bhashini, Sovereign Generative AI, Scheduled Languages",
  },
];

export const PrelimsPracticeView: React.FC<PrelimsPracticeViewProps> = ({
  questions: initialQuestions,
  onAskBoltQuestion,
  onRecordAnswer,
}) => {
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [filterPeripheralOnly, setFilterPeripheralOnly] = useState<boolean>(false);
  const [filterCurrentAffairsOnly, setFilterCurrentAffairsOnly] = useState<boolean>(false);

  // Combined questions list (base + historical archive)
  const allAvailableQuestions = [...initialQuestions, ...HISTORICAL_ADDITIONAL_PYQS];

  // Filter based on era and peripheral / current affairs toggles
  const filteredQuestions = allAvailableQuestions.filter((q) => {
    // Current affairs filter
    if (filterCurrentAffairsOnly && !q.isCurrentAffairs) return false;

    // Peripheral filter
    if (filterPeripheralOnly && !q.id.includes("peri") && !q.subject.toLowerCase().includes("peripheral") && !q.id.includes("1855")) {
      return false;
    }

    // Era filter
    if (selectedEra === "19th_century") {
      return q.id.includes("1855") || q.id.includes("1883") || q.source?.includes("19th");
    }
    if (selectedEra === "early_20th") {
      return q.id.includes("1908") || q.source?.includes("1908");
    }
    if (selectedEra === "modern") {
      return q.id.includes("2026") || q.isCurrentAffairs;
    }

    return true;
  });

  const effectiveQuestions = filteredQuestions.length > 0 ? filteredQuestions : allAvailableQuestions;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Reset index if filtered list shrinks
  const safeIndex = Math.min(currentIndex, effectiveQuestions.length - 1);
  const currentQ = effectiveQuestions[safeIndex] || effectiveQuestions[0];
  const selectedOption = selectedAnswers[currentQ?.id];
  const isRevealed = revealedQuestions[currentQ?.id] || Boolean(selectedOption);

  const handleSelectOption = (key: "A" | "B" | "C" | "D") => {
    if (!currentQ) return;
    const isFirstAttempt = !selectedAnswers[currentQ.id];
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
    setRevealedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
    if (isFirstAttempt && onRecordAnswer) {
      onRecordAnswer(currentQ.id, key === currentQ.correctOption);
    }
  };

  const handleSkipAndReveal = () => {
    if (!currentQ) return;
    setRevealedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlaggedQuestions((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const isCorrect = selectedOption === currentQ?.correctOption;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* 1855 - 2026 Historical Archive & Peripheral Areas Filter Bar */}
      <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white font-['Outfit']">
                1855 – 2026 PYQ Historical Engine & Peripheral Areas
              </h3>
              <p className="text-[11px] text-slate-400">
                Colonial ICS exams, classical UPSC, modern 2026 trends, and fringe peripheral concepts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterPeripheralOnly(!filterPeripheralOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                filterPeripheralOnly
                  ? "bg-amber-500 text-black shadow-md ring-2 ring-amber-400"
                  : "bg-[#162033] text-amber-300 border border-amber-500/30 hover:bg-amber-500/10"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Peripheral Areas Only</span>
            </button>

            <button
              onClick={() => setFilterCurrentAffairsOnly(!filterCurrentAffairsOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                filterCurrentAffairsOnly
                  ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400"
                  : "bg-[#162033] text-rose-300 border border-rose-500/30 hover:bg-rose-500/10"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Current Affairs (2025-2026)</span>
            </button>
          </div>
        </div>

        {/* Era Selector Pills */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1">
            Historical Era:
          </span>
          {[
            { id: "all", label: "All Eras (1855-2026)" },
            { id: "19th_century", label: "19th Century (1855-1899)" },
            { id: "early_20th", label: "Early 20th Cent (1900-1949)" },
            { id: "modern", label: "Modern & Current (2000-2026)" },
          ].map((era) => (
            <button
              key={era.id}
              onClick={() => {
                setSelectedEra(era.id);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedEra === era.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#162033] text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Question Navigator (Matching Screenshot 4) */}
      <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-400 font-medium">Question Navigator</span>
          <span className="text-blue-400 font-bold">
            {Object.keys(selectedAnswers).length} / {effectiveQuestions.length} Answered
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {effectiveQuestions.map((q, idx) => {
            const hasAnswered = Boolean(selectedAnswers[q.id]);
            const isQCorrect = selectedAnswers[q.id] === q.correctOption;
            const isCurrent = safeIndex === idx;
            const isFlagged = flaggedQuestions[q.id];

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 flex-shrink-0 rounded-xl font-bold text-xs flex items-center justify-center transition-all relative ${
                  isCurrent
                    ? "bg-blue-600 text-white ring-2 ring-blue-400 shadow-md shadow-blue-500/20"
                    : hasAnswered
                    ? isQCorrect
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-[#162033] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#111723]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card (Matching Screenshot 4) */}
      <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-5 sm:p-7 space-y-6 shadow-md">
        {/* Question Header & Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
              Q{safeIndex + 1} of {effectiveQuestions.length}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {currentQ.subject}
            </span>
            {currentQ.isCurrentAffairs && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                Current Affairs
              </span>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Difficulty: {currentQ.difficulty}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFlag}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                flaggedQuestions[currentQ.id]
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-[#162033] border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Flag for later review"
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">
                {flaggedQuestions[currentQ.id] ? "Flagged" : "Flag"}
              </span>
            </button>

            <button
              onClick={() => onAskBoltQuestion(currentQ)}
              className="p-2 sm:px-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="Ask Bolt about this question"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Ask Bolt</span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-4">
          <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
            {currentQ.questionText}
          </p>

          {/* Formatted Statements (if any, matching screenshot 4) */}
          {currentQ.statements && currentQ.statements.length > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-[#162033] border border-slate-800 text-sm text-slate-200">
              {currentQ.statements.map((stmt, sIdx) => (
                <div key={sIdx} className="flex items-start space-x-2.5">
                  <span className="font-bold text-blue-400 flex-shrink-0">
                    {sIdx + 1}.
                  </span>
                  <span>{stmt}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options List (A, B, C, D) */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isThisOptionCorrect = opt.key === currentQ.correctOption;

            let optionStyles = "bg-[#162033] border-slate-800 text-slate-200 hover:bg-slate-800/80";

            if (isRevealed) {
              if (isThisOptionCorrect) {
                optionStyles = "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold ring-1 ring-emerald-500/40";
              } else if (isSelected && !isThisOptionCorrect) {
                optionStyles = "bg-red-950/40 border-red-500/60 text-red-200 font-semibold ring-1 ring-red-500/40";
              } else {
                optionStyles = "bg-[#162033]/50 border-slate-800/60 text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              optionStyles = "bg-blue-600/30 border-blue-500 text-white font-semibold";
            }

            return (
              <button
                key={opt.key}
                onClick={() => !isRevealed && handleSelectOption(opt.key)}
                disabled={isRevealed}
                className={`w-full text-left p-4 rounded-xl border flex items-start space-x-3.5 transition-all text-sm ${optionStyles}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                    isRevealed
                      ? isThisOptionCorrect
                        ? "bg-emerald-500 text-white"
                        : isSelected
                        ? "bg-red-500 text-white"
                        : "bg-slate-800 text-slate-400"
                      : isSelected
                      ? "bg-blue-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {opt.key}
                </div>
                <span className="flex-grow pt-0.5 leading-relaxed">{opt.text}</span>
                {isRevealed && isThisOptionCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                {isRevealed && isSelected && !isThisOptionCorrect && (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls & Navigation (Matching Screenshot 4) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div>
            {!isRevealed ? (
              <button
                onClick={handleSkipAndReveal}
                className="px-4 py-2.5 rounded-xl bg-[#162033] hover:bg-[#1f2d48] text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Skip & Reveal Answer</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-xs">
                {isCorrect ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Correct Answer (+2.00 Marks)</span>
                  </span>
                ) : selectedOption ? (
                  <span className="text-red-400 font-bold flex items-center space-x-1">
                    <XCircle className="w-4 h-4" />
                    <span>Incorrect (-0.66 Negative Marks)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    Question Skipped (0 Marks)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-[#162033] hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(effectiveQuestions.length - 1, prev + 1))}
              disabled={safeIndex >= effectiveQuestions.length - 1}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Detailed Explanation Sheet (Revealed upon answer) */}
        {isRevealed && (
          <div className="mt-6 p-5 rounded-xl bg-[#0e141f] border border-blue-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Option-by-Option Explanation & Analysis</span>
              </h4>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                Correct: Option {currentQ.correctOption}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentQ.explanation}
            </p>

            {/* Option breakdown */}
            {currentQ.optionAnalysis && currentQ.optionAnalysis.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {currentQ.optionAnalysis.map((oa, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs flex items-start space-x-2.5 ${
                      oa.isCorrect
                        ? "bg-emerald-950/30 text-emerald-200 border border-emerald-900/30"
                        : "bg-slate-900/60 text-slate-300 border border-slate-800/60"
                    }`}
                  >
                    <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-800">
                      Option {oa.optionKey}
                    </span>
                    <span className="pt-0.5">{oa.analysis}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata & UPSC Relevance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-300">Related Concept:</span>{" "}
                {currentQ.relatedConcept}
              </div>
              <div>
                <span className="font-semibold text-slate-300">Source:</span>{" "}
                {currentQ.source}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
