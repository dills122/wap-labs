export interface DownloadFile {
  filename: string;
  mimeType: string;
  payload: string;
}

export function downloadFile(file: DownloadFile): void {
  const blob = new Blob([file.payload], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
