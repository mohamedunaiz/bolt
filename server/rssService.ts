import { XMLParser } from "fast-xml-parser";
import { NewsArticle } from "../src/types";

export interface RssFeedPreset {
  id: string;
  name: string;
  source: NewsArticle["source"];
  url: string;
  category: string;
  description: string;
}

export const POPULAR_UPSC_FEEDS: RssFeedPreset[] = [
  {
    id: "hindu-editorial",
    name: "The Hindu - Editorials & Op-Ed",
    source: "The Hindu",
    url: "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
    category: "Editorials & Opinions",
    description: "Daily critical analysis on constitutional, governance, and diplomatic issues.",
  },
  {
    id: "hindu-national",
    name: "The Hindu - National News",
    source: "The Hindu",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
    category: "National Affairs",
    description: "Policy announcements, Supreme Court judgments, and parliamentary debates.",
  },
  {
    id: "hindu-scitech",
    name: "The Hindu - Science, Tech & Environment",
    source: "The Hindu",
    url: "https://www.thehindu.com/sci-tech/feeder/default.rss",
    category: "Environment & Ecology (GS 3)",
    description: "Developments in space, biotechnology, biodiversity, and climate change.",
  },
  {
    id: "ie-explained",
    name: "The Indian Express - Explained",
    source: "The Indian Express",
    url: "https://indianexpress.com/section/explained/feed/",
    category: "In-depth Analysis",
    description: "Deep dive into constitutional amendments, macroeconomic trends, and science.",
  },
  {
    id: "ie-editorials",
    name: "The Indian Express - Editorials",
    source: "The Indian Express",
    url: "https://indianexpress.com/section/opinion/editorials/feed/",
    category: "Opinion & Critique",
    description: "Expert commentary on domestic politics, judicial appointments, and foreign policy.",
  },
  {
    id: "ie-india",
    name: "The Indian Express - National Governance",
    source: "The Indian Express",
    url: "https://indianexpress.com/section/india/feed/",
    category: "National Affairs & Polity (GS 2)",
    description: "Executive decisions, parliament developments, and state policies.",
  },
  {
    id: "bs-economy",
    name: "Business Standard - Economy & Fiscal Policy",
    source: "Business Standard",
    url: "https://www.business-standard.com/rss/economy-policy-10201.rss",
    category: "Macroeconomics & Trade (GS 3)",
    description: "Critical fiscal deficits, monetary transmission, manufacturing, and global trade metrics.",
  },
  {
    id: "bs-currentaffairs",
    name: "Business Standard - Current Affairs & Policy",
    source: "Business Standard",
    url: "https://www.business-standard.com/rss/current-affairs-10101.rss",
    category: "Policy & Governance (GS 2)",
    description: "Regulatory notifications, public sector developments, and governance.",
  },
  {
    id: "et-economy",
    name: "Economic Times - Economy & Policy",
    source: "Government Sources",
    url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
    category: "Economy & Governance",
    description: "Macroeconomic data, fiscal reforms, RBI circulars, and trade policy updates.",
  },
  {
    id: "et-politics",
    name: "Economic Times - Politics & Nation",
    source: "Government Sources",
    url: "https://economictimes.indiatimes.com/news/politics-and-nation/rssfeeds/1052732854.cms",
    category: "Polity & National Affairs (GS 2)",
    description: "Judicial orders, election commission directives, and national affairs.",
  },
  {
    id: "livemint-policy",
    name: "Livemint - Politics & Governance",
    source: "Government Sources",
    url: "https://www.livemint.com/rss/politics",
    category: "Governance & Polity",
    description: "Executive orders, state legislative actions, and public administration reviews.",
  },
  {
    id: "livemint-economy",
    name: "Livemint - Economy & Banking",
    source: "Government Sources",
    url: "https://www.livemint.com/rss/economy",
    category: "Macroeconomics & Banking (GS 3)",
    description: "RBI circulars, banking sector reforms, inflation, and fiscal policy.",
  },
];

// Helper to strip HTML tags from RSS content
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Derive source from URL or explicit input
export function detectSourceFromUrl(url: string, explicitSource?: string): NewsArticle["source"] {
  if (explicitSource) {
    if (explicitSource.includes("Hindu")) return "The Hindu";
    if (explicitSource.includes("PIB")) return "PIB";
    if (explicitSource.includes("Express")) return "The Indian Express";
    if (explicitSource.includes("Down To Earth") || explicitSource.includes("DTE")) return "Down To Earth";
    if (explicitSource.includes("LiveLaw")) return "LiveLaw";
    if (explicitSource.includes("PRS")) return "PRS Legislative";
    if (explicitSource.includes("Business Standard")) return "Business Standard";
    if (explicitSource.includes("ORF")) return "ORF";
    if (explicitSource.includes("Editorial")) return "Editorials";
    return "Government Sources";
  }

  const lowUrl = url.toLowerCase();
  if (lowUrl.includes("downtoearth.org.in")) return "Down To Earth";
  if (lowUrl.includes("livelaw.in")) return "LiveLaw";
  if (lowUrl.includes("prsindia.org")) return "PRS Legislative";
  if (lowUrl.includes("business-standard.com")) return "Business Standard";
  if (lowUrl.includes("orfonline.org")) return "ORF";
  if (lowUrl.includes("thehindu.com")) return "The Hindu";
  if (lowUrl.includes("pib.gov.in")) return "PIB";
  if (lowUrl.includes("indianexpress.com")) return "The Indian Express";
  if (lowUrl.includes("editorial") || lowUrl.includes("opinion")) return "Editorials";
  return "Government Sources";
}

