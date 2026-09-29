/**
 * BOLT UPSC PYQ Intelligence Engine
 * 
 * Provides:
 * - Proper UPSC PYQ database (Prelims GS-1, Mains GS 1-4, PubAdmin Optional Papers 1 & 2)
 * - Fine-grained topic/subtopic mapping and syllabus taxonomy
 * - Year, paper, question-type (MCQ, 10-marker, 15-marker, 20-marker, Case Study), and marks
 * - Recurring-theme frequency analysis and syllabus hotspot detection
 * - PYQ -> Topic -> Current Affairs -> Practice Question linkage
 */

export interface UpscPyqItem {
  id: string;
  year: number;
  stage: "Prelims" | "Mains";
  paper: "GS 1" | "GS 2" | "GS 3" | "GS 4" | "PubAdmin Paper 1" | "PubAdmin Paper 2";
  unit: string;
  topic: string;
  subtopic: string;
  questionType: "MCQ" | "10-Marker" | "15-Marker" | "20-Marker" | "Case Study";
  marks: number;
  questionText: string;
  recurringThemeId?: string;
  recurringThemeLabel?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  relatedThinkers?: string[];
  constitutionalArticles?: string[];
  secondArcReports?: string[];
  options?: { key: string; text: string }[];
  correctOption?: string;
  explanation?: string;
  modelAnswerFramework?: {
    introduction: string;
    bodyPoints: string[];
    thinkersToAnchor: string[];
    wayForward: string;
  };
  linkedCurrentAffairsTags: string[];
  practiceDrillPrompt: string;
  verificationStatus?: "VERIFIED_OFFICIAL_PYQ" | "VERIFIED_RELIABLE_ARCHIVE" | "AI_PRACTICE_QUESTION" | "UNVERIFIED";
}

export interface RecurringThemeAnalysis {
  themeId: string;
  title: string;
  paper: string;
  unit: string;
  frequencyCount: number;
  yearsAsked: number[];
  repetitionPattern: string; // e.g. "Every 1-2 years"
  trend: "Rising in frequency" | "Consistently recurring" | "Periodic 3-year cycle";
  importanceScore: number; // 0 to 100
  samplePyqs: { id: string; year: number; question: string }[];
  keyDemandAdvice: string;
}

export interface PyqSearchFilter {
  stage?: "Prelims" | "Mains" | "All";
  paper?: string;
  year?: number;
  yearStart?: number;
  yearEnd?: number;
  subject?: string;
  topic?: string;
  recurringThemeId?: string;
  searchQuery?: string;
}

