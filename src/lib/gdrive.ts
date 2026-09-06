import crypto from 'crypto';

const GDRIVE_SERVICE_KEY_RAW = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

export const GDRIVE_FOLDERS = {
  root: '1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ',
  images: '1utEwKBr03mDvY4wWSIp5uuwsH7h1TaSG',
  economics: '1aSL2fQ_HLmTEtcx2-DIV2zDyjM-5TXjq',
  geography: '1SywuSyNI3JdEqqqFOouFEUuRYjXh8Rs3',
  history: '1fwwz4-2U7iSwip2QZU7aasBOQQLD7v6Y',
  politics: '1dDC-wBctp0Eg39TNAQjQv1NGqb5PaQVA',
  science: '10-TTsK4xO7Zw-50Y4uZuWgOs9TsPlgwZ',
  sociology: '1BvPFtrTTD0gW0OYoqLFTZt5KezgCEhNC',
} as const;

function getServiceAccountKey() {
  if (GDRIVE_SERVICE_KEY_RAW) {
    try {
      return JSON.parse(GDRIVE_SERVICE_KEY_RAW);
    } catch {
      // ignore
    }
  }
  // Try local key file
  const localKeyPath = 'E:/books/upsc-engine-86befc48d3e9.json';
  if (typeof window === 'undefined') {
    try {
      const fsModule = require('fs');
      if (fsModule.existsSync(localKeyPath)) {
        return JSON.parse(fsModule.readFileSync(localKeyPath, 'utf8'));
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getDriveAccessToken(): Promise<string | null> {
  const key = getServiceAccountKey();
  if (!key || !key.client_email || !key.private_key) return null;

  try {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: key.token_uri || 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      })
    ).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(header + '.' + claimSet);
    const signature = sign.sign(key.private_key, 'base64url');

    const jwt = header + '.' + claimSet + '.' + signature;

    const res = await fetch(key.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt,
    });

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Failed to get Google Drive access token:', err);
    return null;
  }
}

export async function uploadImageToDrive(
  fileName: string,
  buffer: Buffer,
  mimeType: string = 'image/png'
): Promise<{ fileId: string; cdnUrl: string; previewUrl: string; viewUrl: string } | null> {
  const token = await getDriveAccessToken();
  if (!token) {
    console.error('Google Drive token unavailable');
    return null;
  }

  try {
    const metadata = {
      name: fileName,
      parents: [GDRIVE_FOLDERS.images],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelimiter = '\r\n--' + boundary + '--';

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' +
          mimeType +
          '\r\n\r\n'
      ),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartRequestBody,
    });

    const file = await res.json();
    if (!file || !file.id) {
      console.error('Google Drive upload failed:', file);
      return null;
    }

    // Set permission to anyone with link (public viewer)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
    } catch (permErr) {
      console.warn('Could not set public permission on file:', permErr);
    }

    const fileId = file.id;
    const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

    return { fileId, cdnUrl, previewUrl, viewUrl };
  } catch (err) {
    console.error('Google Drive upload exception:', err);
    return null;
  }
}
