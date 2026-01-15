import { utils } from 'xlsx'
import type { Transaction } from './cmbParser'

// Helper to map transaction to localized object
function mapTransactions(transactions: Transaction[], headers?: string[]) {
  if (!headers || headers.length !== 6) return transactions

  return transactions.map((t) => ({
    [headers[0]]: t.transDate,
    [headers[1]]: t.postDate,
    [headers[2]]: t.description,
    [headers[3]]: t.amountRMB,
    [headers[4]]: t.cardLastFour,
    [headers[5]]: t.originalAmount,
  }))
}

export function exportToCSV(
  transactions: Transaction[],
  filename = 'transactions.csv',
  headers?: string[],
) {
  const data = mapTransactions(transactions, headers)
  const ws = utils.json_to_sheet(data)
  const csv = utils.sheet_to_csv(ws)

  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF'
  const csvContent = BOM + csv

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
