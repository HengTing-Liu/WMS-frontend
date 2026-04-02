/**
 * 根据动态表单 formModel（结构与接口返回的区块/字段一致）组装提交体。
 * 后端区块名、字段名变化时，只要表单仍按 schema 绑定到 formModel，即可原样提交（并做通用清理）。
 */

export interface BuildProductCatalogPayloadOptions {
  defaultSourceLang?: string;
  /**
   * 某区块对象内只有一个 key 且值为数组时，提交时提升为该数组。
   * 例：applicationInfo: { applicationList: [...] } -> applicationInfo: [...]
   */
  promoteSingleTableSection?: boolean;
  /** 表格行内 recommandDilution -> recommendedDilution */
  normalizeRecommendedDilution?: boolean;
  /** 任意对象内 BU/SBU -> bu/sbu */
  normalizeBuSbu?: boolean;
  /**
   * 将 otherInfo 里 transport_condition、website_category 等映射为后端 add 接口常用字段
   * （若后端已改字段名，可在调用处关 false，完全走动态结构）
   */
  legacyOtherInfoMap?: boolean;
}

function stripRowKeysDeep(
  value: any,
  options: { normalizeRecommendedDilution: boolean },
): any {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const { _rowKey, ...rest } = item as Record<string, any>;
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(rest)) {
          out[k] = stripRowKeysDeep(v, options);
        }
        if (
          options.normalizeRecommendedDilution &&
          'recommandDilution' in out &&
          !('recommendedDilution' in out)
        ) {
          out.recommendedDilution = out.recommandDilution;
          delete out.recommandDilution;
        }
        return out;
      }
      return stripRowKeysDeep(item, options);
    });
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = stripRowKeysDeep(v, options);
    }
    return out;
  }
  return value;
}

function walkObjects(root: any, fn: (o: Record<string, any>) => void) {
  if (!root || typeof root !== 'object') return;
  if (Array.isArray(root)) {
    root.forEach((x) => walkObjects(x, fn));
    return;
  }
  fn(root as Record<string, any>);
  for (const v of Object.values(root)) {
    walkObjects(v, fn);
  }
}

function normalizeBuSbuDeep(root: any) {
  walkObjects(root, (obj) => {
    if ('BU' in obj) {
      obj.bu = obj.BU;
      delete obj.BU;
    }
    if ('SBU' in obj) {
      obj.sbu = obj.SBU;
      delete obj.SBU;
    }
  });
}

/**
 * applicationInfo 表格行：后端期望字段名为 applicationId
 * 而表单里当前字段码可能是 application，因此在提交前统一重命名。
 */
function normalizeApplicationIdDeep(root: any) {
  walkObjects(root, (obj) => {
    if (!('application' in obj)) return;
    if ('applicationId' in obj) return;
    obj.applicationId = obj.application;
    delete obj.application;
  });
}

function promoteSingleTableAtRoot(clone: Record<string, any>) {
  const out: Record<string, any> = { ...clone };
  for (const [sk, sv] of Object.entries(out)) {
    if (sv == null || typeof sv !== 'object' || Array.isArray(sv)) continue;
    const keys = Object.keys(sv);
    if (keys.length !== 1) continue;
    const only = sv[keys[0]!];
    if (Array.isArray(only)) {
      out[sk] = only;
    }
  }
  return out;
}

function applyLegacyOtherInfoMap(otherInfo: Record<string, any>) {
  return {
    storageId: otherInfo.transport_condition ?? otherInfo.storageId,
    websiteCategoryIds:
      otherInfo.website_category ??
      otherInfo.websiteCategoryIds ??
      otherInfo.websiteCategory,
    remark: otherInfo.remark,
    exportName: otherInfo.export_name ?? otherInfo.exportName,
    taxClassificationCode:
      otherInfo.tax_classification_code ?? otherInfo.taxClassificationCode,
  };
}

/** 后端约定：网站分类多选提交字段名为 websiteCategoryIds（表单模型仍为 websiteCategory） */
function ensureOtherInfoWebsiteCategoryIds(otherInfo: Record<string, any>): Record<string, any> {
  const o = { ...otherInfo };
  if ('websiteCategoryIds' in o) {
    delete o.websiteCategory;
    return o;
  }
  if ('websiteCategory' in o) {
    o.websiteCategoryIds = o.websiteCategory;
    delete o.websiteCategory;
  }
  return o;
}

/**
 * 提交 POST /api/product/catalog/add 的 body（结构与当前 formModel 区块一致，并做通用清理）
 */
export function buildProductCatalogAddPayload(
  model: Record<string, any>,
  options?: BuildProductCatalogPayloadOptions,
) {
  const opts: Required<BuildProductCatalogPayloadOptions> = {
    defaultSourceLang: 'zh_cn',
    promoteSingleTableSection: true,
    normalizeRecommendedDilution: true,
    normalizeBuSbu: true,
    legacyOtherInfoMap: true,
    ...options,
  };

  const sourceLang = model.sourceLang ?? opts.defaultSourceLang;
  const raw = { ...model };
  delete raw.sourceLang;

  let body = stripRowKeysDeep(raw, {
    normalizeRecommendedDilution: opts.normalizeRecommendedDilution,
  }) as Record<string, any>;

  if (opts.promoteSingleTableSection) {
    body = promoteSingleTableAtRoot(body);
  }

  if (opts.normalizeBuSbu) {
    normalizeBuSbuDeep(body);
  }

  // 兼容：表格列字段 application -> applicationId
  normalizeApplicationIdDeep(body);

  if (
    opts.legacyOtherInfoMap &&
    body.otherInfo &&
    typeof body.otherInfo === 'object' &&
    !Array.isArray(body.otherInfo)
  ) {
    body = { ...body, otherInfo: applyLegacyOtherInfoMap(body.otherInfo) };
  }

  if (body.otherInfo && typeof body.otherInfo === 'object' && !Array.isArray(body.otherInfo)) {
    body = { ...body, otherInfo: ensureOtherInfoWebsiteCategoryIds(body.otherInfo) };
  }

  return {
    sourceLang,
    ...body,
  };
}
