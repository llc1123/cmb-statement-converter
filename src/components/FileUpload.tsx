import { Card, Elevation, NonIdealState, Spinner } from '@blueprintjs/core'
import { Document } from '@blueprintjs/icons'
import React, { useCallback, useState } from 'react'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files.length > 0 && files[0].type === 'application/pdf') {
        onFileUpload(files[0])
      }
    },
    [onFileUpload],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileUpload(e.target.files[0])
      }
    },
    [onFileUpload],
  )

  const handleCardClick = () => {
    inputRef.current?.click()
  }

  if (isLoading) {
    return (
      <Card
        elevation={Elevation.TWO}
        style={{ padding: '80px', textAlign: 'center' }}
      >
        <NonIdealState
          icon={<Spinner size={50} intent="primary" />}
          title="正在处理 PDF"
          description="正在从对账单中提取数据..."
        />
      </Card>
    )
  }

  return (
    <Card
      elevation={isDragging ? Elevation.FOUR : Elevation.TWO}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCardClick}
      style={{
        padding: '80px',
        textAlign: 'center',
        backgroundColor: isDragging ? 'rgba(16, 107, 163, 0.1)' : undefined,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        borderColor: isDragging ? '#106ba3' : undefined,
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      interactive={true}
    >
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept="application/pdf"
        onChange={handleInputChange}
      />
      <NonIdealState
        icon={<Document size={64} />}
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            上传招商银行对账单 PDF
          </span>
        }
        description={
          <div style={{ marginTop: '10px', fontSize: '16px', opacity: 0.8 }}>
            拖放 PDF 文件到此处，或点击任意位置浏览文件。
          </div>
        }
      />
    </Card>
  )
}