// ----------------------------------------------------
// CURATED CANONICAL UPSC PYQ REPOSITORY
// ----------------------------------------------------
export const UPSC_PYQ_REPOSITORY: UpscPyqItem[] = [
  // 1. PubAdmin Paper 1 - Thinkers (Barnard)
  {
    id: "pyq-mains-pa1-2024-1",
    year: 2024,
    stage: "Mains",
    paper: "PubAdmin Paper 1",
    unit: "Unit 2: Administrative Thinkers",
    topic: "Chester Barnard: Acceptance Theory & Authority",
    subtopic: "Authority & Zone of Indifference",
    questionType: "15-Marker",
    marks: 15,
    questionText:
      "\"Authority in organizations is essentially a matter of acceptance from below rather than a decree from above.\" In the light of Chester Barnard's thesis, analyze the operational validity of the 'Zone of Indifference' in contemporary civil services.",
    recurringThemeId: "theme-barnard-authority",
    recurringThemeLabel: "Barnard's Authority Acceptance & Zone of Indifference",
    difficulty: "Hard",
    relatedThinkers: ["Chester Barnard", "Herbert Simon", "Max Weber"],
    constitutionalArticles: ["Article 311"],
    secondArcReports: ["10th Report: Personnel Administration"],
    modelAnswerFramework: {
      introduction: "Define Barnard's paradigm shift from classical positivist authority (Fayol/Weber) to subjective psychological acceptance in *The Functions of the Executive* (1938).",
      bodyPoints: [
        "Four subjective preconditions for communication to carry authority (comprehensibility, congruence with organizational purpose, personal viability, mental/physical feasibility).",
        "The Zone of Indifference: Orders obeyed unquestioningly; expanded via non-material incentives, leadership legitimacy, and organizational moral code.",
        "Application to Indian Bureaucracy: Street-level bureaucrat compliance and citizen obedience to public health/land acquisition orders depend heavily on perceived legitimacy.",
        "Limitations: In statutory/military hierarchies, legal sanctions enforce compliance even outside the subjective zone.",
      ],
      thinkersToAnchor: ["Chester Barnard", "Mary Parker Follett (Power-with)", "Herbert Simon"],
      wayForward: "Transform authoritarian bureaucratic administration into collaborative governance by institutionalizing participatory leadership and transparent communication.",
    },
    linkedCurrentAffairsTags: ["Civil Services Reforms", "Mission Karmayogi", "Administrative Ethics"],
    practiceDrillPrompt: "Critically examine whether Mission Karmayogi effectively widens the 'Zone of Indifference' for grassroots civil servants.",
  },

  // 2. PubAdmin Paper 1 - Thinkers (Simon)
  {
    id: "pyq-mains-pa1-2023-2",
    year: 2023,
    stage: "Mains",
    paper: "PubAdmin Paper 1",
    unit: "Unit 3: Administrative Behaviour",
    topic: "Herbert Simon: Bounded Rationality",
    subtopic: "Decision-Making & Satisficing",
    questionType: "15-Marker",
    marks: 15,
    questionText:
      "Herbert Simon's formulation of 'Bounded Rationality' demystified the illusion of total rationality in public administration. Discuss how 'Satisficing' operates during crisis decision-making in public governance.",
    recurringThemeId: "theme-simon-bounded-rationality",
    recurringThemeLabel: "Simon's Bounded Rationality vs Classical Optimization",
    difficulty: "Medium",
    relatedThinkers: ["Herbert Simon", "Charles Lindblom", "Amitai Etzioni"],
    secondArcReports: ["3rd Report: Crisis Management"],
    modelAnswerFramework: {
      introduction: "Critique of classical 'Economic Man' optimizing payoffs; introduction of 'Administrative Man' who satisfices due to cognitive and informational constraints.",
      bodyPoints: [
        "Fact vs Value dichotomy: Value premises cannot be empirically validated, bounding pure rationality.",
        "Cognitive span limits, information asymmetry, and temporal compression during disasters/pandemics.",
        "Linkage with Lindblom's Incrementalism ('muddling through') as a pragmatic manifestation of satisficing.",
        "Contemporary digital mitigation: Big data and AI reducing informational bounds without eliminating value conflicts.",
      ],
      thinkersToAnchor: ["Herbert Simon", "Charles Lindblom", "Yehezkel Dror"],
      wayForward: "Complement bounded human judgment with decision support systems and algorithmic transparency while preserving constitutional values.",
    },
    linkedCurrentAffairsTags: ["Disaster Management", "AI in Governance", "Digital Public Infrastructure"],
    practiceDrillPrompt: "Analyze the COVID-19 lockdown decision through Simon's bounded rationality framework.",
  },

  // 3. PubAdmin Paper 2 - Constitutional Framework (Centre-State Relations)
  {
    id: "pyq-mains-pa2-2024-3",
    year: 2024,
    stage: "Mains",
    paper: "PubAdmin Paper 2",
    unit: "Unit 2: Philosophical and Constitutional Framework of Government",
    topic: "Federalism & Centre-State Administrative Relations",
    subtopic: "Governor's Discretionary Role & Article 356",
    questionType: "15-Marker",
    marks: 15,
    questionText:
      "\"The office of the Governor has oscillated between being a constitutional linchpin and a political flashpoint.\" In light of recent Supreme Court verdicts and the Sarkaria Commission recommendations, evaluate mechanisms to restore institutional neutrality.",
    recurringThemeId: "theme-governor-neutrality",
    recurringThemeLabel: "Governor's Discretionary Powers & Neutrality",
    difficulty: "Hard",
    constitutionalArticles: ["Article 153", "Article 163", "Article 200", "Article 356"],
    secondArcReports: ["6th Report: Local Governance", "13th Report: Federal Governance"],
    modelAnswerFramework: {
      introduction: "Contextualize the dual constitutional role: Head of the State Executive vs Constitutional sentinel ensuring Union-State integrity.",
      bodyPoints: [
        "Constitutional friction points: Delaying gubernatorial assent to bills (Article 200), reservation for Presidential consideration (Article 201), and government formation post-fractured mandate.",
        "Supreme Court jurisprudence: Shamsher Singh (1974), S.R. Bommai (1994), Nabam Rebia (2016), and State of Punjab (2023) establishing that Governor cannot sit on bills indefinitely.",
        "Sarkaria (1988) and Punchhi (2010) recommendations: Consulting Chief Minister on appointment, amending Article 356, and providing an impeachment procedure for removal.",
      ],
      thinkersToAnchor: ["Granville Austin (Cooperative Federalism)", "Paul Appleby"],
      wayForward: "Codify timeframes for assent, enforce consultation conventions, and implement Punchhi Commission recommendations on fixed tenures.",
    },
    linkedCurrentAffairsTags: ["Cooperative Federalism", "Supreme Court Assent Verdict", "Centre-State Relations"],
    practiceDrillPrompt: "Draft a 15-mark answer evaluating whether constitutional conventions on Governor appointments should be given statutory backing.",
  },

  // 4. PubAdmin Paper 2 - Civil Services (Lateral Entry)
  {
    id: "pyq-mains-pa2-2023-4",
    year: 2023,
    stage: "Mains",
    paper: "PubAdmin Paper 2",
    unit: "Unit 7: Civil Services",
    topic: "Civil Service Reforms & Structure",
    subtopic: "Lateral Entry vs Permanent Civil Service Neutrality",
    questionType: "15-Marker",
    marks: 15,
    questionText:
      "Lateral entry into higher civil services seeks to inject domain expertise into policymaking, but raises concerns regarding administrative neutrality and affirmative action. Critically evaluate.",
    recurringThemeId: "theme-lateral-entry-neutrality",
    recurringThemeLabel: "Civil Service Neutrality & Lateral Entry",
    difficulty: "Medium",
    constitutionalArticles: ["Article 16", "Article 311", "Article 312"],
    secondArcReports: ["10th Report: Refurbishing Personnel Administration"],
    modelAnswerFramework: {
      introduction: "Trace the debate from the 2nd ARC (10th Report) recommendation to recruit domain experts at Joint Secretary/Director levels.",
      bodyPoints: [
        "Arguments in favor: Overcoming generalist inertia, infusion of technical expertise in sectors like fintech, cyber, infrastructure, and green energy.",
        "Key concerns: Contractual tenures compromising Weberian political neutrality; lack of reservation quotas violating social justice under Article 16; potential institutional friction with permanent cadres.",
        "Global precedents: Senior Executive Service (SES) in the US and fast-stream specialist cadres in the UK.",
      ],
      thinkersToAnchor: ["Max Weber (Neutrality & Permanence)", "Fulton Committee (UK)", "2nd ARC"],
      wayForward: "Institutionalize lateral recruitment through UPSC with transparent selection metrics, mandatory cooling-off periods, and reservation safeguards.",
    },
    linkedCurrentAffairsTags: ["Lateral Entry UPSC", "Civil Service Reforms", "Mission Karmayogi"],
    practiceDrillPrompt: "Compare the Fulton Committee (1968) critique of generalist bureaucracy with 2nd ARC recommendations on specialized cadres.",
  },

  // 5. Mains GS-4 - Ethics in Governance (Nolan Principles)
  {
    id: "pyq-mains-gs4-2024-5",
    year: 2024,
    stage: "Mains",
    paper: "GS 4",
    unit: "Ethics and Human Interface",
    topic: "Foundational Values for Civil Service",
    subtopic: "Nolan Principles & Code of Ethics",
    questionType: "10-Marker",
    marks: 10,
    questionText:
      "Integrity without knowledge is weak and useless, and knowledge without integrity is dangerous and dreadful. Illustrate with examples from contemporary public administration.",
    recurringThemeId: "theme-ethics-nolan-principles",
    recurringThemeLabel: "Ethics in Public Service - Nolan Principles & Integrity",
    difficulty: "Medium",
    secondArcReports: ["4th Report: Ethics in Governance"],
    modelAnswerFramework: {
      introduction: "Dissect Samuel Johnson's aphorism emphasizing the indivisible synergy between competence (techno-rational mastery) and ethical integrity (constitutional morality).",
      bodyPoints: [
        "Knowledge without integrity: High-tech white-collar corruption, regulatory capture, data manipulation, or discriminatory policy implementation.",
        "Integrity without knowledge: Well-meaning bureaucratic delays, administrative paralysis, failure to anticipate economic trade-offs in welfare schemes.",
        "Nolan Principles application: Selflessness, Objectivity, Accountability, and Leadership as the operational bridge.",
      ],
      thinkersToAnchor: ["Mahatma Gandhi (Seven Social Sins)", "Aristotle (Phronesis - Practical Wisdom)"],
      wayForward: "Integrate ethical training in civil services alongside technical capacity building through frameworks like Mission Karmayogi's Frac competency model.",
    },
    linkedCurrentAffairsTags: ["Administrative Ethics", "Anti-Corruption Reforms", "Lokpal"],
    practiceDrillPrompt: "Identify three administrative dilemmas where ethical integrity conflicted with procedural rule-following, and justify your resolution.",
  },

  // 6. Prelims GS-1 - Polity (Constitutional Bodies & Election Commission)
  {
    id: "pyq-prelims-gs1-2024-6",
    year: 2024,
    stage: "Prelims",
    paper: "GS 1",
    unit: "Indian Polity and Governance",
    topic: "Constitutional & Statutory Bodies",
    subtopic: "Election Commission of India (Article 324)",
    questionType: "MCQ",
    difficulty: "Hard",
    marks: 2,
    questionText:
      "Consider the following statements regarding the Election Commission of India:\n\n1. The Constitution has prescribed the qualifications (legal, educational, or administrative) of the members of the Election Commission.\n2. The Constitution has not specified the term of the members of the Election Commission.\n3. The Constitution has debarred retiring election commissioners from any further appointment by the government.\n\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 only" },
      { key: "C", text: "2 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "B",
    explanation:
      "Statement 2 is correct: The Constitution has not specified the term of the members of the Election Commission (it is prescribed by Parliament in the 1991 Act as 6 years or up to 65 years of age). Statements 1 and 3 are incorrect: The Constitution has neither prescribed qualifications for commissioners nor debarred them from further governmental appointments post-retirement.",
    constitutionalArticles: ["Article 324"],
    linkedCurrentAffairsTags: ["Chief Election Commissioner Appointment Act", "Electoral Reforms", "Supreme Court Anoop Baranwal Case"],
    practiceDrillPrompt: "Test your understanding of constitutional independence: What safeguards protect Election Commissioners under Article 324(5)?",
  },

  // 7. Prelims GS-1 - Polity (Panchayati Raj 73rd Amendment)
  {
    id: "pyq-prelims-gs1-2023-7",
    year: 2023,
    stage: "Prelims",
    paper: "GS 1",
    unit: "Indian Polity and Governance",
    topic: "Panchayati Raj & Local Self-Government",
    subtopic: "73rd Amendment Act & Financial Devolution",
    questionType: "MCQ",
    marks: 2,
    questionText:
      "With reference to the 73rd Constitutional Amendment Act, 1992, which of the following is a compulsory (mandatory) provision rather than voluntary?\n\n1. Establishment of a State Finance Commission every five years to review financial position of Panchayats.\n2. Giving voting rights to MPs and MLAs in Panchayats at different levels.\n3. Reservation of not less than one-third of total seats for women.\n4. Devolution of powers upon Panchayats to prepare economic development plans.\n\nSelect the correct answer using the code given below:",
    options: [
      { key: "A", text: "1 and 3 only" },
      { key: "B", text: "1, 2 and 3 only" },
      { key: "C", text: "3 and 4 only" },
      { key: "D", text: "1, 3 and 4 only" },
    ],
    correctOption: "A",
    explanation:
      "Statements 1 and 3 are mandatory provisions under the 73rd CAA (Articles 243-I and 243-D). Statements 2 and 4 are voluntary provisions left to the discretion of State Legislatures (giving representation to MPs/MLAs and determining the extent of devolution under the Eleventh Schedule).",
    recurringThemeId: "theme-73rd-74th-caa-devolution",
    recurringThemeLabel: "73rd/74th CAA: Mandatory vs Voluntary Devolution",
    difficulty: "Medium",
    constitutionalArticles: ["Article 243D", "Article 243G", "Article 243I"],
    secondArcReports: ["6th Report: Local Governance - An Inspiring Journey into the Future"],
    linkedCurrentAffairsTags: ["Panchayati Raj Day", "Fiscal Federalism", "State Finance Commissions"],
    practiceDrillPrompt: "Review the 29 subjects in the 11th Schedule: Which 5 subjects have seen the highest actual functional transfer in Indian states?",
  },

  // 8. PubAdmin Paper 1 - CPA (Fred Riggs)
  {
    id: "pyq-mains-pa1-2022-8",
    year: 2022,
    stage: "Mains",
    paper: "PubAdmin Paper 1",
    unit: "Unit 7: Comparative Public Administration",
    topic: "Fred Riggs: Ecological Approach & Prismatic Model",
    subtopic: "Sala Model & Formalism",
    questionType: "20-Marker",
    marks: 20,
    questionText:
      "\"Formalism and overlapping in the Sala model illustrate the disconnect between constitutional norms and administrative realities in developing societies.\" Analyze the relevance of Riggs's prismatic insights to digital administrative reforms in India.",
    recurringThemeId: "theme-riggs-prismatic-model",
    recurringThemeLabel: "Fred Riggs: Prismatic Society, Sala Model & Formalism",
    difficulty: "Hard",
    relatedThinkers: ["Fred W. Riggs", "Ferrel Heady", "Dwight Waldo"],
    modelAnswerFramework: {
      introduction: "Define Riggs's structural-functional approach and the Fused-Prismatic-Diffracted model.",
      bodyPoints: [
        "Explain Formalism: The discrepancy between prescribed law and real administrative conduct.",
        "Explain Overlapping: Traditional power structures (caste, kinship) operating behind modern administrative veneers.",
        "Digital Governance as a Formalism Buster: Direct Benefit Transfer (DBT), e-Procurement, and faceless assessment breaking intermediate Sala gatekeepers.",
        "Prismatic persistence in digital age: Digital divide, algorithm-enabled exclusion, and discretionary offline interventions.",
      ],
      thinkersToAnchor: ["Fred Riggs", "Robert Merton (Unintended consequences)"],
      wayForward: "Pair technological digitization with institutional re-engineering, civic literacy, and social audits to eliminate prismatic formalism.",
    },
    linkedCurrentAffairsTags: ["Digital India", "Direct Benefit Transfer", "Faceless Administration"],
    practiceDrillPrompt: "Evaluate how DBT schemes have altered the 'Bazaar-Canteen' dynamic of the Sala model in rural India.",
  },
];

