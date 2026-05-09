import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { Button, Image } from 'ant-design-vue';

import { $t } from '#/locales';
import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'small', type: 'link' },
          { default: () => props?.text },
        );
      },
    });

    vxeUI.renderer.add('CellOperation', {
      renderTableDefault(renderOpts, params) {
        const { attrs, options } = renderOpts as any;
        const { row } = params;
        const actions = Array.isArray(options) ? options : ['edit', 'delete'];
        return h(
          'div',
          { class: 'flex gap-2' },
          actions.map((opt: any) => {
            const action =
              typeof opt === 'string'
                ? {
                    code: opt,
                    text:
                      opt === 'edit'
                        ? $t('common.edit')
                        : opt === 'delete'
                          ? $t('common.delete')
                          : opt,
                    disabled: false,
                  }
                : opt;
            const isDisabled =
              typeof action.disabled === 'function'
                ? action.disabled(row)
                : !!action.disabled;
            return h(
              Button,
              {
                size: 'small',
                disabled: isDisabled,
                onClick: () => attrs?.onClick?.({ code: action.code, row }),
              },
              { default: () => action.text },
            );
          }),
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
