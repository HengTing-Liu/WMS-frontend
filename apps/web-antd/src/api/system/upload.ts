import { requestClient } from '#/api/request';

export namespace UploadApi {
  /** 获取上传凭证返回 */
  export interface CredentialResult {
    fileNo: string;
    uploadUrl: string;
    downloadUrl: string;
    [key: string]: any;
  }
}

/**
 * 获取上传凭证
 * POST /api/files/credential
 */
async function getFilesCredential(params: {
  fileName: string;
  fileSize: number;
  contentType: string;
  bizModule?: string;
  uploadType?: string;
}) {
  return requestClient.post<UploadApi.CredentialResult>('/api/files/credential', {
    fileName: params.fileName,
    fileSize: params.fileSize,
    contentType: params.contentType,
    bizModule: params.bizModule ?? 'product-center',
    uploadType: params.uploadType ?? 'OSS',
  });
}

/**
 * 通知后端上传完成
 * POST /api/files/confirm
 */
async function confirmFile(params: { fileNo: string; fileSize: number; md5?: string }) {
  return requestClient.post('/api/files/confirm', {
    fileNo: params.fileNo,
    fileSize: params.fileSize,
    md5: params.md5 ?? '',
  });
}

/**
 * 直传文件到 OSS（使用 XHR，不经过 axios/requestClient，支持 onProgress）
 */
async function putFileToOss(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('网络错误'));
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent);
        }
      };
    }
    xhr.send(file);
  });
}

export { getFilesCredential, confirmFile, putFileToOss };
