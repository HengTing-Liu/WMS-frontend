export type CatalogTreeLineageItem = {
  level: number;
  categoryCode?: string;
  categoryName?: string;
  categoryNameCn?: string;
};

export type CatalogTreeNodeLike = {
  categoryNameCn?: string;
  children?: any[];
} & Record<string, any>;

export function attachCatalogTreeMeta<T extends CatalogTreeNodeLike>(
  nodes: T[],
  level = 1,
  lineage: CatalogTreeLineageItem[] = [],
): (T & { label?: string; level?: number; lineage?: CatalogTreeLineageItem[]; categoryName?: string })[] {
  return (nodes || []).map((item: any) => {
    const current: CatalogTreeLineageItem = {
      level,
      categoryCode: item?.categoryCode,
      categoryName: item?.categoryName ?? item?.categoryNameCn,
      categoryNameCn: item?.categoryNameCn,
    };
    const nextLineage = [...lineage, current];
    return {
      ...item,
      categoryName: item?.categoryName ?? item?.categoryNameCn,
      label: item?.categoryNameCn,
      level,
      lineage: nextLineage,
      children: item?.children
        ? attachCatalogTreeMeta(item.children, level + 1, nextLineage)
        : [],
    };
  });
}

export function pickListCategoryCode(args: {
  selectedCode?: any;
  level1Code?: any;
  fallbackCode?: string;
}) {
  const s = args.selectedCode;
  if (s != null && String(s).trim() !== '') return String(s).trim();
  const l1 = args.level1Code;
  if (l1 != null && String(l1).trim() !== '') return String(l1).trim();
  const fb = args.fallbackCode;
  if (fb != null && String(fb).trim() !== '') return String(fb).trim();
  return undefined;
}

export function mapCatalogRowCommon(raw: any) {
  const basicInfo = raw?.basicInfo ?? {};
  const otherInfo = raw?.otherInfo ?? {};
  const visibleStatus =
    basicInfo?.visibleStatus ?? basicInfo?.visible_status ?? raw?.visibleStatus ?? raw?.visible_status;
  const shelfStatus =
    basicInfo?.shelfStatus ??
    basicInfo?.shelf_status ??
    raw?.shelfStatus ??
    raw?.shelf_status;
  // 后端约定：
  // - visibleStatus：可售状态（1=可售，0=不可售）
  // - shelfStatus：产品状态（1=上架，0=下架）
  const visibleStatusText =
    visibleStatus === 1 ? '可售' : visibleStatus === 0 ? '不可售' : (visibleStatus ?? '-');
  const shelfStatusText =
    shelfStatus === 1 ? '上架' : shelfStatus === 0 ? '下架' : (shelfStatus ?? '-');

  return {
    ...raw,
    id: raw?.id ?? basicInfo?.id ?? basicInfo?.productNo,
    catalog_no: basicInfo?.productNo ?? '-',
    name: basicInfo?.productName ?? '-',
    category:
      basicInfo?.sbuName ??
      basicInfo?.buName ??
      (basicInfo?.bu && basicInfo?.sbu ? `${basicInfo.bu}-${basicInfo.sbu}` : '-'),
    // 页面列：产品状态(cp_status) / 可售状态(ks_status)
    cp_status: shelfStatusText,
    ks_status: visibleStatusText,
    brand: basicInfo?.brand ?? '-',
    gene_id: otherInfo?.taxClassificationCode ?? '-',
    mono_type: otherInfo?.websiteCategory ?? '-',
    creator: raw?.creator ?? raw?.createBy ?? '-',
    createTime:
      raw?.createTime ??
      raw?.create_time ??
      basicInfo?.createTime ??
      basicInfo?.create_time ??
      '-',
    modifier: raw?.modifier ?? raw?.updateBy ?? '-',
    modify_time: raw?.modifyTime ?? raw?.modify_time ?? '-',
    categoryCode: raw?.categoryCode ?? basicInfo?.categoryCode ?? otherInfo?.categoryCode,
  };
}

