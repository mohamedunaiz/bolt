import {
  ModelOption,
  LaptopSpecs,
  ActiveModelConfig,
  ModelRecommendation,
  GatewayProvider,
} from "../types";

export interface CuratedModelItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  context: string;
}

export interface ProviderMeta {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  apiKeyPlaceholder?: string;
  models: CuratedModelItem[];
  isCloud: boolean;
}

export const DEFAULT_LAPTOP_SPECS: LaptopSpecs = {
  deviceType: "mac_apple_silicon",
  totalRamGb: 16,
  vramGb: 8,
  cpuCores: 8,
  storageFreeGb: 50,
};

export const DEFAULT_ACTIVE_MODEL_CONFIG: ActiveModelConfig = {
  selectedModelId: "gemini-3.1-flash-lite",
  modelType: "cloud",
  provider: "gemini",
  localEndpoint: "http://localhost:11434",
  temperature: 0.7,
  contextWindowTokens: 32768,
  evaluatorPersona: "strict_upsc",
  reasoningDeliberation: "balanced",
  strict2ndArcCitation: true,
  crossPaperSynthesis: true,
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Google Gemini 3.1 Flash Lite (Default)",
    type: "cloud",
    provider: "Google AI Studio",
    parameterSize: "Cloud Hosted",
    minRamGb: 4,
    minVramGb: 0,
    recommendedQuant: "Cloud FP16",
    description: "Ultra-fast response latency optimized for real-time UPSC civil services mentorship, query routing, and instant Prelims verification.",
    strengths: ["Instant conversational speed", "Low latency", "Broad UPSC syllabus comprehension"],
    ollamaCommand: "None (Cloud)",
    contextWindow: "32,768 tokens",
  },
  {
    id: "gemini-3.6-flash",
    name: "Google Gemini 3.6 Flash (High Deliberation)",
    type: "cloud",
    provider: "Google AI Studio",
    parameterSize: "Cloud Hosted",
    minRamGb: 4,
    minVramGb: 0,
    recommendedQuant: "Cloud FP16",
    description: "Deep analytical reasoning model calibrated for rigorous UPSC Mains answer sheet evaluation and multi-dimensional rubric scoring.",
    strengths: ["Comprehensive Mains scoring", "2nd ARC report linkages", "Deep multi-paper synthesis"],
    ollamaCommand: "None (Cloud)",
    contextWindow: "128,000 tokens",
  },
  {
    id: "bolt-qwen2.5-7b-instruct-q4",
    name: "Qwen 2.5 7B Instruct (Offline Quantized)",
    type: "local",
    provider: "Ollama / Local Engine",
    parameterSize: "7B Parameters",
    minRamGb: 8,
    minVramGb: 4,
    recommendedQuant: "Q4_K_M (4.7 GB)",
    description: "Compact high-performance instruction-tuned model running 100% on-device without internet access.",
    strengths: ["Complete offline privacy", "Strong structured JSON generation", "Rapid on-device inference"],
    ollamaCommand: "ollama run qwen2.5:7b-instruct-q4_K_M",
    contextWindow: "8,192 tokens",
    ollamaModelTag: "qwen2.5:7b-instruct-q4_K_M",
  },
  {
    id: "bolt-llama3.1-8b-instruct-q5",
    name: "Llama 3.1 8B Instruct (Offline)",
    type: "local",
    provider: "Ollama / Local Engine",
    parameterSize: "8B Parameters",
    minRamGb: 16,
    minVramGb: 6,
    recommendedQuant: "Q5_K_M (5.7 GB)",
    description: "Meta Llama 3.1 architecture offering balanced reasoning and rich academic prose for Mains answer structure review.",
    strengths: ["Nuanced conceptual articulation", "Ethics case study evaluations", "Zero data egress"],
    ollamaCommand: "ollama run llama3.1:8b-instruct-q5_K_M",
    contextWindow: "16,384 tokens",
    ollamaModelTag: "llama3.1:8b-instruct-q5_K_M",
  },
  {
    id: "bolt-deepseek-r1-8b-q4",
    name: "DeepSeek R1 8B Reasoning (Local)",
    type: "local",
    provider: "Ollama / Local Engine",
    parameterSize: "8B Parameters",
    minRamGb: 16,
    minVramGb: 6,
    recommendedQuant: "Q4_K_M (4.9 GB)",
    description: "Chain-of-thought reasoning specialist excelling at solving tricky Prelims statement elimination puzzles.",
    strengths: ["Step-by-step logical deduction", "Trap identification in Prelims MCQs", "Socratic explanations"],
    ollamaCommand: "ollama run deepseek-r1:8b",
    contextWindow: "16,384 tokens",
    ollamaModelTag: "deepseek-r1:8b",
  },
];

