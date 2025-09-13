// Import JS module without TypeScript types (ambient declarations added)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = require('@azure/storage-blob');
import { extname } from 'path';
import { createReadStream } from 'fs';

let blobServiceClient: any = null;

function getBlobServiceClient() {
  if (blobServiceClient) return blobServiceClient;
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING env var required');
  blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  return blobServiceClient;
}

export async function uploadToAzureBlob(filePath: string, blobName: string, containerName = 'videos'): Promise<string> {
  const client = getBlobServiceClient();
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();
  if (!blobName.includes('.')) {
    // naive ensure extension
    blobName += extname(filePath) || '.mp4';
  }
  const blockBlob = container.getBlockBlobClient(blobName);
  const stream = createReadStream(filePath);
  await blockBlob.uploadStream(stream, 4 * 1024 * 1024, 5, { blobHTTPHeaders: { blobContentType: 'video/mp4' } });
  return blockBlob.name; // return just the blob name; caller can build SAS URL
}

export function generateSASUrl(blobName: string, expiryMinutes = 60, containerName = 'videos'): string {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountName || !accountKey) throw new Error('AZURE_STORAGE_ACCOUNT_NAME & AZURE_STORAGE_ACCOUNT_KEY required');
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const sas = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(Date.now() - 5 * 60 * 1000),
    expiresOn,
    protocol: SASProtocol.Https,
  }, sharedKeyCredential).toString();
  return `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sas}`;
}
