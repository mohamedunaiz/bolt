import { NcertChapter } from "../types";
import ncertRawData from "../../python/ncert_data.json";

export interface NcertBookItem {
  subject: string;
  title: string;
}

export interface NcertClassMetadata {
  classNum: number;
  stage: string;
  recommendedDuration: string;
  title: string;
  focusAreas: string;
  highYieldTip: string;
  upscSignificance: string;
  books: NcertBookItem[];
}

export const NCERT_CLASS_METADATA: NcertClassMetadata[] = [
  {
    classNum: 6,
    stage: "Primary Foundations",
    recommendedDuration: "2 Weeks",
    title: "Class 6: Our Pasts I, The Earth Our Habitat & Social Life",
    focusAreas: "Basic geography coordinate systems, early Vedic and Harappan archaeology, local self-government institutions.",
    highYieldTip: "Focus on definitions of lithosphere, latitude/longitude, and basic Vedic terminology.",
    upscSignificance: "Builds elementary bedrock for understanding ancient archaeology and Panchayati Raj structures.",
    books: [
      { subject: "History", title: "Our Pasts - I" },
      { subject: "Geography", title: "The Earth: Our Habitat" },
      { subject: "Polity", title: "Social and Political Life - I" },
      { subject: "Science", title: "Science (Class 6)" },
    ],
  },
  {
    classNum: 7,
    stage: "Foundational Continuum",
    recommendedDuration: "2 Weeks",
    title: "Class 7: Medieval India, Our Environment & State Government",
    focusAreas: "Chola administration, Delhi Sultanate, environmental biomes, state legislative assemblies.",
    highYieldTip: "Note administrative terms used under Akbar (Mansabdari) and Chola village assemblies (Sabha/Ur).",
    upscSignificance: "Covers medieval agrarian institutions, Delhi Sultanate revenue systems, and ecosystem biomes.",
    books: [
      { subject: "History", title: "Our Pasts - II" },
      { subject: "Geography", title: "Our Environment" },
      { subject: "Polity", title: "Social and Political Life - II" },
      { subject: "Science", title: "Science (Class 7)" },
    ],
  },
  {
    classNum: 8,
    stage: "Modern Threshold",
    recommendedDuration: "2.5 Weeks",
    title: "Class 8: Modern Indian History, Resources & The Constitution",
    focusAreas: "British colonial conquest, 1857 revolt, mineral and power resources, rule of law & secularism.",
    highYieldTip: "Pay close attention to parliamentary democracy basics and landmark constitutional articles.",
    upscSignificance: "Establishes modern historical chronology and introduces basic constitutional principles.",
    books: [
      { subject: "History", title: "Our Pasts - III" },
      { subject: "Geography", title: "Resources and Development" },
      { subject: "Polity", title: "Social and Political Life - III" },
      { subject: "Science", title: "Science (Class 8)" },
    ],
  },
  {
    classNum: 9,
    stage: "Conceptual Deepening",
    recommendedDuration: "3 Weeks",
    title: "Class 9: Democratic Politics I, Contemporary India I & Economics",
    focusAreas: "Electoral politics, drainage systems & climate of India, poverty as a challenge, food security.",
    highYieldTip: "Monsoon mechanisms and constitutional design are frequently tested in Prelims.",
    upscSignificance: "High direct yield for Indian drainage basins, physical features, and democratic constitutional values.",
    books: [
      { subject: "Polity", title: "Democratic Politics - I" },
      { subject: "Geography", title: "Contemporary India - I" },
      { subject: "Economics", title: "Economics (Class 9)" },
      { subject: "History", title: "India and the Contemporary World - I" },
    ],
  },
  {
    classNum: 10,
    stage: "Secondary Core",
    recommendedDuration: "3 Weeks",
    title: "Class 10: Democratic Politics II, Resources II & Indian Economy",
    focusAreas: "Federalism, power sharing, sectors of Indian economy, money and credit, globalization.",
    highYieldTip: "Federalism and local decentralization concepts provide direct analytical anchors for GS 2.",
    upscSignificance: "Fundamental concepts of federalism, economic sectors, and resource distribution.",
    books: [
      { subject: "Polity", title: "Democratic Politics - II" },
      { subject: "Geography", title: "Contemporary India - II" },
      { subject: "Economics", title: "Understanding Economic Development" },
      { subject: "History", title: "India and the Contemporary World - II" },
    ],
  },
  {
    classNum: 11,
    stage: "Senior Core (High Yield)",
    recommendedDuration: "4 Weeks",
    title: "Class 11: Indian Constitution at Work, Physical Geography & Economic Dev",
    focusAreas: "Rights in the Constitution, Executive/Judiciary, Physical Geography fundamentals, 1991 economic reforms.",
    highYieldTip: "Fundamental rights, writ jurisdiction, geomorphology, and LPG reforms are mandatory UPSC Prelims anchors.",
    upscSignificance: "Extremely high yield: 'Indian Constitution at Work' and 'Physical Geography' generate 10-15 Prelims questions yearly.",
    books: [
      { subject: "Polity", title: "Indian Constitution at Work" },
      { subject: "Polity", title: "Political Theory" },
      { subject: "Geography", title: "Fundamentals of Physical Geography" },
      { subject: "Geography", title: "India: Physical Environment" },
      { subject: "Economics", title: "Indian Economic Development" },
      { subject: "Sociology", title: "Introducing Sociology" },
    ],
  },
  {
    classNum: 12,
    stage: "Advanced Mastery (Highest Yield)",
    recommendedDuration: "4.5 Weeks",
    title: "Class 12: Themes in Indian History, Politics in India & Macroeconomics",
    focusAreas: "Harappan archaeology to Partition, post-independence foreign policy, national income accounting, fiscal policy.",
    highYieldTip: "Bhakti-Sufi traditions, fiscal deficits, and balance of payments are tested every year in UPSC CSE.",
    upscSignificance: "Crucial for Mains GS 1 (Themes in Indian History I-III), GS 2 (Politics in India since Independence), and GS 3 Macroeconomics.",
    books: [
      { subject: "History", title: "Themes in Indian History - Part I" },
      { subject: "History", title: "Themes in Indian History - Part II" },
      { subject: "History", title: "Themes in Indian History - Part III" },
      { subject: "Polity", title: "Contemporary World Politics" },
      { subject: "Polity", title: "Politics in India Since Independence" },
      { subject: "Economics", title: "Introductory Macroeconomics" },
    ],
  },
];