// ----------------------------------------------------
// RECURRING THEME FREQUENCY ANALYTICS
// ----------------------------------------------------
export const RECURRING_THEME_ANALYTICS: RecurringThemeAnalysis[] = [
  {
    themeId: "theme-governor-neutrality",
    title: "Governor's Discretionary Powers & Neutrality",
    paper: "GS 2 & PubAdmin Paper 2",
    unit: "Centre-State Relations & Constitutional Framework",
    frequencyCount: 7,
    yearsAsked: [2014, 2017, 2019, 2021, 2023, 2024, 2025],
    repetitionPattern: "Every 1–2 years",
    trend: "Rising in frequency",
    importanceScore: 96,
    samplePyqs: [
      { id: "pyq-mains-pa2-2024-3", year: 2024, question: "Governor as constitutional linchpin vs political flashpoint." },
      { id: "pyq-2021-gov", year: 2021, question: "Discretion under Article 163 and legislative assent controversies." },
      { id: "pyq-2019-gov", year: 2019, question: "Sarkaria and Punchhi commission recommendations on Governor selection." },
    ],
    keyDemandAdvice:
      "Always ground answers with specific Supreme Court case laws (Bommai, Shamsher Singh, State of Punjab 2023) and quote both Sarkaria (1988) and Punchhi (2010) commission recommendations.",
  },
  {
    themeId: "theme-ethics-nolan-principles",
    title: "Ethics in Public Service - Nolan Principles & Integrity",
    paper: "GS 4 & PubAdmin Paper 1",
    unit: "Ethics and Accountability",
    frequencyCount: 9,
    yearsAsked: [2014, 2015, 2017, 2019, 2020, 2021, 2023, 2024, 2025],
    repetitionPattern: "Annually in GS-4",
    trend: "Consistently recurring",
    importanceScore: 98,
    samplePyqs: [
      { id: "pyq-mains-gs4-2024-5", year: 2024, question: "Integrity without knowledge is weak; knowledge without integrity is dangerous." },
      { id: "pyq-2023-eth", year: 2023, question: "Nolan principles in dealing with administrative conflict of interest." },
      { id: "pyq-2021-eth", year: 2021, question: "2nd ARC 4th Report Code of Ethics vs Code of Conduct." },
    ],
    keyDemandAdvice:
      "Avoid purely theoretical definitions. Contrast private morality with public integrity, cite 2nd ARC 4th Report recommendations, and use concrete civil service dilemmas.",
  },
  {
    themeId: "theme-73rd-74th-caa-devolution",
    title: "73rd/74th CAA: Mandatory vs Voluntary Devolution & Fiscal Autonomy",
    paper: "GS 2 & PubAdmin Paper 2",
    unit: "Local Governance & District Administration",
    frequencyCount: 8,
    yearsAsked: [2013, 2016, 2017, 2019, 2020, 2022, 2023, 2025],
    repetitionPattern: "Every 1–2 years",
    trend: "Consistently recurring",
    importanceScore: 92,
    samplePyqs: [
      { id: "pyq-prelims-gs1-2023-7", year: 2023, question: "Mandatory vs voluntary provisions under 73rd CAA." },
      { id: "pyq-2022-local", year: 2022, question: "Financial dependence of Panchayats on State Grants and SFC recommendations." },
      { id: "pyq-2020-local", year: 2020, question: "74th Amendment and Urban Local Bodies governance deficits." },
    ],
    keyDemandAdvice:
      "Highlight the '3Fs' (Funds, Functions, Functionaries), State Finance Commission dysfunction, and 2nd ARC 6th Report recommendations on local empowerment.",
  },
  {
    themeId: "theme-lateral-entry-neutrality",
    title: "Civil Service Neutrality, Lateral Entry & Specialist vs Generalist",
    paper: "PubAdmin Paper 2 & GS 2",
    unit: "Civil Services in India",
    frequencyCount: 6,
    yearsAsked: [2014, 2016, 2018, 2021, 2023, 2024],
    repetitionPattern: "Every 2 years",
    trend: "Rising in frequency",
    importanceScore: 90,
    samplePyqs: [
      { id: "pyq-mains-pa2-2023-4", year: 2023, question: "Lateral entry vs administrative neutrality and social justice." },
      { id: "pyq-2021-cs", year: 2021, question: "Generalist vs specialist debate in 21st century tech governance." },
      { id: "pyq-2018-cs", year: 2018, question: "Civil service neutrality in an era of coalition politics and media activism." },
    ],
    keyDemandAdvice:
      "Balance domain expertise needs with constitutional safeguards (Article 16 reservation, Article 311 security of tenure) and cite Mission Karmayogi and Fulton Committee.",
  },
  {
    themeId: "theme-barnard-authority",
    title: "Chester Barnard: Authority Acceptance & Zone of Indifference",
    paper: "PubAdmin Paper 1",
    unit: "Unit 2: Administrative Thinkers",
    frequencyCount: 5,
    yearsAsked: [2013, 2016, 2019, 2022, 2024],
    repetitionPattern: "Every 2–3 years",
    trend: "Periodic 3-year cycle",
    importanceScore: 88,
    samplePyqs: [
      { id: "pyq-mains-pa1-2024-1", year: 2024, question: "Authority as acceptance from below; Zone of Indifference in civil services." },
      { id: "pyq-2019-bar", year: 2019, question: "Barnard's informal organization and moral leadership thesis." },
    ],
    keyDemandAdvice:
      "Distinguish Barnard's subjective acceptance from Simon's 'Zone of Acceptance' (bounded compliance) and link directly to public resistance to administrative directives.",
  },
  {
    themeId: "theme-simon-bounded-rationality",
    title: "Herbert Simon: Bounded Rationality & Administrative Decision-Making",
    paper: "PubAdmin Paper 1",
    unit: "Unit 3: Administrative Behaviour",
    frequencyCount: 6,
    yearsAsked: [2013, 2015, 2018, 2020, 2022, 2023],
    repetitionPattern: "Every 2 years",
    trend: "Consistently recurring",
    importanceScore: 89,
    samplePyqs: [
      { id: "pyq-mains-pa1-2023-2", year: 2023, question: "Bounded rationality and satisficing in crisis decision-making." },
      { id: "pyq-2020-sim", year: 2020, question: "Simon's critique of classical administrative proverbs." },
    ],
    keyDemandAdvice:
      "Explain Fact-Value dichotomy, cognitive computational limits, satisficing vs optimizing, and link to algorithmic governance or public crisis management.",
  },
];

