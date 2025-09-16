import type { NextApiRequest, NextApiResponse } from 'next';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

type Data = { url: string } | { error: string };

const CONTAINER_NAME = 'videos';

function parseConnectionString(connStr: string): { accountName: string; accountKey: string } | null {
  try {
    const parts = Object.fromEntries(
      connStr
        .split(';')
        .map((kv) => kv.trim())
        .filter(Boolean)
        .map((kv) => {
          const idx = kv.indexOf('=');
          return idx === -1 ? [kv, ''] : [kv.slice(0, idx), kv.slice(idx + 1)];
        })
    ) as any;
    const accountName = parts.AccountName || parts.accountname;
    const accountKey = parts.AccountKey || parts.accountkey;
    if (!accountName || !accountKey) return null;
    return { accountName, accountKey };
  } catch {
    return null;
  }
}

function encodeBlobPath(blobName: string): string {
  return blobName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function validateBlobName(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  const name = input.trim();
  if (name.includes('..')) return null; // prevent path traversal-like patterns
  return name;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    let accountName = process.env.AZURE_STORAGE_ACCOUNT || process.env.AZURE_STORAGE_ACCOUNT_NAME;
    let accountKey = process.env.AZURE_STORAGE_KEY || process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if ((!accountName || !accountKey) && connStr) {
      const parsed = parseConnectionString(connStr);
      if (parsed) {
        accountName = parsed.accountName;
        accountKey = parsed.accountKey;
      }
    }

    if (!accountName || !accountKey) {
      return res.status(500).json({ error: 'Storage is not configured on the server.' });
    }

    const blobNameRaw = Array.isArray(req.query.blobName)
      ? req.query.blobName[0]
      : req.query.blobName;

    const blobName = validateBlobName(blobNameRaw);
    if (!blobName) {
      return res.status(400).json({ error: 'Missing or invalid blobName' });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const now = Date.now();
    const startsOn = new Date(now - 5 * 60 * 1000); // 5 minutes ago to avoid clock skew
    const expiresOn = new Date(now + 60 * 60 * 1000); // 1 hour from now

    const sas = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // read-only
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential
    ).toString();

    const encodedBlobPath = encodeBlobPath(blobName);
    const url = `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${encodedBlobPath}?${sas}`;

    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
}
