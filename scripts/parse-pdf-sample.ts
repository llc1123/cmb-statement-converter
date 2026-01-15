import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Point to the local legacy worker file
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'pdfjs-dist/legacy/build/pdf.worker.mjs'

async function run() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const pdfPath = path.resolve(
    __dirname,
    '../pdf/CreditCardReckoning2025-11.pdf',
  )
  console.log(`Reading PDF from: ${pdfPath}`)

  const buffer = fs.readFileSync(pdfPath)
  const data = new Uint8Array(buffer)

  const loadingTask = pdfjsLib.getDocument({
    data: data,
    // Standard font map for standard fonts
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
    disableFontFace: true, // sometimes helpful in node envs
  })

  try {
    const doc = await loadingTask.promise
    console.log(`PDF loaded. Pages: ${doc.numPages}`)

    let _fullText = ''

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()

      console.log(`--- Page ${i} ---`)
      // biome-ignore lint/suspicious/noExplicitAny: PDF.js textContent items are loose types
      const strings = textContent.items.map((item: any) => item.str)

      // DEBUG: Find the context of "自动还款"
      strings.forEach((str: string, index: number) => {
        if (str.includes('自动还款') || str.includes('NaN')) {
          console.log(`[DEBUG FOUND] "${str}" at index ${index}`)
          // Print surrounding context
          console.log(
            'Context:',
            strings.slice(Math.max(0, index - 5), index + 10),
          )
        }
      })

      const pageText = strings.join('\n') // Join with newline to see structure
      console.log(pageText)
      _fullText += `${pageText}\n`
    }
  } catch (e) {
    console.error('Error parsing PDF:', e)
  }
}

run()
