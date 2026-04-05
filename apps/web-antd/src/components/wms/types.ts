import type { Component } from 'vue';

export type WmsStatTone = 'blue' | 'green' | 'orange' | 'purple' | 'red';

export interface WmsStatItem {
  key: string;
  label: string;
  value: number | string;
  icon?: Component;
  tone?: WmsStatTone;
}

/** @deprecated 请改用 WmsStatItem */
export type StatConfig = WmsStatItem;

export interface WmsFilterFieldDef {
  key: string;
  label: string;
  type: 'input' | 'select';
  options?: Array<{ label: string; value: any }>;
}
