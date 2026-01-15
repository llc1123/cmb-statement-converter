import { describe, expect, it } from 'vitest'
import { parseCMBStatement } from './cmbParser'

const mockData = [
  '200070',
  '上海市',
  '11/02', // Trans Date
  '11/03', // Post Date
  '支付宝-特约商户', // Desc
  '38.20', // Amount
  '5445', // Card
  '38.20', // Orig Amount
  'Noise data',
  '11/03',
  '11/04',
  '美团支付-美团北京三快在线科技有限公司',
  '11.90',
  '5445',
  '11.90',
  '10/19',
  '10/20',
  '支付宝-上海极途信息技术有限公司',
  '-68.00',
  '5445',
  '-68.00',
]

describe('cmbParser', () => {
  it('should parse simple transaction blocks and return headers', () => {
    const result = parseCMBStatement(mockData)
    expect(result.transactions).toHaveLength(3)
    // We didn't include headers in mockData, so it should default
    expect(result.headers).toEqual([
      'Transaction Date',
      'Post Date',
      'Description',
      'Amount (RMB)',
      'Card #',
      'Original Amount',
    ])

    expect(result.transactions[0]).toEqual({
      originalIndex: 1,
      transDate: '11/02',
      postDate: '11/03',
      description: '支付宝-特约商户',
      amountRMB: 38.2,
      cardLastFour: '5445',
      originalAmount: 38.2,
    })

    expect(result.transactions[2]).toEqual({
      originalIndex: 3,
      transDate: '10/19',
      postDate: '10/20',
      description: '支付宝-上海极途信息技术有限公司',
      amountRMB: -68.0,
      cardLastFour: '5445',
      originalAmount: -68.0,
    })
  })

  it('should handle large real-world chunks', () => {
    // Data derived from the PDF content inspection
    const largeChunk = [
      '10/20',
      '10/21',
      '拼多多支付-MAVO咖啡器具旗舰店',
      '-254.99',
      '5445',
      '-254.99',
      '10/20',
      '10/21',
      '支付宝-深圳市乐浦贸易有限公司',
      '-269.00',
      '5445',
      '-269.00',
    ]
    const result = parseCMBStatement(largeChunk)
    expect(result.transactions).toHaveLength(2)
    expect(result.transactions[1].amountRMB).toBe(-269.0)
  })

  it('should handle transactions with empty post date', () => {
    const chunkWithEmptyPostDate = [
      '11/05',
      '', // Empty Post Date
      'Test Transaction',
      '100.00',
      '1234',
      '100.00',
    ]
    const result = parseCMBStatement(chunkWithEmptyPostDate)
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].postDate).toBe('')
    expect(result.transactions[0].amountRMB).toBe(100.0)
  })

  it('should handle transactions with only one date (Automatic Repayment scenario)', () => {
    // Realistic scenario: Only one date line is present/extracted
    const chunkWithOneDate = [
      '11/06', // Could be interpreted as Trans or Post, defaults to Trans
      'Automatic Repayment',
      '200.00',
      '5678',
    ]
    const result = parseCMBStatement(chunkWithOneDate)
    expect(result.transactions).toHaveLength(1)
    // Parser maps single date to PostDate for "Automatic Repayment"
    expect(result.transactions[0].transDate).toBe('')
    expect(result.transactions[0].postDate).toBe('11/06')
    expect(result.transactions[0].amountRMB).toBe(200.0)
    expect(result.transactions[0].description).toBe('Automatic Repayment')
    expect(result.transactions[0].originalAmount).toBeNull()
  })
})
