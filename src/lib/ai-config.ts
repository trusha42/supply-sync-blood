// One place to edit AI provider details and the benchmark numbers shown on the landing page.
export const AI_CONFIG = {
  provider: "Nebius Token Factory",
  model: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
  modelLabel: "NVIDIA Nemotron Ultra 253B",
  baseUrl: "https://api.tokenfactory.nebius.com/v1",
};

export const BENCHMARK = {
  baselineLabel: "PyTorch inference",
  baselineMs: 120,
  optimizedLabel: "TensorRT inference",
  optimizedMs: 18,
};

export const SAFETY_NOTICE = "BloodBridge helps find blood. Final decisions are made by doctors and blood banks.";
