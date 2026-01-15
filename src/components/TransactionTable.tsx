import {
  Button,
  ButtonGroup,
  Card,
  HTMLTable,
  InputGroup,
} from '@blueprintjs/core'
import { Filter, SortAsc, SortDesc } from '@blueprintjs/icons'
import type React from 'react'
import { useMemo, useState } from 'react'
import type { Transaction } from '../utils/cmbParser'

// Redundant exportToCSV removed logic moved to utils/exportUtils.ts

interface TransactionTableProps {
  transactions: Transaction[]
  headers?: string[]
  onExportCSV?: (data: Transaction[], headers?: string[]) => void
}

type SortField =
  | 'originalIndex'
  | 'transDate'
  | 'postDate'
  | 'amountRMB'
  | 'description'
type SortDirection = 'asc' | 'desc'

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  headers = [],
  onExportCSV,
}) => {
  const [filter, setFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('originalIndex')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Default headers if empty
  const displayHeaders =
    headers.length === 6
      ? headers
      : [
          '交易日',
          '记账日',
          '交易摘要',
          '人民币金额',
          '卡号末四位',
          '交易地金额',
        ]

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAndFilteredData = useMemo(() => {
    let data = [...transactions]

    if (filter) {
      const lowerFilter = filter.toLowerCase()
      data = data.filter(
        (t) =>
          t.description.toLowerCase().includes(lowerFilter) ||
          t.amountRMB.toString().includes(lowerFilter) ||
          t.cardLastFour.includes(lowerFilter),
      )
    }

    data.sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]

      if (valA === valB) return 0

      // Numeric sort
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA
      }

      // String sort
      const strA = String(valA)
      const strB = String(valB)
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [transactions, filter, sortField, sortDirection])

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <InputGroup
            leftIcon={<Filter />}
            placeholder="筛选交易..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <ButtonGroup>
            <Button
              icon="export"
              text="导出 CSV"
              onClick={() => onExportCSV?.(transactions, displayHeaders)}
            />
          </ButtonGroup>
        </div>
      </div>

      <HTMLTable bordered striped interactive style={{ width: '100%' }}>
        <thead>
          <tr>
            <th
              onClick={() => handleSort('originalIndex')}
              style={{ width: '80px', textAlign: 'center', cursor: 'pointer' }}
            >
              #&nbsp;
              {sortField === 'originalIndex' &&
                (sortDirection === 'asc' ? <SortAsc /> : <SortDesc />)}
            </th>
            <th
              onClick={() => handleSort('transDate')}
              style={{ cursor: 'pointer' }}
            >
              {displayHeaders[0]}{' '}
              {sortField === 'transDate' &&
                (sortDirection === 'asc' ? <SortAsc /> : <SortDesc />)}
            </th>
            <th
              onClick={() => handleSort('postDate')}
              style={{ cursor: 'pointer' }}
            >
              {displayHeaders[1]}{' '}
              {sortField === 'postDate' &&
                (sortDirection === 'asc' ? <SortAsc /> : <SortDesc />)}
            </th>
            <th
              onClick={() => handleSort('description')}
              style={{ cursor: 'pointer' }}
            >
              {displayHeaders[2]}{' '}
              {sortField === 'description' &&
                (sortDirection === 'asc' ? <SortAsc /> : <SortDesc />)}
            </th>
            <th>{displayHeaders[4]}</th>
            <th
              onClick={() => handleSort('amountRMB')}
              style={{ cursor: 'pointer', textAlign: 'right' }}
            >
              {displayHeaders[3]}{' '}
              {sortField === 'amountRMB' &&
                (sortDirection === 'asc' ? <SortAsc /> : <SortDesc />)}
            </th>
            <th style={{ textAlign: 'right' }}>{displayHeaders[5]}</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredData.map((t) => (
            <tr key={t.originalIndex}>
              <td style={{ textAlign: 'center', color: '#888' }}>
                {t.originalIndex}
              </td>
              <td>{t.transDate}</td>
              <td>{t.postDate}</td>
              <td>{t.description}</td>
              <td>{t.cardLastFour}</td>
              <td
                style={{
                  textAlign: 'right',
                  color: t.amountRMB < 0 ? 'red' : 'green',
                }}
              >
                {t.amountRMB.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td style={{ textAlign: 'right' }}>
                {t.originalAmount?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || ''}
              </td>
            </tr>
          ))}
          {sortedAndFilteredData.length === 0 && (
            <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
              未找到交易记录
            </td>
          )}
        </tbody>
      </HTMLTable>
    </Card>
  )
}
