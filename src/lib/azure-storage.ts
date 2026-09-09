import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'images';

let _blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient | null {
  if (_blobServiceClient) return _blobServiceClient;
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING || connectionString;
  if (!connStr) {
    console.warn('Azure Storage connection string not configured');
    return null;
  }
  try {
    _blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    return _blobServiceClient;
  } catch (err) {
    console.error('Failed to initialize Azure Blob Service Client:', err);
    return null;
  }
}

/**
 * Upload an image buffer directly to Azure Blob Storage
 * Returns the public CDN / Blob URL or null if failed
 */
export async function uploadImageToAzure(
  fileName: string,
  buffer: Buffer,
  mimeType: string = 'image/png'
): Promise<string | null> {
  const serviceClient = getBlobServiceClient();
  if (!serviceClient) return null;

  try {
    const containerClient = serviceClient.getContainerClient(containerName);

    // Auto-create container with public blob read access if it doesn't exist
    try {
      await containerClient.createIfNotExists({
        access: 'blob',
      });
    } catch (createErr) {
      // Container may already exist, ignore
    }

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=31536000, immutable',
      },
    });

    console.log(`[Azure Storage] Successfully uploaded ${fileName} to: ${blockBlobClient.url}`);
    return blockBlobClient.url;
  } catch (err: any) {
    console.error('[Azure Storage] Upload failed:', err?.message || err);
    return null;
  }
}
