const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { extname } = require('path');
const { createReadStream } = require('fs');

let blobServiceClient = null;

function getBlobServiceClient() {
  if (blobServiceClient) return blobServiceClient;
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING env var required');
  blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  return blobServiceClient;
}

async function uploadToAzureBlob(filePath, blobName, containerName = 'videos') {
  const client = getBlobServiceClient();
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();
  if (!blobName.includes('.')) {
    blobName += extname(filePath) || '.mp4';
  }
  const blockBlob = container.getBlockBlobClient(blobName);
  const stream = createReadStream(filePath);
  await blockBlob.uploadStream(stream, 4 * 1024 * 1024, 5, { blobHTTPHeaders: { blobContentType: 'video/mp4' } });
  return blockBlob.name;
}

function generateSASUrl(blobName, expiryMinutes = 60, containerName = 'videos') {
  // Prefer deriving from connection string to keep credentials consistent
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  let accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  let accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (connStr) {
    try {
      const parts = Object.fromEntries(connStr.split(';').map((kv) => kv.trim()).filter(Boolean).map((kv) => { const idx = kv.indexOf('='); return idx === -1 ? [kv, ''] : [kv.slice(0, idx), kv.slice(idx + 1)]; }));
      accountName = parts.AccountName || parts.accountname || accountName;
      accountKey = parts.AccountKey || parts.accountkey || accountKey;
    } catch {}
  }
  if (!accountName || !accountKey) throw new Error('AZURE storage credentials required (set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY)');
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

module.exports = { uploadToAzureBlob, generateSASUrl };