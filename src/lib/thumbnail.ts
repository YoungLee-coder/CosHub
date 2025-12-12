/**
 * 缩略图 URL 生成工具
 * 使用 COS 数据万象 (CI) 的 imageView2 接口在线生成缩略图
 */

import { isImageFile } from './utils'

// 支持 CI 处理的图片格式
const CI_SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif']

/**
 * 检查文件是否支持 CI 缩略图处理
 */
export function isThumbnailSupported(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return CI_SUPPORTED_FORMATS.includes(ext)
}

/**
 * 生成缩略图 URL
 * 
 * @param baseUrl - 原始文件 URL (CDN 或 COS 直链)
 * @param etag - 对象 ETag，用于缓存版本控制
 * @param size - 缩略图尺寸 (默认 280px)
 * @returns 带 CI 参数的缩略图 URL
 * 
 * 关键性能优化:
 * 1. 使用 ETag 作为版本参数，确保对象更新后缩略图自动刷新
 * 2. imageView2/1 模式：等比缩放并居中裁剪，保证缩略图尺寸一致
 * 3. 输出 webp 格式，体积更小加载更快
 */
export function getThumbnailUrl(
  baseUrl: string,
  etag?: string,
  size: number = 280
): string {
  // CI 参数: imageMogr2 缩放 + webp 格式
  // /thumbnail/!{size}x{size}r = 等比缩放，短边优先
  const ciParams = `imageMogr2/thumbnail/${size}x${size}`
  
  // 清理 ETag 中的引号
  const cleanEtag = etag?.replace(/"/g, '') || ''
  
  // 构建 URL，ETag 作为版本参数确保缓存正确失效
  const separator = baseUrl.includes('?') ? '&' : '?'
  const versionParam = cleanEtag ? `&v=${cleanEtag}` : ''
  
  return `${baseUrl}${separator}${ciParams}${versionParam}`
}

/**
 * 根据文件类型获取图标名称
 */
export function getFileIconType(filename: string, isFolder: boolean): FileIconType {
  if (isFolder) return 'folder'
  
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  // 图片
  if (isImageFile(filename)) return 'image'
  
  // 视频
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video'
  
  // 音频
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio'
  
  // 文档
  if (['pdf'].includes(ext)) return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx'].includes(ext)) return 'excel'
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint'
  if (['txt', 'md', 'rtf'].includes(ext)) return 'text'
  
  // 代码
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h'].includes(ext)) return 'code'
  
  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive'
  
  return 'file'
}

export type FileIconType = 
  | 'folder' 
  | 'file' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'word' 
  | 'excel' 
  | 'powerpoint' 
  | 'text' 
  | 'code' 
  | 'archive'