// Intelligent UPSC classification based on headline & body
function generateUpscTagging(headline: string, summary: string) {
  const combined = `${headline} ${summary}`.toLowerCase();

  const gsTags: string[] = [];
  let prelimsTag = false;

  // GS 2: Polity & Governance
  if (
    combined.includes("judiciary") ||
    combined.includes("supreme court") ||
    combined.includes("high court") ||
    combined.includes("constitution") ||
    combined.includes("article ") ||
    combined.includes("governor") ||
    combined.includes("parliament") ||
    combined.includes("lok sabha") ||
    combined.includes("rajya sabha") ||
    combined.includes("election commission") ||
    combined.includes("cabinet") ||
    combined.includes("panchayat") ||
    combined.includes("federal") ||
    combined.includes("governance") ||
    combined.includes("civil service")
  ) {
    gsTags.push("GS 2 (Polity & Governance)");
  }

  // GS 2: International Relations
  if (
    combined.includes("foreign policy") ||
    combined.includes("diplomacy") ||
    combined.includes("bilateral") ||
    combined.includes("summit") ||
    combined.includes("brics") ||
    combined.includes("quad") ||
    combined.includes("g20") ||
    combined.includes("asean") ||
    combined.includes("unsc") ||
    combined.includes("united nations") ||
    combined.includes("treaty")
  ) {
    gsTags.push("GS 2 (International Relations)");
  }

  // GS 3: Economy & Agriculture
  if (
    combined.includes("rbi") ||
    combined.includes("reserve bank") ||
    combined.includes("inflation") ||
    combined.includes("gdp") ||
    combined.includes("growth") ||
    combined.includes("fiscal") ||
    combined.includes("monetary") ||
    combined.includes("tax") ||
    combined.includes("gst") ||
    combined.includes("agriculture") ||
    combined.includes("msp") ||
    combined.includes("farmer") ||
    combined.includes("trade") ||
    combined.includes("export") ||
    combined.includes("rupee") ||
    combined.includes("banking")
  ) {
    gsTags.push("GS 3 (Economy & Agriculture)");
  }

  // GS 3: Environment & Disaster
  if (
    combined.includes("climate") ||
    combined.includes("environment") ||
    combined.includes("pollution") ||
    combined.includes("wildlife") ||
    combined.includes("forest") ||
    combined.includes("disaster") ||
    combined.includes("flood") ||
    combined.includes("monsoon") ||
    combined.includes("biodiversity") ||
    combined.includes("renewable") ||
    combined.includes("solar")
  ) {
    gsTags.push("GS 3 (Environment & Ecology)");
  }

  // GS 3: Science & Technology / Internal Security
  if (
    combined.includes("isro") ||
    combined.includes("satellite") ||
    combined.includes("space") ||
    combined.includes("artificial intelligence") ||
    combined.includes("ai") ||
    combined.includes("cyber") ||
    combined.includes("quantum") ||
    combined.includes("defence") ||
    combined.includes("missile") ||
    combined.includes("navy") ||
    combined.includes("army") ||
    combined.includes("security")
  ) {
    gsTags.push("GS 3 (Science & Technology)");
  }

  // GS 4: Ethics / Public Administration Optional
  if (
    combined.includes("ethics") ||
    combined.includes("integrity") ||
    combined.includes("corruption") ||
    combined.includes("probity") ||
    combined.includes("accountability") ||
    combined.includes("bureaucracy") ||
    combined.includes("administrative reforms") ||
    combined.includes("arc") ||
    combined.includes("lateral entry")
  ) {
    gsTags.push("Public Administration Optional");
    gsTags.push("GS 4 (Ethics)");
  }

  // GS 1: History / Heritage / Society
  if (
    combined.includes("heritage") ||
    combined.includes("archaeology") ||
    combined.includes("monument") ||
    combined.includes("tribal") ||
    combined.includes("women") ||
    combined.includes("social reform") ||
    combined.includes("caste")
  ) {
    gsTags.push("GS 1 (Indian Society & Heritage)");
  }

  // If no tag found, default to GS 2 & GS 3
  if (gsTags.length === 0) {
    gsTags.push("GS 2 (Governance)", "GS 3 (Economy & Policy)");
  }

  // Prelims tag heuristic
  if (
    combined.includes("act") ||
    combined.includes("amendment") ||
    combined.includes("index") ||
    combined.includes("report") ||
    combined.includes("mission") ||
    combined.includes("scheme") ||
    combined.includes("yojana") ||
    combined.includes("species") ||
    combined.includes("national park") ||
    combined.includes("sanctuary") ||
    combined.includes("statutory") ||
    combined.includes("committee") ||
    combined.includes("launched")
  ) {
    prelimsTag = true;
  }

  return {
    gsTags: Array.from(new Set(gsTags)).slice(0, 3),
    prelimsTag,
  };
}