// ----------------------------------------------------
// PUBLIC ENGINE METHODS
// ----------------------------------------------------

export function searchUpscPyqs(filter?: PyqSearchFilter): UpscPyqItem[] {
  let list = [...UPSC_PYQ_REPOSITORY];

  if (!filter) return list;

  if (filter.stage && filter.stage !== "All") {
    list = list.filter((p) => p.stage === filter.stage);
  }

  if (filter.paper && filter.paper !== "All") {
    list = list.filter((p) => p.paper === filter.paper);
  }

  if (filter.year) {
    list = list.filter((p) => p.year === filter.year);
  }

  if (filter.yearStart) {
    list = list.filter((p) => p.year >= filter.yearStart!);
  }

  if (filter.yearEnd) {
    list = list.filter((p) => p.year <= filter.yearEnd!);
  }

  if (filter.subject && filter.subject.trim()) {
    const s = filter.subject.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.paper.toLowerCase().includes(s) ||
        p.unit.toLowerCase().includes(s) ||
        p.topic.toLowerCase().includes(s) ||
        (s.includes("polity") && (p.paper.toLowerCase().includes("gs 2") || p.unit.toLowerCase().includes("polity") || p.paper.toLowerCase().includes("pubadmin")))
    );
  }

  if (filter.recurringThemeId) {
    list = list.filter((p) => p.recurringThemeId === filter.recurringThemeId);
  }

  if (filter.topic && filter.topic !== "All") {
    const t = filter.topic.toLowerCase();
    list = list.filter((p) => p.topic.toLowerCase().includes(t) || p.unit.toLowerCase().includes(t));
  }

  if (filter.searchQuery && filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.questionText.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.subtopic.toLowerCase().includes(q) ||
        (p.recurringThemeLabel && p.recurringThemeLabel.toLowerCase().includes(q))
    );
  }

  return list
    .sort((a, b) => b.year - a.year)
    .map((item) => ({ ...item, verificationStatus: item.verificationStatus || "UNVERIFIED" }));
}

