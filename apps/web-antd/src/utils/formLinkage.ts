import { ref, watch, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { requestClient } from '#/api/request';

export type FormKey = 'basic' | 'category' | 'application' | 'other';

export interface AsyncLinkageConfig {
  api: string;
  targetField: string;
  paramKey: string;
  labelField?: string;
  valueField?: string;
  /**
   * 联动模式：
   * - 'options'：默认模式，请求结果用于更新目标字段的下拉 options（Select 组件）
   * - 'value'：值模式，请求结果用于直接给目标字段赋值（例如 Input 组件）
   */
  mode?: 'options' | 'value';
}

export interface FormSchemaItem {
  fieldName: string;
  component: string;
  label?: string;
  formItemClass?: string;
  rules?: any;
  componentProps?: Record<string, any>;
  asyncLinkage?: AsyncLinkageConfig;
}

export interface LinkageOperation {
  targetFormKey: FormKey;
  targetField: string;
  operationType: 'setValue' | 'setDisabled' | 'setOptions' | 'setRequired' | 'setVisible';
  value: any;
}

export interface LinkageAction {
  condition: { eq: string };
  operations: LinkageOperation[];
}

export interface LinkageRule {
  triggerFormKey: FormKey;
  triggerField: string;
  triggerType: 'change';
  actions: LinkageAction[];
}

export interface AsyncLinkageGlobalConfig {
  defaultParams?: Record<string, any>;
  errorMsg?: string;
}

export type FormInstanceMap = Record<FormKey, any>;

export interface FormOptionsLike {
  schema: any[];
}

export type FormOptionsMap = Record<FormKey, FormOptionsLike>;

/**
 * 通用联动引擎上下文
 *
 * - linkageRules：后端下发的联动规则数组（响应式）
 * - asyncLinkageGlobalConfig：异步联动的全局配置（例如默认参数、错误提示文案）（响应式）
 * - formInstanceMap：各区块表单实例，用于读写表单值
 * - formOptionsMap：各区块表单 schema 配置，用于在联动时更新某个字段的属性（options/visible 等）
 */
export interface LinkageEngineContext {
  linkageRules: Ref<LinkageRule[]>;
  asyncLinkageGlobalConfig: Ref<AsyncLinkageGlobalConfig | null>;
  formInstanceMap: FormInstanceMap;
  formOptionsMap: FormOptionsMap;
}

/**
 * 执行联动规则（本地联动，不含异步接口）
 *
 * 约定：
 * - 只处理 triggerType === 'change' 的规则
 * - 只支持等于判断（condition.eq）
 */
export async function executeLinkage(
  ctx: Pick<LinkageEngineContext, 'linkageRules' | 'formInstanceMap'>,
  triggerFormKey: FormKey,
  triggerField: string,
  triggerValue: any,
) {
  if (triggerValue == null || ctx.linkageRules.value.length === 0) return;

  const rule = ctx.linkageRules.value.find(
    (r) => r.triggerFormKey === triggerFormKey && r.triggerField === triggerField,
  );
  if (!rule) return;

  for (const action of rule.actions) {
    if (triggerValue !== action.condition.eq) continue;

    for (const operation of action.operations) {
      const targetFormApi = ctx.formInstanceMap[operation.targetFormKey];
      if (!targetFormApi) continue;

      try {
        switch (operation.operationType) {
          case 'setValue':
            await targetFormApi.setValues?.({ [operation.targetField]: operation.value });
            break;
          case 'setDisabled':
            await targetFormApi.setFieldProps?.(operation.targetField, { disabled: operation.value });
            break;
          case 'setOptions':
            await targetFormApi.setFieldProps?.(operation.targetField, {
              componentProps: { options: operation.value },
            });
            break;
          case 'setRequired':
            await targetFormApi.setFieldRules?.(operation.targetField, { required: operation.value });
            break;
          case 'setVisible':
            await targetFormApi.setFieldProps?.(operation.targetField, { hidden: !operation.value });
            break;
          default:
            console.warn('不支持的联动操作类型：', operation.operationType);
        }
      } catch (e) {
        console.error('执行联动操作失败：', e);
      }
    }
  }
}

/**
 * 触发异步联动：
 * - 根据 asyncLinkage 配置，请求后端接口
 * - 把返回结果映射为 options 并更新目标字段
 * - 可选：自动选中第一项
 */
export async function loadAsyncLinkageData(
  ctx: Pick<LinkageEngineContext, 'asyncLinkageGlobalConfig' | 'formOptionsMap'>,
  formKey: FormKey,
  formApi: any,
  schemaItem: FormSchemaItem,
  triggerValue: any,
) {
  const asyncCfg = schemaItem.asyncLinkage;
  if (!asyncCfg || triggerValue == null) return;

  const { api, targetField, paramKey, labelField = 'label', valueField = 'value', mode = 'options' } = asyncCfg;
  const globalCfg = ctx.asyncLinkageGlobalConfig.value;

  const params: Record<string, any> = {
    [paramKey]: triggerValue,
    ...(globalCfg?.defaultParams ?? {}),
  };

  try {
    const resp = await requestClient.get<any | any[]>(api, { params });
    const rawList = Array.isArray(resp) ? resp : resp != null ? [resp] : [];

    // 1. 统一从返回中抽取 options/value 列表
    const mapped = rawList
      .map((item) => ({
        label: item?.[labelField],
        value: item?.[valueField],
      }))
      .filter((opt) => opt.label != null || opt.value != null);

    const formOptions = ctx.formOptionsMap[formKey];
    const targetItem = formOptions.schema.find((i: any) => i.fieldName === targetField) ?? {};
    const baseProps = targetItem.componentProps ?? {};

    if (mode === 'options') {
      // 默认：更新下拉 options
      await formApi?.updateSchema?.([
        {
          fieldName: targetField,
          componentProps: {
            ...baseProps,
            options: mapped,
          },
        },
      ]);

      if (mapped.length > 0) {
        await formApi?.setValues?.({ [targetField]: mapped[0].value });
      }
    } else if (mode === 'value') {
      // 值模式：直接给字段赋值（适用于 Input 等）
      // 优先匹配「当前触发值」对应的项（例如选中了 value=2，希望写入 2），否则退回第一项
      const matched =
        mapped.find((item) => item.value === triggerValue || item.label === triggerValue) ??
        mapped[0];
      const finalValue = matched?.value ?? matched?.label ?? '';
      await formApi?.setValues?.({ [targetField]: finalValue });
    }
  } catch (e) {
    const msg = globalCfg?.errorMsg || '加载联动数据失败';
    console.error(msg, e);
    message.error(msg);
  }
}

/**
 * 为 schema 中的字段自动注入 onChange：
 * - 命中 linkageRules 的字段：触发本地联动 executeLinkage
 * - 配置了 asyncLinkage 的字段：触发异步联动 loadAsyncLinkageData
 *
 * 该函数是「纯函数」，不会直接改动外部状态，只返回新的 schema 数组。
 */
export function enhanceSchemaWithLinkage(
  ctx: LinkageEngineContext,
  schema: FormSchemaItem[],
  formKey: FormKey,
  rules: LinkageRule[],
): any[] {
  if (!schema?.length) return schema;

  const hasRules = Array.isArray(rules) && rules.length > 0;
  const triggerFields = new Set(
    hasRules
      ? rules
          .filter((r) => r.triggerFormKey === formKey && r.triggerType === 'change')
          .map((r) => r.triggerField)
      : [],
  );

  return schema.map((item) => {
    const hasLocalLinkage = hasRules && triggerFields.has(item.fieldName);
    const hasAsyncLinkage = !!item.asyncLinkage;
    if (!hasLocalLinkage && !hasAsyncLinkage) return item;

    const originProps = item.componentProps ?? {};
    const originOnChange = originProps.onChange;

    return {
      ...item,
      componentProps: {
        ...originProps,
        onChange: async (...args: any[]) => {
          const raw = args[0];
          const value = raw && raw.target ? raw.target.value : raw;

          if (typeof originOnChange === 'function') {
            await originOnChange(...args);
          }

          if (hasLocalLinkage) {
            await executeLinkage(
              { linkageRules: ctx.linkageRules, formInstanceMap: ctx.formInstanceMap },
              formKey,
              item.fieldName,
              value,
            );
          }

          if (hasAsyncLinkage) {
            const formApi = ctx.formInstanceMap[formKey];
            await loadAsyncLinkageData(
              { asyncLinkageGlobalConfig: ctx.asyncLinkageGlobalConfig, formOptionsMap: ctx.formOptionsMap },
              formKey,
              formApi,
              item,
              value,
            );
          }
        },
      },
    };
  });
}

/**
 * 建立联动监听：
 * - 根据 linkageRules 中的 triggerFormKey/triggerField
 * - 通过表单实例的 getValues 读取触发字段的值
 * - 一旦变化则调用 executeLinkage
 */
export function setupLinkageWatch(ctx: Pick<LinkageEngineContext, 'linkageRules' | 'formInstanceMap'>) {
  if (!ctx.linkageRules.value.length) return;

  ctx.linkageRules.value.forEach((rule) => {
    watch(
      async () => {
        const triggerFormApi = ctx.formInstanceMap[rule.triggerFormKey];
        if (!triggerFormApi?.getValues) return undefined;
        const values = await triggerFormApi.getValues();
        return values?.[rule.triggerField];
      },
      async (newValue) => {
        await executeLinkage(ctx, rule.triggerFormKey, rule.triggerField, newValue);
      },
      { immediate: true },
    );
  });
}

/**
 * 创建一个简单的联动引擎上下文（可选工具函数）
 *
 * 使用方式：
 * const linkageRules = ref<LinkageRule[]>([]);
 * const asyncLinkageGlobalConfig = ref<AsyncLinkageGlobalConfig | null>(null);
 * const formInstanceMap = reactive<Record<FormKey, any>>({ ... });
 * const formOptionsMap: FormOptionsMap = { ... };
 * const ctx = createLinkageEngineContext({ linkageRules, asyncLinkageGlobalConfig, formInstanceMap, formOptionsMap });
 */
export function createLinkageEngineContext(
  params: Omit<LinkageEngineContext, 'linkageRules' | 'asyncLinkageGlobalConfig'> & {
    linkageRules?: Ref<LinkageRule[]>;
    asyncLinkageGlobalConfig?: Ref<AsyncLinkageGlobalConfig | null>;
  },
): LinkageEngineContext {
  const linkageRules = params.linkageRules ?? ref<LinkageRule[]>([]);
  const asyncLinkageGlobalConfig = params.asyncLinkageGlobalConfig ?? ref<AsyncLinkageGlobalConfig | null>(null);

  return {
    linkageRules,
    asyncLinkageGlobalConfig,
    formInstanceMap: params.formInstanceMap,
    formOptionsMap: params.formOptionsMap,
  };
}

