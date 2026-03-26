import type { Component } from 'vue';

export interface StatConfig {
  key: string;
  label: string;
  icon: Component;
  color: string;
  value: number | string | (() => number | string);
}

export interface WmsFilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}
