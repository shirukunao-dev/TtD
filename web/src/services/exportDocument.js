import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

async function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function renderPdfPageToDataUrl(arrayBuffer, pageNum = 1, scale = 2) {
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
    pageCount: pdf.numPages,
  };
}

/**
 * Export image-backed documents (JPG/PNG) or single-page rasterized view.
 */
export async function exportAsPng(editorCanvas, fileName = 'signed-document.png') {
  const dataUrl = editorCanvas.toDataURL({ format: 'png', multiplier: 2 });
  downloadDataUrl(dataUrl, fileName);
}

export async function exportAsJpg(editorCanvas, fileName = 'signed-document.jpg') {
  const dataUrl = editorCanvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 2 });
  downloadDataUrl(dataUrl, fileName);
}

export async function exportAsPdfFromCanvas(editorCanvas, fileName = 'signed-document.pdf') {
  const dataUrl = editorCanvas.toDataURL({ format: 'png', multiplier: 2 });
  const img = await loadImageFromDataUrl(dataUrl);
  const pdf = new jsPDF({
    orientation: img.width > img.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [img.width, img.height],
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
  pdf.save(fileName);
}

export { renderPdfPageToDataUrl };

function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
