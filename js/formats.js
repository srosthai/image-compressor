import { PDFDocument } from 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js';
import { zipSync, unzipSync } from 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js';
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';

const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

const PAGE_LIMIT = 30;

function userError(message) {
    const error = new Error(message);
    error.userFacing = true;
    return error;
}

function pdfSettings(quality) {
    if (quality >= 0.85) return { scale: 1.35, jpeg: quality };
    if (quality >= 0.65) return { scale: 1.05, jpeg: quality };
    return { scale: 0.8, jpeg: Math.max(quality, 0.4) };
}

function zipLevel(quality) {
    if (quality >= 0.85) return 3;
    if (quality >= 0.65) return 6;
    return 9;
}

function canvasToJpeg(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) reject(userError('A PDF page could not be compressed.'));
            else resolve(blob);
        }, 'image/jpeg', quality);
    });
}

async function compressPdf(file, quality) {
    const settings = pdfSettings(quality);
    const data = new Uint8Array(await file.arrayBuffer());
    let source;

    try {
        source = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
    } catch (error) {
        if (error && error.name === 'PasswordException') {
            throw userError('This PDF is password protected. Remove the password, then compress it.');
        }
        throw userError('That PDF could not be read.');
    }

    if (source.numPages > PAGE_LIMIT) {
        throw userError(`This PDF has ${source.numPages} pages. Split it into ${PAGE_LIMIT} pages or fewer, then compress each part.`);
    }

    const output = await PDFDocument.create();

    for (let index = 1; index <= source.numPages; index += 1) {
        const page = await source.getPage(index);
        const base = page.getViewport({ scale: 1 });
        let scale = settings.scale;
        if (base.width * scale > 1800) scale = 1800 / base.width;

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await canvasToJpeg(canvas, settings.jpeg);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const image = await output.embedJpg(bytes);
        const pdfPage = output.addPage([canvas.width, canvas.height]);
        pdfPage.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height });
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
    }

    const saved = await output.save();
    const name = file.name.replace(/\.pdf$/i, '') || 'document';
    return {
        file: new File([saved], `compressed-${name}.pdf`, { type: 'application/pdf' }),
        note: 'Pages were rebuilt as images at the quality you chose.'
    };
}

function compressOffice(file, quality) {
    return file.arrayBuffer().then((buffer) => {
        const input = new Uint8Array(buffer);
        let entries;
        try {
            entries = unzipSync(input);
        } catch (error) {
            throw userError('That document could not be read. Use an XLSX, DOCX, or PPTX file.');
        }

        const packed = zipSync(entries, { level: zipLevel(quality) });
        if (packed.byteLength >= input.byteLength) {
            return {
                file,
                note: 'This file is already tightly packed.'
            };
        }

        return {
            file: new File([packed], `compressed-${file.name}`, {
                type: file.type || 'application/octet-stream'
            }),
            note: 'The package inside the file was repacked.'
        };
    });
}

function compressData(file, quality) {
    return file.arrayBuffer().then((buffer) => {
        const input = new Uint8Array(buffer);
        const packed = zipSync({ [file.name]: input }, { level: zipLevel(quality) });
        return {
            file: new File([packed], `${file.name}.zip`, { type: 'application/zip' }),
            note: 'Packed into a zip archive.'
        };
    });
}

window.fileTools = {
    compress(file, quality) {
        const name = file.name.toLowerCase();
        if (file.type === 'application/pdf' || name.endsWith('.pdf')) return compressPdf(file, quality);
        if (/\.(xlsx|docx|pptx)$/.test(name)) return compressOffice(file, quality);
        if (/\.(xls|csv|txt|json|xml|svg|html?|md)$/.test(name)) return compressData(file, quality);
        throw userError('Choose an image, PDF, spreadsheet, document, or text file.');
    }
};
