/**
 * 文件下载工具
 * 支持 Blob 类型的文件下载（Excel、CSV 等）
 */

interface DownloadOptions {
  method?: 'GET' | 'POST';
  fileName?: string;
  timeout?: number;
}

/**
 * 下载 Blob 文件
 * @param url 下载接口地址
 * @param data 请求参数
 * @param options 下载选项
 */
export async function downloadBlob(
  url: string,
  data: Record<string, any> = {},
  options: DownloadOptions = {},
): Promise<void> {
  const { method = 'POST', fileName, timeout = 60000 } = options;

  // 构建完整的请求 URL（用于 GET 请求）
  let requestUrl = url;
  if (method === 'GET' && Object.keys(data).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    }
    const queryString = params.toString();
    requestUrl = queryString ? `${url}?${queryString}` : url;
  }

  // 准备请求配置
  const requestOptions: RequestInit = {
    method,
    headers: {},
    timeout,
  };

  // 添加认证 token
  const token = localStorage.getItem('accessToken') || localStorage.getItem('oms_token');
  if (token) {
    (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // 添加租户 ID
  const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('oms_tenant_id');
  if (tenantId) {
    (requestOptions.headers as Record<string, string>)['X-Tenant-Id'] = tenantId;
  }

  // POST 请求添加请求体
  if (method === 'POST') {
    (requestOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(data);
  }

  // 发起请求
  const response = await fetch(requestUrl, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`下载失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // 获取文件名
  let downloadFileName = fileName;
  if (!downloadFileName) {
    // 尝试从响应头获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        // 处理 URL 编码的文件名
        downloadFileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }
  }

  // 如果没有文件名，使用默认值
  if (!downloadFileName) {
    downloadFileName = `export_${Date.now()}.xlsx`;
  }

  // 获取 Blob 数据
  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('下载文件为空');
  }

  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = downloadFileName;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 下载 Excel 文件（简化版）
 * @param url 下载接口地址
 * @param params 查询参数
 */
export function downloadExcel(url: string, params: Record<string, any> = {}): Promise<void> {
  return downloadBlob(url, params, {
    method: 'POST',
    fileName: `${params.fileName || '导出'}_${new Date().getTime()}.xlsx`,
  });
}

/**
 * 导出为 CSV 文件
 * @param data CSV 数据
 * @param fileName 文件名
 */
export function downloadCSV(data: string, fileName: string = 'export.csv'): void {
  const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
