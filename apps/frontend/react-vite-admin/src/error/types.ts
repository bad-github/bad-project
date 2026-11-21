export type ErrorLevel = 'ignore' | 'recoverable' | 'reload' | 'fatal';

export interface NormalizedError {
  message?: string;
  stack?: string;
  type: string;
  raw: any;
}

export type ErrorListener = (error: NormalizedError) => void;