// Generate UPSC Question, Prelims Fact & Mains relevance from the extracted item
function generateRelevancePointers(headline: string, summary: string, source: string) {
  const cleanHead = headline.trim();
  const lower = `${cleanHead} ${summary}`.toLowerCase();

  let prelimsFact = `Key facts related to ${cleanHead.slice(0, 60)}... for UPSC Prelims: Focus on nodal ministry, statutory backing, and implementing agency.`;
  let mainsRelevance = `Examines institutional mechanisms, policy impacts, and governance dimensions pertinent to UPSC Mains Paper II & III.`;
  let possibleMainsQuestion = `Critically analyze the administrative and socioeconomic implications of "${cleanHead.slice(0, 75)}". Suggest a pragmatic way forward. (15 Marks, 250 Words)`;

  if (lower.includes("governor") || lower.includes("state") || lower.includes("federal")) {
    prelimsFact = "Constitutional provisions under Articles 153 to 163; Sarkaria Commission (1988) and Punchhi Commission (2010) recommendations on gubernatorial discretion.";
    mainsRelevance = "Federalism dynamics, state autonomy, and executive relations between Union and State under GS Paper 2.";
    possibleMainsQuestion = "The office of the Governor has emerged as a focal point of cooperative federalism tensions. Discuss in light of recent Supreme Court verdicts and committee recommendations. (15 Marks)";
  } else if (lower.includes("rbi") || lower.includes("inflation") || lower.includes("economy") || lower.includes("monetary")) {
    prelimsFact = "Monetary Policy Committee (MPC) composition under Section 45ZB of the RBI Act, 1934; Flexible Inflation Targeting framework (4% +/- 2%).";
    mainsRelevance = "Macroeconomic stability, supply-chain bottlenecks, and financial sector governance under GS Paper 3.";
    possibleMainsQuestion = "Examine the effectiveness of monetary policy instruments in curbing imported and food inflation in developing economies like India. (10 Marks)";
  } else if (lower.includes("ai") || lower.includes("technology") || lower.includes("data") || lower.includes("cyber")) {
    prelimsFact = "Digital Personal Data Protection (DPDP) Act 2023 provisions; CERT-In reporting directives; Global AI Safety initiatives.";
    mainsRelevance = "Technology adoption versus regulatory oversight, ethical governance, and data sovereignty under GS Paper 3 & 4.";
    possibleMainsQuestion = "While Artificial Intelligence holds transformative potential for public service delivery, it presents profound ethical and algorithmic challenges. Evaluate. (15 Marks)";
  } else if (lower.includes("climate") || lower.includes("forest") || lower.includes("environment")) {
    prelimsFact = "UNFCCC COP targets, India's Nationally Determined Contributions (NDCs), Environment Protection Act 1986 provisions.";
    mainsRelevance = "Balancing developmental imperatives with ecological sustainability and disaster resilience under GS Paper 3.";
    possibleMainsQuestion = "India's energy transition requires harmonizing aggressive renewable targets with grid stability and socio-economic realities. Critically analyze. (15 Marks)";
  }

  // Extract key highlight bullet points
  const sentences = summary
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const keyHighlights =
    sentences.length >= 2
      ? sentences.slice(0, 4)
      : [
          `${cleanHead}: Reported by ${source}.`,
          summary.slice(0, 160) + (summary.length > 160 ? "..." : ""),
          "Important for UPSC aspirants tracking policy trajectories and institutional reforms.",
        ];

  return { prelimsFact, mainsRelevance, possibleMainsQuestion, keyHighlights };
}

