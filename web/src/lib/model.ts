// Inference for the exported crash model (ml/out/model.json). Gradient
// boosting trees by default, a small MLP as a fallback. No dependencies, runs
// on the server and in the browser.

import modelJson from "./ml/model.json";

type TreeNode = { f: number; t: number; l: number; r: number; v: number; leaf: boolean; ml: boolean };
type Model = {
  kind: "gbm" | "mlp";
  features: string[];
  threshold: number;
  scaler: { mean: number[]; scale: number[] };
  trained_on: string;
  gbm?: { baseline: number; trees: TreeNode[][] };
  mlp?: { W1: number[][]; b1: number[]; W2: number[]; b2: number };
};

export const MODEL = modelJson as Model;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function standardize(f: number[]): number[] {
  return f.map((v, i) => (v - MODEL.scaler.mean[i]) / MODEL.scaler.scale[i]);
}

function gbmRaw(f: number[]): number {
  const g = MODEL.gbm!;
  let z = g.baseline;
  for (const tree of g.trees) {
    let i = 0;
    for (;;) {
      const n = tree[i];
      if (n.leaf) {
        z += n.v;
        break;
      }
      const x = f[n.f];
      i = Number.isNaN(x) ? (n.ml ? n.l : n.r) : x <= n.t ? n.l : n.r;
    }
  }
  return z;
}

function mlpRaw(f: number[]): number {
  const m = MODEL.mlp!;
  const x = standardize(f);
  let z = m.b2;
  for (let j = 0; j < m.W1.length; j++) {
    let h = m.b1[j];
    for (let i = 0; i < x.length; i++) h += m.W1[j][i] * x[i];
    z += m.W2[j] * Math.max(0, h);
  }
  return z;
}

// Probability that a feature vector is a crash.
export function crashProbability(f: number[], kind: Model["kind"] = MODEL.kind): number {
  const z = kind === "gbm" && MODEL.gbm ? gbmRaw(f) : mlpRaw(f);
  return sigmoid(z);
}

export const MODEL_THRESHOLD = MODEL.threshold;
