/**
 * 权限管理相关类型定义
 */

export interface PermissionNode {
  menuId: number | string;
  parentId: number | string;
  menuName: string;
  menuType: 'C' | 'M' | 'F';
  perms?: string;
  path?: string;
  component?: string;
  icon?: string;
  orderNum?: number;
  visible?: string;
  status?: string;
  children?: PermissionNode[];
  [key: string]: any;
}

export interface MenuMetaMap {
  menuId: number;
  entityName?: string;
  listMode: 'tree' | 'flat';
  treeParentField: string;
  treeLabelField: string;
  treeNodeType?: string;
  remarks?: string;
  createTime?: string;
  updateTime?: string;
}

export interface NodeTypeConfig {
  icon: string;
  color: string;
  tagColor: string;
  label: string;
}

export const NODE_TYPE_CONFIG: Record<string, NodeTypeConfig> = {
  C: {
    icon: 'material-symbols:folder',
    color: '#409eff',
    tagColor: 'blue',
    label: 'page.system.permission.typeCatalog',
  },
  M: {
    icon: 'material-symbols:grid-view',
    color: '#67c23a',
    tagColor: 'green',
    label: 'page.system.permission.typeMenu',
  },
  F: {
    icon: 'material-symbols:check-box-outline-blank',
    color: '#e6a23c',
    tagColor: 'orange',
    label: 'page.system.permission.typeButton',
  },
};