export const NCERT_SUBJECT_METADATA: Record<
  string,
  {
    subject: string;
    gsPaper: string;
    classesCovered: number[];
    coreTheme: string;
    readingStrategy: string;
  }
> = {
  Polity: {
    subject: "Polity",
    gsPaper: "GS 2 & Prelims",
    classesCovered: [6, 7, 8, 9, 10, 11],
    coreTheme: "Constitutional democracy, fundamental rights, federal distribution of power, and institutional checks and balances.",
    readingStrategy: "Read Class 9 & 10 Democratic Politics followed by Class 11 'Indian Constitution at Work' for direct GS 2 linkages.",
  },
  History: {
    subject: "History",
    gsPaper: "GS 1 & Prelims",
    classesCovered: [6, 7, 8, 11, 12],
    coreTheme: "Archaeological origins from Harappa through colonial administrative evolution and the freedom struggle.",
    readingStrategy: "Focus on administrative and socioeconomic institutions rather than solely battle dates. Class 12 Themes I-III are indispensable.",
  },
  Geography: {
    subject: "Geography",
    gsPaper: "GS 1 & Prelims",
    classesCovered: [6, 7, 8, 9, 10, 11, 12],
    coreTheme: "Geomorphology, climatology, oceanography, Indian drainage systems, and economic resource geography.",
    readingStrategy: "Master Class 11 'Fundamentals of Physical Geography' diagrams, and map all drainage basins and passes from Class 11 India.",
  },
  Economy: {
    subject: "Economy",
    gsPaper: "GS 3 & Prelims",
    classesCovered: [9, 10, 11, 12],
    coreTheme: "National income, inflation, money and banking, budget deficit types, and post-1991 structural reforms.",
    readingStrategy: "Build clarity on concepts (Repo, Reverse Repo, Fiscal Deficit) in Class 12 Introductory Macroeconomics.",
  },
  Science: {
    subject: "Science",
    gsPaper: "GS 3 & Ecology",
    classesCovered: [6, 7, 8, 9, 10],
    coreTheme: "Ecology, biogeochemical cycles, biotechnology fundamentals, and environmental conservation.",
    readingStrategy: "Prioritize ecology chapters from Class 12 Biology and energy sources from Class 10 Science for Prelims environment coverage.",
  },
};

export const ALL_NCERT_CHAPTERS: NcertChapter[] = ncertRawData as NcertChapter[];
