export interface TreemapDatum {
  key: string;
  label: string;
  value: number;
  /** Any CSS color; defaults to the categorical series palette by index. */
  color?: string;
}

export interface TreemapRect<T extends { value: number } = TreemapDatum> {
  datum: T;
  x: number;
  y: number;
  width: number;
  height: number;
}
