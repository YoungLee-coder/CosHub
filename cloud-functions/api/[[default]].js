import express from 'express'
import COS from 'cos-nodejs-sdk-v5'

const app = express()
app.use(express.json())

function createCosClient() {
  return new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  })
}

function getRegion() {
  return process.env.COS_REGION || 'ap-guangzhou'
}

function successRes(res, data) {
  res.json({ success: true, data, error: null })
}

function errorRes(res, status, message) {
  res.status(status).json({ success: false, data: null, error: message })
}

app.get('/cos/buckets', async (_req, res) => {
  try {
    const cos = createCosClient()
    const result = await new Promise((resolve, reject) => {
      cos.getService({}, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
    const buckets = (result.Buckets || []).map((b) => ({
      Name: b.Name,
      Location: b.Location,
      CreationDate: b.CreationDate,
    }))
    successRes(res, buckets)
  } catch {
    errorRes(res, 500, '获取桶列表失败')
  }
})

app.get('/cos/cdn-domain', (_req, res) => {
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''
  successRes(res, { domain: cdnDomain })
})

app.get('/cos/objects', async (req, res) => {
  const { bucket, prefix } = req.query

  if (!bucket) {
    return errorRes(res, 400, 'Bucket is required')
  }

  try {
    const cos = createCosClient()
    const region = getRegion()
    const result = await new Promise((resolve, reject) => {
      cos.getBucket(
        {
          Bucket: bucket,
          Region: region,
          Prefix: prefix || '',
          Delimiter: '/',
          MaxKeys: 1000,
        },
        (err, data) => {
          if (err) reject(err)
          else resolve(data)
        }
      )
    })

    const files = (result.Contents || [])
      .filter((item) => item.Key !== (prefix || ''))
      .map((item) => ({
        Key: item.Key,
        LastModified: item.LastModified,
        Size: Number(item.Size) || 0,
        ETag: item.ETag,
        isFolder: item.Key.endsWith('/'),
      }))

    const folders = (result.CommonPrefixes || []).map((item) => ({
      Prefix: item.Prefix,
    }))

    successRes(res, { files, folders })
  } catch {
    errorRes(res, 500, 'Failed to list objects')
  }
})

app.delete('/cos/objects', async (req, res) => {
  const { bucket, keys } = req.body

  if (!bucket || !keys || !Array.isArray(keys) || keys.length === 0) {
    return errorRes(res, 400, 'Invalid request')
  }

  try {
    const cos = createCosClient()
    const region = getRegion()

    if (keys.length === 1) {
      await new Promise((resolve, reject) => {
        cos.deleteObject(
          { Bucket: bucket, Region: region, Key: keys[0] },
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    } else {
      await new Promise((resolve, reject) => {
        cos.deleteMultipleObject(
          {
            Bucket: bucket,
            Region: region,
            Objects: keys.map((key) => ({ Key: key })),
          },
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    successRes(res, { success: true })
  } catch {
    errorRes(res, 500, 'Failed to delete')
  }
})

app.put('/cos/objects', async (req, res) => {
  const { bucket, oldKey, newKey } = req.body

  if (!bucket || !oldKey || !newKey) {
    return errorRes(res, 400, 'Invalid request')
  }

  try {
    const cos = createCosClient()
    const region = getRegion()

    await new Promise((resolve, reject) => {
      cos.putObjectCopy(
        {
          Bucket: bucket,
          Region: region,
          Key: newKey,
          CopySource: `${bucket}.cos.${region}.myqcloud.com/${encodeURIComponent(oldKey)}`,
        },
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    await new Promise((resolve, reject) => {
      cos.deleteObject(
        { Bucket: bucket, Region: region, Key: oldKey },
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    successRes(res, { success: true })
  } catch {
    errorRes(res, 500, 'Failed to rename')
  }
})

app.post('/cos/objects', async (req, res) => {
  const { bucket, path } = req.body

  if (!bucket || !path) {
    return errorRes(res, 400, 'Invalid request')
  }

  try {
    const cos = createCosClient()
    const region = getRegion()
    const key = path.endsWith('/') ? path : `${path}/`

    await new Promise((resolve, reject) => {
      cos.putObject(
        { Bucket: bucket, Region: region, Key: key, Body: '' },
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    successRes(res, { success: true })
  } catch {
    errorRes(res, 500, 'Failed to create folder')
  }
})

app.get('/cos/url', async (req, res) => {
  const { bucket, key, method } = req.query

  if (!bucket || !key) {
    return errorRes(res, 400, 'Bucket and key are required')
  }

  try {
    const cos = createCosClient()
    const region = getRegion()

    const url = await new Promise((resolve, reject) => {
      cos.getObjectUrl(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Method: method || 'GET',
          Expires: 3600,
          Sign: true,
        },
        (err, data) => {
          if (err) reject(err)
          else resolve(data.Url)
        }
      )
    })

    successRes(res, { url })
  } catch {
    errorRes(res, 500, 'Failed to get URL')
  }
})

app.post('/cos/url', (req, res) => {
  const { key } = req.body

  let cdnDomain = process.env.COS_CDN_DOMAIN || ''
  if (cdnDomain && !cdnDomain.startsWith('http')) {
    cdnDomain = `https://${cdnDomain}`
  }

  if (!cdnDomain || !key) {
    return successRes(res, { url: '' })
  }

  const url = cdnDomain.endsWith('/')
    ? `${cdnDomain}${encodeURIComponent(key)}`
    : `${cdnDomain}/${encodeURIComponent(key)}`

  successRes(res, { url })
})

export default app