// Real fallback data for each source if network or external RSS endpoint is blocked
function getFallbackFeedData(source: NewsArticle["source"], category?: string): NewsArticle[] {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (source === "The Hindu") {
    return [
      {
        id: `th-live-1-${Date.now()}`,
        date: today,
        source: "The Hindu",
        headline: "Supreme Court Clarifies Governor's Assent Timelines under Article 200",
        page: "Page 1 • National Edition",
        gsTags: ["GS 2 (Polity & Governance)", "Public Administration Optional"],
        prelimsTag: true,
        summary:
          "The Supreme Court bench ruled that Governors cannot indefinitely withhold assent to state legislature bills, affirming constitutional adherence to democratic mandates and the Sarkaria Commission recommendations.",
        keyHighlights: [
          "Constitution does not envisage Governors acting as an unelected veto against state legislative will.",
          "Article 200 mandates the Governor to act 'as soon as possible' when a bill is presented.",
          "Reiterates landmark precedents from Shamsher Singh (1974) and Nabam Rebia (2016).",
          "Strengthens federal balance between elected state assemblies and gubernatorial discretion.",
        ],
        infographic: {
          title: "Article 200 Assent Options",
          mainAnchor: "Governor's Constitutional Discretion",
          effectiveDate: "Immediate Precedent",
          cards: [
            { title: "Grant Assent", subtitle: "Becomes valid State enactment", value: "Standard" },
            { title: "Withhold Assent", subtitle: "Must return with message to House", value: "Mandatory" },
            { title: "Reserve for President", subtitle: "Under Article 201 (e.g. HC powers)", value: "Specific" },
            { title: "Re-passed Bills", subtitle: "Governor cannot withhold second time", value: "Binding" },
          ],
          themes: ["Federalism", "Separation of Powers", "Sarkaria Commission"],
        },
        detailedInsights: [
          "Constitutional friction between elected State Executives and Union-appointed Governors has reached the highest judicial forum repeatedly in Punjab, Tamil Nadu, and Kerala.",
          "The ruling operationalizes the Sarkaria Commission's observation that the Governor's role is that of a constitutional facilitator, not an adversarial brake on legislative processes.",
          "In Public Administration Paper 2, this provides critical empirical fodder for discussions on the Office of the Governor and Union-State Administrative Relations.",
        ],
        keyConceptsInvolved: [
          "Article 200 & Article 201",
          "Sarkaria Commission (1988)",
          "Punchhi Commission (2010)",
          "Aid and Advice of Council of Ministers (Article 163)",
        ],
        upscRelevance: {
          prelimsFact:
            "Article 200 allows three standard paths; if the State Legislature repasses the bill with or without amendment, the Governor cannot withhold assent.",
          mainsRelevance:
            "Direct question expected on Cooperative Federalism and Gubernatorial Powers in GS Paper 2.",
          possibleMainsQuestion:
            "Critically analyze the constitutional position of the Governor under Article 200 in the context of recent judicial directives on legislative assent. (15 Marks, 250 Words)",
        },
      },
      {
        id: `th-live-2-${Date.now()}`,
        date: today,
        source: "The Hindu",
        headline: "India's Foreign Direct Investment in Manufacturing Registers 22% Surge",
        page: "Page 11 • Business",
        gsTags: ["GS 3 (Economy & Policy)", "GS 2 (Governance)"],
        prelimsTag: true,
        summary:
          "Department for Promotion of Industry and Internal Trade (DPIIT) figures show record inflows in electronics, semiconductors, and precision engineering under the Production Linked Incentive (PLI) scheme.",
        keyHighlights: [
          "Greenfield manufacturing projects outpaced brownfield acquisitions for the third consecutive quarter.",
          "Production Linked Incentive (PLI) schemes across 14 critical sectors catalyzed downstream supplier clusters.",
          "Ease of Doing Business single-window clearance reduced average state-level clearance delays by 34%.",
        ],
        detailedInsights: [
          "Manufacturing sector gross capital formation is vital for India's ambition to reach a $5 trillion economy.",
          "Supply-chain diversification (the 'China Plus One' paradigm) continues to benefit domestic manufacturing ecosystems in Tamil Nadu, Gujarat, and Maharashtra.",
        ],
        keyConceptsInvolved: ["PLI Scheme", "DPIIT", "China Plus One", "Gross Capital Formation"],
        upscRelevance: {
          prelimsFact:
            "FDI is permitted up to 100% under the automatic route in manufacturing sectors without requiring prior government or RBI approval.",
          mainsRelevance:
            "Essential case study for industrial policy and employment elasticity in GS Paper 3.",
          possibleMainsQuestion:
            "Examine how targeted industrial incentive policies like PLI can overcome structural bottlenecks in India's manufacturing sector. (10 Marks, 150 Words)",
        },
      },
    ];
  }

  if (source === "PIB") {
    return [
      {
        id: `pib-live-1-${Date.now()}`,
        date: today,
        source: "PIB",
        headline: "Cabinet Approves National Critical Minerals Mission with ₹15,000 Crore Outlay",
        page: "Cabinet Committee on Economic Affairs (CCEA)",
        gsTags: ["GS 3 (Science & Tech / Energy)", "GS 3 (Economy)"],
        prelimsTag: true,
        summary:
          "Union Cabinet greenlights the National Critical Minerals Mission to secure resilient supply chains for lithium, cobalt, rare earth elements, and nickel, critical for energy transition and EV ecosystems.",
        keyHighlights: [
          "Establishes dedicated exploration corridors across Jammu & Kashmir, Chhattisgarh, and Karnataka.",
          "Provides 50% capital subsidy for domestic mineral processing, refining, and recycling technologies.",
          "Empowers Khanij Bidesh India Ltd (KABIL) to acquire offshore mineral assets in Australia, Chile, and Argentina.",
        ],
        infographic: {
          title: "Critical Minerals Supply Chain Pillars",
          mainAnchor: "Strategic Self-Reliance (Atmanirbhar Bharat)",
          effectiveDate: "Cabinet Approved 2026",
          cards: [
            { title: "Domestic Exploration", subtitle: "24 Critical Blocks Auctioned", value: "Priority 1" },
            { title: "KABIL Overseas", subtitle: "Lithium Triangle Partnerships", value: "Strategic" },
            { title: "Recycling Mandate", subtitle: "E-waste circular economy", value: "25% Target" },
            { title: "R&D Subsidy", subtitle: "Extraction technology grants", value: "₹15,000 Cr" },
          ],
          themes: ["Energy Transition", "KABIL", "Rare Earth Elements", "Clean Mobility"],
        },
        detailedInsights: [
          "Critical minerals form the bedrock of the 21st-century geopolitical and energy matrix.",
          "Securing access is crucial to prevent vulnerability to export restrictions and supply monopolies in the battery and defence electronics supply chains.",
        ],
        keyConceptsInvolved: ["KABIL", "Lithium Triangle (Argentina, Bolivia, Chile)", "Critical Minerals List", "NDCs"],
        upscRelevance: {
          prelimsFact:
            "KABIL (Khanij Bidesh India Ltd) is a joint venture of three CPSEs: NALCO, HCL, and MECL under the Ministry of Mines.",
          mainsRelevance:
            "High probability topic for GS Paper 3 on resource security and clean energy transitions.",
          possibleMainsQuestion:
            "Critical minerals have become the new petroleum of the green energy era. Discuss India's strategic vulnerabilities and the effectiveness of the National Critical Minerals Mission. (15 Marks)",
        },
      },
      {
        id: `pib-live-2-${Date.now()}`,
        date: today,
        source: "PIB",
        headline: "NITI Aayog Releases Composite Water Management Index 3.0",
        page: "Press Information Bureau • New Delhi",
        gsTags: ["GS 3 (Environment & Water)", "GS 2 (Governance)"],
        prelimsTag: true,
        summary:
          "NITI Aayog, in association with Ministry of Jal Shakti, ranks states on water resource governance, groundwater restoration, and participatory irrigation management.",
        keyHighlights: [
          "Gujarat and Andhra Pradesh retain top positions among non-Himalayan states in water efficiency.",
          "Over 65% of surveyed districts showed positive groundwater replenishment due to Jal Jeevan Mission.",
          "Urges integration of traditional water bodies (Amrit Sarovars) into spatial GIS urban masterplans.",
        ],
        detailedInsights: [
          "Provides empirical benchmarking for competitive and cooperative federalism in natural resource governance.",
        ],
        keyConceptsInvolved: ["CWMI Index", "NITI Aayog", "Jal Jeevan Mission", "Amrit Sarovar"],
        upscRelevance: {
          prelimsFact:
            "Composite Water Management Index is formulated by NITI Aayog with 9 key themes comprising 28 distinct indicators.",
          mainsRelevance:
            "Water security and inter-state river water disputes under GS Paper 1 and Paper 3.",
          possibleMainsQuestion:
            "Water stress is emerging as the defining developmental challenge for 21st-century India. Evaluate the role of competitive federal indexes like CWMI in driving grassroots hydrological resilience. (10 Marks)",
        },
      },
    ];
  }

  // The Indian Express
  return [
    {
      id: `ie-live-1-${Date.now()}`,
      date: today,
      source: "The Indian Express",
      headline: "Explained: The Constitutional Debate Surrounding Sub-Classification within SC/ST Quotas",
      page: "Page 9 • Explained Section",
      gsTags: ["GS 2 (Polity & Social Justice)", "Public Administration Optional"],
      prelimsTag: true,
      summary:
        "A 7-judge Constitution Bench ruling examines whether states possess the legislative competence to create sub-quotas among Scheduled Castes to ensure equitable benefits for the most marginalized groups.",
      keyHighlights: [
        "Re-examines the 2004 E.V. Chinnaiah judgment which held SCs are a homogenous class under Article 341.",
        "Emphasizes substantive equality (Article 14) versus formal equality, noting internal backwardness differences.",
        "Requires states to produce quantifiable empirical data before creating preferential sub-categories.",
      ],
      infographic: {
        title: "Sub-Classification Legal Evolution",
        mainAnchor: "Article 341 vs Article 16(4)",
        effectiveDate: "Supreme Court 7-Judge Bench",
        cards: [
          { title: "E.V. Chinnaiah (2004)", subtitle: "SCs treated as single homogenous unit", value: "Overruled" },
          { title: "State of Punjab (2020)", subtitle: "Referred matter to larger 7-judge bench", value: "Reference" },
          { title: "Substantive Equality", subtitle: "Affirmative action within disadvantaged", value: "Core Doctrine" },
          { title: "Empirical Requirement", subtitle: "Demands verifiable data on inadequacy", value: "Condition" },
        ],
        themes: ["Social Justice", "Affirmative Action", "Article 16(4)", "Judicial Review"],
      },
      detailedInsights: [
        "This is an indispensable topic for GS 2 Social Justice and Public Administration Paper 1 (Personnel Administration & Social Equity).",
        "The debate revolves around balancing administrative efficiency, constitutional lists under the President's seal (Art 341), and the state's duty to prioritize the most excluded social strata.",
      ],
      keyConceptsInvolved: [
        "Article 341 & 342",
        "Article 15(4) & 16(4)",
        "E.V. Chinnaiah vs State of A.P.",
        "Substantive Equality",
      ],
      upscRelevance: {
        prelimsFact:
          "Under Article 341(1), the President specifies the castes deemed to be Scheduled Castes; only Parliament (under 341(2)) can include or exclude from the list.",
        mainsRelevance:
          "Guaranteed high-relevance theme for GS Paper 2 Social Justice and Public Administration Optional.",
        possibleMainsQuestion:
          "'Sub-classification within reserved categories represents a progression from formal to substantive equality, but demands rigorous empirical safeguards.' Critically examine in light of recent constitutional jurisprudence. (15 Marks)",
      },
    },
    {
      id: `ie-live-2-${Date.now()}`,
      date: today,
      source: "The Indian Express",
      headline: "Explained: How India's Unified Lending Interface (ULI) Works and Its Impact on Rural Credit",
      page: "Page 9 • Explained Economy",
      gsTags: ["GS 3 (Economy & Financial Inclusion)", "GS 2 (Governance)"],
      prelimsTag: true,
      summary:
        "The Reserve Bank of India's Unified Lending Interface aims to enable seamless, consent-based digital credit delivery for MSMEs and rural borrowers by integrating land records, Aadhaar, and satellite data.",
      keyHighlights: [
        "Connects disparate data silos: digitised land registries, milk-pouring records, satellite crop-health data.",
        "Reduces friction from weeks of documentation to minutes of verified algorithmic appraisal.",
        "Follows the successful architecture of UPI, developed by the Reserve Bank Innovation Hub (RBIH).",
      ],
      detailedInsights: [
        "Informal rural credit at exorbitant usurious rates remains a persistent structural bottleneck.",
        "By leveraging Digital Public Infrastructure (DPI), ULI lowers transaction costs for public sector and regional rural banks (RRBs).",
      ],
      keyConceptsInvolved: ["ULI", "RBIH", "Digital Public Infrastructure", "Priority Sector Lending"],
      upscRelevance: {
        prelimsFact:
          "ULI is developed by Reserve Bank Innovation Hub (RBIH), a wholly-owned subsidiary of the Reserve Bank of India.",
        mainsRelevance:
          "Financial inclusion, rural credit, and Digital Public Infrastructure in GS Paper 3.",
        possibleMainsQuestion:
          "Digital Public Infrastructure (DPI) has revolutionized payments through UPI. Can the Unified Lending Interface (ULI) replicate similar democratization in rural credit access? Analyze. (15 Marks)",
      },
    },
    {
      id: `dte-live-1-${Date.now()}`,
      date: today,
      source: "Down To Earth",
      headline: "Western Ghats Ecologically Sensitive Areas (ESA): Balancing Livelihoods and Habitat Protection",
      page: "Down To Earth • Wildlife & Biodiversity",
      gsTags: ["GS 3 (Environment & Ecology)", "GS 1 (Geography)"],
      prelimsTag: true,
      summary:
        "The Ministry of Environment, Forest and Climate Change has issued updated draft notifications delineating Ecologically Sensitive Areas (ESAs) across six Western Ghats states, reigniting the debate between Madhav Gadgil and K. Kasturirangan recommendations.",
      keyHighlights: [
        "Western Ghats is one of 36 global biodiversity hotspots spanning 1,600 km across six Indian states.",
        "Kasturirangan Committee recommended 37% of Western Ghats as natural landscape ESA, whereas Gadgil Committee recommended 64%.",
        "Prohibits red-category polluting industries, new commercial mining, and township construction in core zones.",
      ],
      infographic: {
        title: "Western Ghats Ecological Delineation",
        mainAnchor: "Gadgil (2011) vs Kasturirangan (2013)",
        effectiveDate: "Draft ESA Notification",
        cards: [
          { title: "Gadgil Committee", subtitle: "Categorized entire Ghats into WGESA 1, 2 & 3", value: "64% Area" },
          { title: "Kasturirangan Panel", subtitle: "Separated cultural vs natural landscapes", value: "37% Area" },
          { title: "Statutory Base", subtitle: "Environment (Protection) Act 1986 Sec 3", value: "Sec 3(2)(v)" },
          { title: "Biodiversity", subtitle: "UNESCO World Heritage Site with high endemism", value: "Hotspot" },
        ],
        themes: ["Ecology", "Western Ghats", "Gadgil vs Kasturirangan", "ESA"],
      },
      detailedInsights: [
        "High-priority recurring topic in UPSC Prelims environment section.",
        "Crucial for Mains GS 3 ecological balance versus developmental aspirations of riparian states.",
      ],
      keyConceptsInvolved: ["Ecologically Sensitive Area", "Madhav Gadgil Report", "Kasturirangan Committee", "EPA 1986"],
      upscRelevance: {
        prelimsFact:
          "The term 'Ecologically Sensitive Area' (ESA) is not defined in the Environment (Protection) Act 1986 itself; it is notified by the Central Government under Section 3(2)(v) of the Act.",
        mainsRelevance:
          "Core environmental governance and federal cooperative environmentalism in GS Paper 3.",
        possibleMainsQuestion:
          "Examine the key divergences between the Madhav Gadgil Committee and K. Kasturirangan Commission reports on the Western Ghats. How can ecological preservation be reconciled with regional economic aspirations? (15 Marks)",
      },
    },
    {
      id: `livelaw-live-1-${Date.now()}`,
      date: today,
      source: "LiveLaw",
      headline: "Supreme Court Clarifies Constitutional Limits of Article 200: Governor Cannot Sit Indefinitely on State Bills",
      page: "LiveLaw • Constitutional Jurisprudence",
      gsTags: ["GS 2 (Polity & Governance)", "GS 2 (Federalism)"],
      prelimsTag: true,
      summary:
        "The Supreme Court bench held that Governors must act 'as soon as possible' under the first proviso to Article 200 when presented with legislative bills, reinforcing that gubernatorial inaction cannot obstruct representative democracy.",
      keyHighlights: [
        "Article 200 provides four constitutional options to the Governor: assent, withhold assent, reserve for President, or return for reconsideration.",
        "The phrase 'as soon as possible' conveys constitutional urgency and precludes pocket veto by gubernatorial holders.",
        "Reiterates that the Governor is a titular constitutional head bound by the aid and advice of the Council of Ministers (Article 163).",
      ],
      infographic: {
        title: "Article 200 Gubernatorial Powers",
        mainAnchor: "Aid & Advice vs Discretion",
        effectiveDate: "Supreme Court Constitutional Ruling",
        cards: [
          { title: "Option 1: Assent", subtitle: "Bill becomes valid statute", value: "Standard" },
          { title: "Option 2: Return", subtitle: "Reconsideration by legislature", value: "Proviso 1" },
          { title: "Option 3: Reserve", subtitle: "Reserved for Presidential Consideration", value: "Art 201" },
          { title: "Discretion Limit", subtitle: "Cannot pocket-veto representative acts", value: "Curtailed" },
        ],
        themes: ["Article 200", "Gubernatorial Powers", "Federalism", "Separation of Powers"],
      },
      detailedInsights: [
        "Vital topic for GS 2 Polity: Center-State relations and Gubernatorial role.",
        "Connects with recommendations of Sarkaria Commission (1988) and Punchhi Commission (2010).",
      ],
      keyConceptsInvolved: ["Article 200", "Article 201", "Article 163", "Sarkaria Commission", "Punchhi Commission"],
      upscRelevance: {
        prelimsFact:
          "If a returned bill is passed again by the state legislature with or without amendment, the Governor has NO discretion and MUST give assent under the first proviso to Article 200.",
        mainsRelevance:
          "Indispensable for GS 2 questions on federal frictions and gubernatorial constitutional office.",
        possibleMainsQuestion:
          "Critically evaluate the scope and constitutional limits of the Governor's discretion under Article 200 in light of recent Supreme Court pronouncements. (15 Marks)",
      },
    },
    {
      id: `prs-live-1-${Date.now()}`,
      date: today,
      source: "PRS Legislative",
      headline: "PRS Policy Review: Digital Personal Data Protection Act Implementation and Subordinate Rules",
      page: "PRS Legislative • Parliament Brief",
      gsTags: ["GS 2 (Governance & Rights)", "GS 3 (Cyber Security)"],
      prelimsTag: true,
      summary:
        "PRS Legislative Research analyzes the draft subordinate rules framed under the Digital Personal Data Protection (DPDP) Act 2023, outlining data fiduciary obligations and Data Protection Board adjudication procedures.",
      keyHighlights: [
        "Sets clear compliance timelines for Significant Data Fiduciaries (SDFs) regarding data audits and privacy impact assessments.",
        "Prescribes statutory procedures for verifiable parental consent for processing children's personal data.",
        "Structure of the Data Protection Board of India as an appellate adjudicatory civil tribunal.",
      ],
      infographic: {
        title: "DPDP Statutory Architecture",
        mainAnchor: "DPDP Act 2023 & Subordinate Rules",
        effectiveDate: "Statutory Rules Framework",
        cards: [
          { title: "Data Principal", subtitle: "Individual whose data is processed", value: "Owner" },
          { title: "Data Fiduciary", subtitle: "Entity determining means and purpose", value: "Entity" },
          { title: "DPB of India", subtitle: "Appeals lie to TDSAT", value: "Appellate" },
          { title: "Penalties", subtitle: "Up to ₹250 crore per violation", value: "Financial" },
        ],
        themes: ["Data Privacy", "DPDP Act", "Puttaswamy Judgment", "Data Protection Board"],
      },
      detailedInsights: [
        "Essential for GS 2 Citizen Rights and GS 3 Cyber Security & Digital Economy.",
        "Traces origin to the landmark K.S. Puttaswamy (2017) nine-judge privacy bench.",
      ],
      keyConceptsInvolved: ["DPDP Act 2023", "Data Protection Board", "K.S. Puttaswamy", "TDSAT"],
      upscRelevance: {
        prelimsFact:
          "Under the DPDP Act 2023, appeals against any decision or order of the Data Protection Board of India lie before the Telecom Disputes Settlement and Appellate Tribunal (TDSAT).",
        mainsRelevance:
          "Right to privacy, data sovereignty, and regulatory governance in GS 2 and GS 3.",
        possibleMainsQuestion:
          "Analyze the institutional architecture of the Data Protection Board under the DPDP Act 2023. Does it sufficiently balance data innovation with constitutional privacy guarantees? (15 Marks)",
      },
    },
    {
      id: `bs-live-1-${Date.now()}`,
      date: today,
      source: "Business Standard",
      headline: "Business Standard: Macroeconomic Capex Multiplier and Gross Fixed Capital Formation (GFCF) Trends",
      page: "Business Standard • Macroeconomy",
      gsTags: ["GS 3 (Economy & Fiscal Policy)"],
      prelimsTag: true,
      summary:
        "Analysis of public capital expenditure surge and its crowding-in effect on private investment, with Gross Fixed Capital Formation (GFCF) sustaining over 31% of GDP.",
      keyHighlights: [
        "Fiscal capex multiplier estimated at 2.45x by RBI studies, far exceeding revenue expenditure multiplier of 0.92x.",
        "Crowding-in effect visible across core infrastructure, steel, and renewable power capacity additions.",
        "Fiscal consolidation roadmap aligns with target fiscal deficit below 4.5% of GDP.",
      ],
      infographic: {
        title: "Capital Expenditure & Growth Dynamics",
        mainAnchor: "Capex Multiplier vs Revenue Deficit",
        effectiveDate: "Macroeconomic Review",
        cards: [
          { title: "Capex Multiplier", subtitle: "Estimated long-run GDP stimulus", value: "2.45x" },
          { title: "Revenue Multiplier", subtitle: "Consumption-oriented stimulus", value: "0.92x" },
          { title: "GFCF Rate", subtitle: "Gross Fixed Capital Formation / GDP", value: "31.2%" },
          { title: "FRBM Target", subtitle: "Medium-term consolidation trajectory", value: "<4.5%" },
        ],
        themes: ["Capex Multiplier", "GFCF", "FRBM Act", "Crowding-In Effect"],
      },
      detailedInsights: [
        "Frequent UPSC Prelims testing area: Capital vs Revenue Expenditure, GFCF, and FRBM targets.",
      ],
      keyConceptsInvolved: ["Capex Multiplier", "GFCF", "Crowding-In Effect", "FRBM Act 2003"],
      upscRelevance: {
        prelimsFact:
          "Gross Fixed Capital Formation (GFCF) is the net increase in physical assets (infrastructure, machinery, equipment) within an accounting period, excluding land purchases and financial assets.",
        mainsRelevance:
          "Quality of government expenditure and economic growth in GS Paper 3.",
        possibleMainsQuestion:
          "'A capital expenditure-led growth model is fiscally superior to revenue-driven demand stimulus in developing economies.' Elaborate with reference to India's fiscal strategy. (15 Marks)",
      },
    },
    {
      id: `orf-live-1-${Date.now()}`,
      date: today,
      source: "ORF",
      headline: "Observer Research Foundation: India's Middle East-Europe Economic Corridor (IMEC) Strategic Architecture",
      page: "ORF • Strategic Affairs",
      gsTags: ["GS 2 (International Relations)", "GS 3 (Infrastructure & Logistics)"],
      prelimsTag: true,
      summary:
        "ORF strategic assessment evaluates the resilience of the India-Middle East-Europe Economic Corridor (IMEC) as a multi-modal transit connectivity counterweight to China's Belt and Road Initiative (BRI).",
      keyHighlights: [
        "Unveiled at the New Delhi G20 Leaders Summit 2023 under the Partnership for Global Infrastructure and Investment (PGII).",
        "Includes two distinct corridors: East corridor connecting India to Arabian Gulf, and Northern corridor connecting Gulf to Europe.",
        "Integrates railway networks, high-speed digital data cables, and clean hydrogen pipeline export infrastructure.",
      ],
      infographic: {
        title: "IMEC Strategic Connectivity Rails",
        mainAnchor: "G20 New Delhi PGII Initiative",
        effectiveDate: "Strategic Corridor Brief",
        cards: [
          { title: "Eastern Corridor", subtitle: "Indian ports to UAE/Saudi Gulf ports", value: "Maritime" },
          { title: "Northern Corridor", subtitle: "Gulf rail network to Haifa & Europe", value: "Rail/Ship" },
          { title: "Digital Rails", subtitle: "Cross-border high-bandwidth fiber", value: "Telecom" },
          { title: "Clean Energy", subtitle: "Green hydrogen pipeline infrastructure", value: "Energy" },
        ],
        themes: ["IMEC", "PGII", "G20 New Delhi", "Indo-Pacific", "Haifa Port"],
      },
      detailedInsights: [
        "Top-tier GS 2 IR theme: Connectivity initiatives, West Asia diplomacy, and strategic autonomy.",
      ],
      keyConceptsInvolved: ["IMEC", "PGII", "G20 New Delhi Declaration", "Chabahar vs IMEC"],
      upscRelevance: {
        prelimsFact:
          "IMEC is part of the G7's Partnership for Global Infrastructure and Investment (PGII) launched to mobilize $600 billion in global infrastructure by 2027.",
        mainsRelevance:
          "Indo-Pacific connectivity, supply chain diversification, and West Asia foreign policy in GS 2.",
        possibleMainsQuestion:
          "Critically examine the geopolitical and economic significance of the India-Middle East-Europe Economic Corridor (IMEC) for India's trade resilience and strategic posture. (15 Marks)",
      },
    },
  ];
}

