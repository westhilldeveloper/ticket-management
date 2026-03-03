import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload file to Cloudinary
 * @param {File} file - The file to upload (from FormData)
 * @param {string} folder - Folder name in Cloudinary (e.g., 'tickets')
 * @returns {Promise<{success: boolean, url?: string, publicId?: string, error?: string}>}
 */
export async function uploadToCloudinary(file, folder = 'tickets') {
  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using upload_stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto', // Automatically detect file type
          public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      // Write buffer to stream
      uploadStream.end(buffer)
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    }
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return {
      success: result.result === 'ok',
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete file',
    }
  }
}

/**
 * Get optimized URL for Cloudinary image
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  const { width, height, crop = 'fill', quality = 'auto' } = options
  
  let transformation = ''
  if (width) transformation += `w_${width},`
  if (height) transformation += `h_${height},`
  transformation += `c_${crop},q_${quality}`
  
  return cloudinary.url(publicId, {
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    secure: true,
  })
}