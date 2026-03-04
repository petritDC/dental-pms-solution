export type Tensor = {
  id: number;
  coordinates: [number, number, number, number]; // [x1,y1,x2,y2]
  confidence: number; // 0..1
  classification: string;
};

export type ValidatedInfo = {
  width: number;
  height: number;
};

export type AnalyzeResult = {
  ok: true;
  tensors: Tensor[];
  validated?: ValidatedInfo;
  raw: unknown;
};

export type AnalyzeError = {
  ok: false;
  error: string;
  raw?: unknown;
};

