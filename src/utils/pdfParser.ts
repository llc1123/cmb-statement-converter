import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/', // Use CDN for CMaps or local if copied
    cMapPacked: true,
  })

  const doc = await loadingTask.promise
  const allText: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    // Extract strings and join them distinctively
    // We filter out empty strings to reduce noise, but keep structure
    const pageStrings = (textContent.items as TextItem[])
      .map((item) => item.str)
      .filter((str: string) => str.trim().length > 0)

    allText.push(...pageStrings)
  }

  return allText
}
