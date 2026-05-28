import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage } from 'fabric';
import { DOC_GUIDANCE, docxToHtml } from '../utils/docConvert.js';
import {
  exportAsJpg,
  exportAsPdfFromCanvas,
  exportAsPng,
  renderPdfPageToDataUrl,
} from '../services/exportDocument.js';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

/** @typedef {{ rx: number; ry: number; widthFrac?: number }} SigLayout */

export default function DocumentEditor({ signatureDataUrl }) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  /** @type {import('react').MutableRefObject<ArrayBuffer | null>} */
  const pdfBufferRef = useRef(null);

  const [docType, setDocType] = useState(null);
  const [docName, setDocName] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [docxHtml, setDocxHtml] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const initCanvas = useCallback((width, height) => {
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }
    const canvas = new Canvas(canvasElRef.current, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;
    setReady(true);
    return canvas;
  }, []);

  /** @returns {SigLayout | null} */
  const getSigLayout = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    const sig = canvas.getObjects().find((o) => o.name === 'signature');
    if (!sig) return null;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    if (!cw || !ch) return null;
    return {
      rx: sig.left / cw,
      ry: sig.top / ch,
      widthFrac: sig.getScaledWidth() / cw,
    };
  }, []);

  const placeSignature = useCallback(async (dataUrl, layout) => {
    const canvas = fabricRef.current;
    if (!canvas || !dataUrl) return;

    const existing = canvas.getObjects().find((o) => o.name === 'signature');
    if (existing) canvas.remove(existing);

    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const rx = layout?.rx ?? 0.55;
    const ry = layout?.ry ?? 0.75;
    const frac = typeof layout?.widthFrac === 'number' ? Math.min(layout.widthFrac, 0.55) : 0.35;

    img.set({
      name: 'signature',
      left: rx * cw,
      top: ry * ch,
      originX: 'center',
      originY: 'center',
    });

    const maxW = cw * frac;
    if (img.width > maxW) {
      img.scaleToWidth(maxW);
    }

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  }, []);

  const showRasterPageOnCanvas = useCallback(
    async (dataUrl, w, h, preserveSigLayout, existingSigUrl) => {
      const layoutKeep = preserveSigLayout ? getSigLayout() : null;
      let canvas = fabricRef.current;

      if (!canvas) {
        canvas = initCanvas(w, h);
      } else {
        canvas.setDimensions({ width: w, height: h });
        canvas.getObjects().filter((o) => o.name === 'background').forEach((o) => canvas.remove(o));
        canvas.getObjects().filter((o) => o.name === 'signature').forEach((o) => canvas.remove(o));
      }

      const bg = await FabricImage.fromURL(dataUrl);
      bg.set({ selectable: false, evented: false, name: 'background' });
      bg.scaleToWidth(w);
      bg.scaleToHeight(h);
      canvas.add(bg);
      canvas.sendObjectToBack(bg);

      if (existingSigUrl) {
        await placeSignature(existingSigUrl, layoutKeep ?? undefined);
      }
      canvas.requestRenderAll();
    },
    [getSigLayout, initCanvas, placeSignature],
  );

  const renderPdfPage = useCallback(
    async (buffer, pageNum, preserveSigLayout, sigUrl) => {
      const { dataUrl, width, height, pageCount } = await renderPdfPageToDataUrl(buffer, pageNum, 1.5);
      const maxW = Math.min(900, window.innerWidth - 80);
      const scale = maxW / width;
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      setPdfPageCount(pageCount);
      setPdfPage(pageNum);

      await showRasterPageOnCanvas(dataUrl, w, h, preserveSigLayout, sigUrl);
    },
    [showRasterPageOnCanvas],
  );

  const loadPdfDocument = useCallback(
    async (file) => {
      const buffer = await file.arrayBuffer();
      pdfBufferRef.current = buffer.slice(0);
      setDocType('pdf');
      setDocName(file.name);
      await renderPdfPage(pdfBufferRef.current, 1, false, null);
    },
    [renderPdfPage],
  );

  const goToPdfPage = useCallback(
    async (pageNum) => {
      const buf = pdfBufferRef.current;
      if (!buf || docType !== 'pdf' || pageNum < 1) return;
      const maxP = pdfPageCount || 1;
      const p = Math.min(pageNum, maxP);
      await renderPdfPage(buf, p, true, signatureDataUrl ?? null);
    },
    [docType, pdfPageCount, renderPdfPage, signatureDataUrl],
  );

  const loadImageDocument = useCallback(
    async (file) => {
      pdfBufferRef.current = null;
      setPdfPageCount(0);
      setPdfPage(1);

      const dataUrl = await readFileAsDataUrl(file);
      const imgEl = await loadHtmlImage(dataUrl);
      const maxW = Math.min(900, window.innerWidth - 80);
      const scale = maxW / imgEl.width;
      const w = Math.round(imgEl.width * scale);
      const h = Math.round(imgEl.height * scale);

      setDocType('image');
      setDocName(file.name);
      await showRasterPageOnCanvas(dataUrl, w, h, false, null);
    },
    [showRasterPageOnCanvas],
  );

  const loadDocxDocument = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const html = await docxToHtml(buffer);
    setDocxHtml(html);
    setDocType('docx');
    setDocName(file.name);
    setReady(false);
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setDocxHtml(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'pdf') await loadPdfDocument(file);
      else if (['jpg', 'jpeg', 'png'].includes(ext)) await loadImageDocument(file);
      else if (ext === 'docx') await loadDocxDocument(file);
      else if (ext === 'doc') {
        setError(DOC_GUIDANCE);
        setDocType('doc');
      } else {
        setError('Unsupported file type.');
      }
    } catch (e) {
      setError(e.message || 'Failed to load document');
    }
  }, [loadPdfDocument, loadImageDocument, loadDocxDocument]);

  const resetAndPickDocument = useCallback(() => {
    fabricRef.current?.dispose();
    fabricRef.current = null;
    pdfBufferRef.current = null;
    setReady(false);
    setDocType(null);
    setDocName('');
    setPdfPageCount(0);
    setPdfPage(1);
    setDocxHtml(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    queueMicrotask(() => fileInputRef.current?.click());
  }, []);

  useEffect(() => {
    if (signatureDataUrl && ready && docType !== 'docx') {
      placeSignature(signatureDataUrl);
    }
  }, [signatureDataUrl, ready, docType, placeSignature]);

  useEffect(() => () => {
    fabricRef.current?.dispose();
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const exportBaseName = useCallback(() => {
    let base = (docName || 'document').replace(/[/\\]+$/, '');
    const m = base.match(/^(.+)(\.[^.]+)$/);
    if (m) base = m[1];
    if (docType === 'pdf' && pdfPageCount > 0) base += `-p${pdfPage}`;
    return base;
  }, [docName, docType, pdfPage, pdfPageCount]);

  const handleExportPng = () => {
    if (!fabricRef.current) return;
    exportAsPng(fabricRef.current, `signed-${exportBaseName()}.png`);
  };

  const handleExportJpg = () => {
    if (!fabricRef.current) return;
    exportAsJpg(fabricRef.current, `signed-${exportBaseName()}.jpg`);
  };

  const handleExportPdf = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      await exportAsPdfFromCanvas(canvas, `signed-${exportBaseName()}.pdf`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="main">
      <div className="toolbar">
        <span>
          {docName
            ? `Document: ${docName}${docType === 'pdf' && pdfPageCount > 0 ? ` · Page ${pdfPage} of ${pdfPageCount}` : ''}`
            : 'No document loaded'}
        </span>
        {ready && docType !== 'docx' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={handleExportPng}>
              Export PNG
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleExportJpg}>
              Export JPG
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportPdf}>
              Export PDF
            </button>
          </>
        )}
        {docType === 'pdf' && ready && pdfPageCount > 1 && (
          <>
            <label htmlFor="pdf-page" style={{ margin: 0 }}>
              PDF page:
            </label>
            <select
              id="pdf-page"
              value={pdfPage}
              onChange={(e) => {
                void goToPdfPage(Number(e.target.value));
              }}
              className="btn btn-secondary"
              style={{ cursor: 'pointer', padding: '0.55rem 0.75rem' }}
            >
              {Array.from({ length: pdfPageCount }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!(ready || docxHtml)}
          onClick={() => resetAndPickDocument()}
        >
          Change document
        </button>
      </div>

      <div className="editor-wrap" ref={containerRef}>
        {!ready && !docxHtml && (
          <label
            className="upload-zone"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('dragover');
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              data-reset-file-input
              accept={ACCEPT}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <p><strong>Drop a document</strong> or click to upload</p>
            <p>Multi-page PDF: choose page in toolbar · JPG, PNG · DOCX preview</p>
          </label>
        )}

        {error && <div className="alert">{error}</div>}

        {docxHtml && (
          <div className="doc-preview-html">
            <h2>DOCX preview (approximate layout)</h2>
            <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
            <p className="alert" style={{ marginTop: '1rem' }}>
              {DOC_GUIDANCE}
            </p>
          </div>
        )}

        {(ready || docType === 'image' || docType === 'pdf') && (
          <div className="canvas-container" style={{ display: ready ? 'block' : 'none' }}>
            <canvas ref={canvasElRef} />
          </div>
        )}

        {ready && !signatureDataUrl && (
          <p className="empty-state">
            Waiting for signature from the mobile app. Draw on your phone and tap Send to PC.
          </p>
        )}
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
