const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { extname } = require('path');
const { createReadStream } = require('fs');
let blobServiceClient = null;
function getBlobServiceClient(){
  if (blobServiceClient) return blobServiceClient;
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error('AZURE_STORAGE_CONNECTION_STRING required');
  blobServiceClient = BlobServiceClient.fromConnectionString(conn);
  return blobServiceClient;
}
async function uploadToAzureBlob(filePath, blobName, containerName='videos') {
  const client = getBlobServiceClient();
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();
  if (!blobName.includes('.')) blobName += extname(filePath) || '.mp4';
  const block = container.getBlockBlobClient(blobName);
  await block.uploadStream(createReadStream(filePath), 4*1024*1024, 5, { blobHTTPHeaders:{ blobContentType:'video/mp4' }});
  return block.name;
}
function generateSASUrl(blobName, expiryMinutes=60, containerName='videos') {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountName || !accountKey) throw new Error('AZURE_STORAGE_ACCOUNT_NAME & AZURE_STORAGE_ACCOUNT_KEY required');
  const cred = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const sas = generateBlobSASQueryParameters({ containerName, blobName, permissions: BlobSASPermissions.parse('r'), startsOn: new Date(Date.now()-5*60*1000), expiresOn, protocol: SASProtocol.Https }, cred).toString();
  return `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sas}`;
}
module.exports = { uploadToAzureBlob, generateSASUrl };
