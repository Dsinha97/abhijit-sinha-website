/**
 * Client-side CSV export.
 *
 * Two hazards handled here, both easy to miss:
 *
 * 1. **CSV injection.** A lead whose name is `=HYPERLINK("http://evil","click")`
 *    becomes a live formula when the export is opened in Excel. Prefixing an
 *    apostrophe to any cell starting with = + - @ tab or CR neutralises it.
 * 2. **Encoding.** Excel reads a BOM-less UTF-8 file as the local codepage,
 *    which mangles the rupee sign and any Devanagari in a message field.
 */

const RISKY_START = /^[=+\-@\t\r]/;

function cell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (RISKY_START.test(s)) s = `'${s}`;
  // RFC 4180: wrap in quotes and double any embedded quote.
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))];
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  // U+FEFF so Excel detects UTF-8.
  const blob = new Blob([`﻿${toCsv(headers, rows)}`], {
    type: 'text/csv;charset=utf-8',
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}
