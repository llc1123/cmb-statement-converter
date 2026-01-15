export interface Transaction {
  originalIndex: number // 1-based index from the original file order
  transDate: string
  postDate: string
  description: string
  amountRMB: number
  cardLastFour: string
  originalAmount: number | null
}

export interface ParsedResult {
  headers: string[]
  transactions: Transaction[]
}

export function parseCMBStatement(lines: string[]): ParsedResult {
  const transactions: Transaction[] = []
  let headers: string[] = [
    '交易日',
    '记账日',
    '交易摘要',
    '人民币金额',
    '卡号末四位',
    '交易地金额',
  ] // Default

  // Regex for date: MM/DD
  const dateRegex = /^\d{2}\/\d{2}$/
  const amountRegex = /^-?[\d,]+\.\d{2}$/

  // Attempt to find header line
  // Layout usually has: 交易日 记账日 交易摘要 人民币金额 卡号末四位 交易地金额
  const headerKeywords = [
    '交易日',
    '记账日',
    '交易摘要',
    '人民币金额',
    '卡号末四位',
    '交易地金额',
  ]

  // detect year
  let referenceYear = new Date().getFullYear()
  let referenceMonth = new Date().getMonth() + 1

  // Sweep first 50 lines for a date pattern like YYYY/MM/DD or YYYY年MM月
  // CMB usually has "2024/01/05" or "2024年01月" as statement date
  const yearRegex = /(20\d{2})[/\u4e00-\u9fa5](\d{1,2})/
  for (let j = 0; j < Math.min(lines.length, 50); j++) {
    const match = lines[j].match(yearRegex)
    if (match) {
      referenceYear = parseInt(match[1], 10)
      referenceMonth = parseInt(match[2], 10)
      break
    }
  }

  // Helper to format date with year
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('/')
    if (parts.length !== 2) return dateStr

    const month = parseInt(parts[0], 10)
    // const day = parseInt(parts[1], 10)

    let year = referenceYear
    // Cross-year logic:
    // If statement is Jan 2024, and trans is Dec, it's Dec 2023.
    // If statement is Dec 2023, and trans is Jan, it's Jan 2024 (unlikely for statement ending in Dec, but possible for range)
    // Heuristic: If transMonth > referenceMonth + 6, assume previous year
    // If transMonth < referenceMonth - 6, assume next year (rare)
    if (month > referenceMonth + 2) {
      // e.g. Ref=Jan(1), Trans=Dec(12) -> Diff -11. Trans >>> Ref.
      // e.g. Ref=Feb(2), Trans=Dec(12)
      year--
    } else if (month < referenceMonth - 2 && referenceMonth > 10) {
      // Ref=Dec, Trans=Jan.
      year++
    }

    // Pad month/day
    // part[0] is month, part[1] is day. strict 2 digits are already enforced by regex \d{2} but good to be safe
    return `${year}-${parts[0]}-${parts[1]}`
  }

  let i = 0
  while (i < lines.length) {
    // const line = lines[i].trim() // Unused now that we look ahead

    // Header extraction (simple check if line contains multiple keywords or sequence)
    // Since pdfjs extracts lines, we might find them in sequence or separate.
    // Based on previous analysis, they were on separate lines:
    // 42: 交易日
    // 44: 记账日 ...
    // We will stick to defaults if we can't robustly detect a block, but let's try to detect existence.
    // Actually, for now, let's keep defaults but allow override if we find specific English/Chinese mapped headers.

    // Look for transaction block
    // Anchor Strategy: Search for Card Number (4 digits) and Amount (preceding it)
    // This is more robust against missing Date lines.
    if (/^\d{4}$/.test(lines[i])) {
      const cardLastFour = lines[i]
      const amountIndex = i - 1

      if (amountIndex >= 0 && amountRegex.test(lines[amountIndex])) {
        const amountStr = lines[amountIndex]
        const descriptionIndex = i - 2

        // Description is likely i-2
        if (descriptionIndex >= 0) {
          const description = lines[descriptionIndex]

          // Now try to find dates before Description
          // We look at i-3 (Post?) and i-4 (Trans?)
          let transDate = ''
          let postDate = ''

          const candidate1 = i - 3 >= 0 ? lines[i - 3] : ''
          const candidate2 = i - 4 >= 0 ? lines[i - 4] : ''

          if (dateRegex.test(candidate1)) {
            // i-3 is a date.
            // Check i-4
            if (dateRegex.test(candidate2)) {
              // Both are dates. candidate2=Trans, candidate1=Post
              transDate = candidate2
              postDate = candidate1
            } else {
              // Only i-3 is a date.
              // User feedback: For "Automatic Repayment" (自动还款), this is the Post Date.
              if (
                description.includes('自动还款') ||
                description.includes('Automatic Repayment')
              ) {
                postDate = candidate1
                transDate = ''
              } else {
                // Default to Trans Date for others
                transDate = candidate1
              }
            }
          }
          // If neither are dates, both stay empty (User requested support for this)

          // Now look for Original Amount AFTER Card (i+1)
          let originalAmount: number | null = null
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1]
            // If next line matches amount regex, AND it is NOT a Date (start of next block)
            // limit strictness to avoid consuming next transaction's amount if checks fail
            if (amountRegex.test(nextLine) && !dateRegex.test(nextLine)) {
              originalAmount = parseAmount(nextLine)
              // Consumed i+1
              // But wait, if we consume i+1, we loop continues.
              // We shouldn't double process.
              // The loop increments i. We need to be careful.
            }
          }

          transactions.push({
            originalIndex: transactions.length + 1,
            transDate: formatDate(transDate),
            postDate: formatDate(postDate),
            description,
            amountRMB: parseAmount(amountStr),
            cardLastFour,
            originalAmount: originalAmount,
          })
        }
      }
    }
    i++
  }

  // If we have transactions at all, we assume success.
  // The user asked for "headers from file".
  // In the PDF sample output:
  // 42: 交易日
  // 44: 记账日
  // 46: 交易摘要
  // 48: 人民币金额
  // 50: 卡号末四位
  // 52: 交易地金额
  // We can try to capture these if they appear before any transaction.
  // Let's sweep for them.
  const foundHeaders: string[] = []
  for (const k of headerKeywords) {
    if (lines.some((l) => l.includes(k))) {
      foundHeaders.push(k)
    }
  }

  if (foundHeaders.length === 6) {
    headers = foundHeaders
  }

  return { headers, transactions }
}

function parseAmount(str: string): number {
  return parseFloat(str.replace(/,/g, ''))
}
