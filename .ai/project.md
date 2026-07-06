# CosHub

腾讯云 COS（对象存储）的 Web 管理界面，部署在 EdgeOne Pages。面向个人或小团队用户，提供文件浏览、上传、删除和重命名功能。核心约束：前端是纯 SPA（HashRouter），后端分三层（Edge Functions / Middleware / Cloud Function），所有 COS SDK 操作必须在 Cloud Function 中完成，前端不能直接接触 COS 凭证。

## Language

使用中文（zh-CN）回应。

## Persistent memory

Shared facts live in `.ai/` files. Add or update via `/coshub-remember` or ask to "remember this." Agents propose saving stable conventions — confirm before writing.
