export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
}

/**
 * Uploads a text file (CSV/JSON) to Google Drive.
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = "text/csv"
): Promise<{ id: string; name: string }> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload file to Google Drive: ${errText}`);
  }

  return await response.json();
}

/**
 * Lists CSV, JSON and general product scout files in the user's Google Drive.
 */
export async function listDriveFiles(accessToken: string): Promise<DriveFile[]> {
  const query = "trashed = false and (mimeType = 'text/csv' or mimeType = 'application/json' or name contains 'scout')";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list files from Google Drive: ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads a file's content as a raw string.
 */
export async function downloadFileContent(accessToken: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download Google Drive file: ${errText}`);
  }

  return await response.text();
}

/**
 * Deletes a file from Google Drive.
 * (MANDATORY: Make sure to request user confirmation in the UI before calling this!)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to delete Google Drive file: ${errText}`);
  }

  return true;
}