export const PROVIDER_METAS: ProviderMeta[] = [
  {
    id: "gemini",
    name: "Google Gemini Cloud",
    badge: "Recommended",
    icon: "Sparkles",
    description: "Primary server-side AI provider powered by Google Gemini 3.1 Flash Lite and 3.6 Flash.",
    defaultModel: "gemini-3.1-flash-lite",
    apiKeyPlaceholder: "AIzaSy...",
    isCloud: true,
    models: [
      {
        id: "gemini-3.1-flash-lite",
        name: "Gemini 3.1 Flash Lite",
        badge: "Fast / Default",
        description: "Optimal for instant query routing, Prelims checks, and study planner chat.",
        context: "32K tokens",
      },
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        badge: "Deliberation",
        description: "Deep analytical reasoning for Mains 7-dimension evaluation and thinkers cross-linkages.",
        context: "128K tokens",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI Compatible",
    badge: "Cloud API",
    icon: "Cpu",
    description: "Compatible endpoints supporting GPT-4o, GPT-4o-mini, and compatible reverse proxies.",
    defaultModel: "gpt-4o-mini",
    defaultBaseUrl: "https://api.openai.com/v1",
    apiKeyPlaceholder: "sk-...",
    isCloud: true,
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        badge: "Fast",
        description: "Efficient reasoning model with general GS domain comprehension.",
        context: "128K tokens",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        badge: "Flagship",
        description: "High multimodal precision for handwritten answer script recognition.",
        context: "128K tokens",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    badge: "Cloud API",
    icon: "Brain",
    description: "Claude 3.5 Sonnet and Haiku models with nuanced rhetorical articulation.",
    defaultModel: "claude-3-5-sonnet-20241022",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    apiKeyPlaceholder: "sk-ant-...",
    isCloud: true,
    models: [
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        badge: "Low Latency",
        description: "Fast responses with sharp concise explanations.",
        context: "200K tokens",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        badge: "Deep Reasoning",
        description: "Exceptional nuance in academic prose and ethics dilemmas.",
        context: "200K tokens",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq LPU Engine",
    badge: "Ultra Fast",
    icon: "Zap",
    description: "Sub-second inference for open models (Llama 3.3 70B, Qwen 2.5 32B).",
    defaultModel: "llama-3.3-70b-versatile",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    apiKeyPlaceholder: "gsk_...",
    isCloud: true,
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        badge: "Flagship Open",
        description: "Sub-second speed on open-weight Llama 3.3.",
        context: "128K tokens",
      },
      {
        id: "qwen-2.5-32b",
        name: "Qwen 2.5 32B",
        badge: "Strong Structure",
        description: "High accuracy structured rubric evaluations.",
        context: "32K tokens",
      },
    ],
  },
  {
    id: "local",
    name: "Local Ollama Daemon",
    badge: "100% Offline",
    icon: "Server",
    description: "Runs open-weight GGUF models directly on your hardware with 100% offline privacy.",
    defaultModel: "bolt-qwen2.5-7b-instruct-q4",
    defaultBaseUrl: "http://localhost:11434",
    apiKeyPlaceholder: "Not required for local daemon",
    isCloud: false,
    models: [
      {
        id: "bolt-qwen2.5-7b-instruct-q4",
        name: "Qwen 2.5 7B Q4",
        badge: "Recommended Local",
        description: "Runs comfortably within 8GB RAM at 25-35 tokens/sec.",
        context: "8K tokens",
      },
      {
        id: "bolt-llama3.1-8b-instruct-q5",
        name: "Llama 3.1 8B Q5",
        badge: "High Fidelity",
        description: "Balanced reasoning for 16GB RAM setups.",
        context: "16K tokens",
      },
      {
        id: "bolt-deepseek-r1-8b-q4",
        name: "DeepSeek R1 8B",
        badge: "Reasoning Local",
        description: "Chain-of-thought Prelims solver on-device.",
        context: "16K tokens",
      },
    ],
  },
];

export function calculateHardwareRecommendation(specs: LaptopSpecs): ModelRecommendation {
  const ram = specs.totalRamGb || 8;
  const isAppleSilicon = specs.deviceType === "mac_apple_silicon";
  const hasGpu = specs.deviceType === "windows_nvidia_gpu" || isAppleSilicon;

  if (ram >= 16 && hasGpu) {
    return {
      recommendedModelId: "bolt-qwen2.5-7b-instruct-q4",
      fitLevel: "perfect",
      headline: "Local High-Performance Inference Enabled",
      reason: "Your machine has sufficient unified/dedicated VRAM and RAM to comfortably host 7B–8B 4-bit/5-bit quantized models at 25–40 tokens/sec.",
      expectedTokensPerSec: 32,
      memoryBudget: {
        modelWeightsGb: 4.8,
        kvCacheGb: 1.5,
        osOverheadGb: 4.0,
        totalRequiredGb: 10.3,
      },
      alternativeModelId: "gemini-3.1-flash-lite",
    };
  }

  if (ram >= 12) {
    return {
      recommendedModelId: "bolt-qwen2.5-7b-instruct-q4",
      fitLevel: "good",
      headline: "Local On-Device Execution Supported",
      reason: "Your system can run 7B Q4 models with modest context buffers. For intensive Mains evaluation batches, Google Gemini Cloud provides faster turnaround.",
      expectedTokensPerSec: 18,
      memoryBudget: {
        modelWeightsGb: 4.5,
        kvCacheGb: 1.0,
        osOverheadGb: 3.5,
        totalRequiredGb: 9.0,
      },
      alternativeModelId: "gemini-3.1-flash-lite",
    };
  }

  return {
    recommendedModelId: "gemini-3.1-flash-lite",
    fitLevel: "tight",
    headline: "Cloud-First Architecture Recommended",
    reason: "With limited local RAM/VRAM, running LLMs on-device will cause memory paging and system lag. Google Gemini Cloud executes in milliseconds with zero hardware strain.",
    expectedTokensPerSec: 60,
    memoryBudget: {
      modelWeightsGb: 0.1,
      kvCacheGb: 0.1,
      osOverheadGb: 2.0,
      totalRequiredGb: 2.2,
    },
    alternativeModelId: "gemini-3.6-flash",
  };
}