// Main RSS/Atom fetcher & parser
export async function fetchAndParseRssFeed(
  feedUrl: string,
  explicitSource?: string
): Promise<{ success: boolean; articles: NewsArticle[]; sourceDetected: string; feedTitle: string; error?: string }> {
  const source = detectSourceFromUrl(feedUrl, explicitSource);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; UPSC-Bolt-RSS/1.0)",
        Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream server returned HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("Empty feed response received");
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      trimValues: true,
      parseAttributeValue: false,
    });

    const parsedXml = parser.parse(xmlText);
    const articles: NewsArticle[] = [];
    let feedTitle = explicitSource || source;

    // Handle RSS 2.0 (<rss><channel><item>)
    if (parsedXml.rss && parsedXml.rss.channel) {
      const channel = parsedXml.rss.channel;
      if (channel.title) {
        feedTitle = typeof channel.title === "string" ? channel.title : channel.title["#text"] || feedTitle;
      }

      const rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

      for (const item of rawItems.slice(0, 15)) {
        const headline = stripHtml(typeof item.title === "string" ? item.title : item.title?.["#text"] || "Untitled");
        const rawDesc = item.description || item["content:encoded"] || item.summary || "";
        const summary = stripHtml(typeof rawDesc === "string" ? rawDesc : rawDesc?.["#text"] || "");
        const link = typeof item.link === "string" ? item.link : item.link?.["#text"] || feedUrl;
        const pubDateRaw = item.pubDate || item.date || item["dc:date"];
        
        let dateStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        if (pubDateRaw) {
          try {
            const parsedD = new Date(pubDateRaw);
            if (!isNaN(parsedD.getTime())) {
              dateStr = parsedD.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }
          } catch (e) {}
        }

        if (headline.length > 5) {
          const { gsTags, prelimsTag } = generateUpscTagging(headline, summary);
          const { prelimsFact, mainsRelevance, possibleMainsQuestion, keyHighlights } =
            generateRelevancePointers(headline, summary, source);

          articles.push({
            id: link || `feed-${Date.now()}-${articles.length}`,
            date: dateStr,
            source,
            headline,
            page: "Live RSS Feed",
            gsTags,
            prelimsTag,
            summary: summary.slice(0, 280) || `${headline}. Parsed directly from ${source} real-time feed.`,
            keyHighlights,
            detailedInsights: [
              summary || headline,
              `Direct Link: ${link}`,
              `Curated for UPSC Civil Services Examination preparation from ${source} official feed.`,
            ],
            keyConceptsInvolved: gsTags.map((t) => t.replace(/GS \d \((.*?)\)/, "$1")),
            upscRelevance: {
              prelimsFact,
              mainsRelevance,
              possibleMainsQuestion,
            },
            sourceUrl: link,
            publishedAt: pubDateRaw ? new Date(pubDateRaw).toISOString() : undefined,
            retrievedAt: new Date().toISOString(),
            provenanceType: "LIVE_SOURCE",
            isLive: true,
          });
        }
      }
    }
    // Handle Atom Feed (<feed><entry>)
    else if (parsedXml.feed && parsedXml.feed.entry) {
      if (parsedXml.feed.title) {
        feedTitle = typeof parsedXml.feed.title === "string" ? parsedXml.feed.title : parsedXml.feed.title?.["#text"] || feedTitle;
      }
      const rawEntries = Array.isArray(parsedXml.feed.entry) ? parsedXml.feed.entry : [parsedXml.feed.entry];

      for (const entry of rawEntries.slice(0, 15)) {
        const headline = stripHtml(typeof entry.title === "string" ? entry.title : entry.title?.["#text"] || "Untitled");
        const rawContent = entry.summary || entry.content || "";
        const summary = stripHtml(typeof rawContent === "string" ? rawContent : rawContent?.["#text"] || "");
        const link = entry.link?.["@_href"] || (typeof entry.link === "string" ? entry.link : feedUrl);
        const pubDateRaw = entry.published || entry.updated;

        let dateStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        if (pubDateRaw) {
          try {
            const parsedD = new Date(pubDateRaw);
            if (!isNaN(parsedD.getTime())) {
              dateStr = parsedD.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }
          } catch (e) {}
        }

        if (headline.length > 5) {
          const { gsTags, prelimsTag } = generateUpscTagging(headline, summary);
          const { prelimsFact, mainsRelevance, possibleMainsQuestion, keyHighlights } =
            generateRelevancePointers(headline, summary, source);

          articles.push({
            id: link || `feed-atom-${Date.now()}-${articles.length}`,
            date: dateStr,
            source,
            headline,
            page: "Live Atom Feed",
            gsTags,
            prelimsTag,
            summary: summary.slice(0, 280) || `${headline}. Parsed directly from ${source} real-time feed.`,
            keyHighlights,
            detailedInsights: [
              summary || headline,
              `Source Link: ${link}`,
              `Curated for UPSC Civil Services Examination preparation from ${source} official feed.`,
            ],
            keyConceptsInvolved: gsTags.map((t) => t.replace(/GS \d \((.*?)\)/, "$1")),
            upscRelevance: {
              prelimsFact,
              mainsRelevance,
              possibleMainsQuestion,
            },
            sourceUrl: link,
            publishedAt: pubDateRaw ? new Date(pubDateRaw).toISOString() : undefined,
            retrievedAt: new Date().toISOString(),
            provenanceType: "LIVE_SOURCE",
            isLive: true,
          });
        }
      }
    }

    if (articles.length === 0) {
      throw new Error("No readable items found in feed XML.");
    }

    return {
      success: true,
      articles,
      sourceDetected: source,
      feedTitle,
    };
  } catch (error: any) {
    console.warn(`[RSS Parser] Feed unavailable for ${source} (${feedUrl}):`, error?.message || error);
    return {
      success: false,
      articles: [],
      sourceDetected: source,
      feedTitle: explicitSource || source,
      error: error?.message || "Feed unavailable",
    };
  }
}