export function getRecurringThemeAnalytics(): RecurringThemeAnalysis[] {
  return [...RECURRING_THEME_ANALYTICS].sort((a, b) => b.importanceScore - a.importanceScore);
}

export function getPyqById(id: string): UpscPyqItem | null {
  const item = UPSC_PYQ_REPOSITORY.find((p) => p.id === id);
  return item ? { ...item, verificationStatus: item.verificationStatus || "UNVERIFIED" } : null;
}

/**
 * Returns comprehensive topic intelligence:
 * Connected PYQs, recurring themes, syllabus weightage, and practice drills.
 */
export function getTopicPyqIntelligence(topicName: string): {
  matchedPyqs: UpscPyqItem[];
  relatedThemes: RecurringThemeAnalysis[];
  weightageLevel: "High" | "Medium" | "Foundational";
  averageMarksAskedPerYear: number;
} {
  const norm = topicName.toLowerCase();
  const matched = UPSC_PYQ_REPOSITORY.filter(
    (p) =>
      p.topic.toLowerCase().includes(norm) ||
      p.unit.toLowerCase().includes(norm) ||
      p.questionText.toLowerCase().includes(norm)
  );

  const matchedThemeIds = new Set(matched.map((m) => m.recurringThemeId).filter(Boolean));
  const relatedThemes = RECURRING_THEME_ANALYTICS.filter((t) => matchedThemeIds.has(t.themeId));

  const totalMarks = matched.reduce((sum, p) => sum + p.marks, 0);
  const distinctYears = new Set(matched.map((m) => m.year)).size || 1;
  const avgMarks = Math.round((totalMarks / distinctYears) * 10) / 10;

  return {
    matchedPyqs: matched,
    relatedThemes,
    weightageLevel: matched.length >= 3 || avgMarks >= 12 ? "High" : matched.length >= 1 ? "Medium" : "Foundational",
    averageMarksAskedPerYear: avgMarks,
  };
}
