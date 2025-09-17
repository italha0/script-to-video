import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSASUrl } from '@/lib/azure-blob';

type Data = { url: string } | { error: string };

function validateBlobName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const name = input.trim();
  if (!name || name.includes('..')) return null;
  return name;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  try {
    const raw = Array.isArray(req.query.blobName) ? req.query.blobName[0] : req.query.blobName;
    const blobName = validateBlobName(raw);
    if (!blobName) return res.status(400).json({ error: 'Missing or invalid blobName' });

    // Optional exp minutes
    const expRaw = Array.isArray(req.query.exp) ? req.query.exp[0] : req.query.exp;
    let expiryMinutes = 60;
    if (typeof expRaw === 'string') {
      const n = Number(expRaw);
      if (Number.isFinite(n)) expiryMinutes = Math.min(1440, Math.max(1, Math.trunc(n)));
    }

    const url = generateSASUrl(blobName, expiryMinutes);
    return res.status(200).json({ url });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to generate download URL' });
  }
}
