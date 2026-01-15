import {
  Button,
  Classes,
  FocusStyleManager,
  Intent,
  OverlayToaster,
} from '@blueprintjs/core'
import { useEffect, useState } from 'react'
import { Header } from './components/Header'

const showbsToaster = await OverlayToaster.create({
  position: 'top',
})

import { FileUpload } from './components/FileUpload'
import { TransactionTable } from './components/TransactionTable'
import type { Transaction } from './utils/cmbParser'
import { parseCMBStatement } from './utils/cmbParser'
import { exportToCSV } from './utils/exportUtils'
import { extractTextFromPDF } from './utils/pdfParser'
import './index.css'

FocusStyleManager.onlyShowFocusOnTabs()

function App() {
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.body.classList.add(Classes.DARK)
      document.body.style.backgroundColor = '#10161a' // Better dark bg
    } else {
      document.body.classList.remove(Classes.DARK)
      document.body.style.backgroundColor = '#f6f8fa' // Better light bg
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleDark = () => setIsDark(!isDark)

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    try {
      if (file.type !== 'application/pdf') {
        throw new Error('无效的文件类型，请上传 PDF 文件。')
      }

      const lines = await extractTextFromPDF(file)
      if (lines.length === 0) {
        throw new Error('PDF 中未找到文本，可能是图片格式的 PDF。')
      }

      const parsed = parseCMBStatement(lines)
      if (parsed.transactions.length === 0) {
        throw new Error('未找到交易记录，请检查是否为有效的招商银行对账单。')
      }

      setTransactions(parsed.transactions)
      setHeaders(parsed.headers)
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : '解析 PDF 失败'
      showbsToaster.show({
        message,
        intent: 'danger',
        icon: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="app-container"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Header isDark={isDark} toggleDark={toggleDark} />

      <main
        style={{
          flex: 1,
          padding: '20px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: transactions.length === 0 ? 'center' : 'flex-start',
          alignItems: 'center', // Add this to horizontally center the child
        }}
      >
        {transactions.length === 0 ? (
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              maxWidth: '1200px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 className={Classes.HEADING}>
                已解析交易记录 ({transactions.length})
              </h2>
              <Button
                intent={Intent.PRIMARY}
                icon="upload"
                text="重新上传"
                onClick={() => setTransactions([])}
              />
            </div>
            <TransactionTable
              transactions={transactions}
              headers={headers}
              onExportCSV={(data, headers) =>
                exportToCSV(data, 'transactions.csv', headers)
              }
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
