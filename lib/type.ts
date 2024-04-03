export type R = number;
export type G = number;
export type B = number;
export type A = number;

export type FadeMode = "in" | "out";
export type Pixel = [R, G, B, A];

export type ImageSplitChunk = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  data?: Uint8ClampedArray;
};
