/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as XLSX from 'xlsx'
import { Container, Row, Col, Card, Table, Button, Alert, Form, Badge } from 'react-bootstrap'
import { scheduleAllNotification, processExcelData } from '../../../utils/manageNotification'

export default function ExcelReader({ onDataLoaded }) {
  const [data, setData] = useState([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFileSection, setShowFileSection] = useState(true)
  const [isRestoredData, setIsRestoredData] = useState(false)

  // Sử dụng ref để tránh dependency hell
  const onDataLoadedRef = useRef(onDataLoaded)
  onDataLoadedRef.current = onDataLoaded

  // Khóa lưu trữ trong localStorage
  const STORAGE_KEY = 'scheduleData'

  // Lưu dữ liệu vào localStorage
  const saveToLocalStorage = (scheduleData, filename) => {
    try {
      const dataToSave = {
        data: scheduleData,
        fileName: filename,
        uploadDate: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      // console.log('Đã lưu dữ liệu vào localStorage')
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error)
    }
  }

  // Khôi phục dữ liệu từ localStorage
  const loadFromLocalStorage = useCallback(async () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        const loadedData = parsedData.data || []
        setData(loadedData)
        setFileName(parsedData.fileName || '')
        setIsRestoredData(true)

        // Callback để thông báo data đã được load từ localStorage
        if (onDataLoadedRef.current && loadedData.length > 0) {
          onDataLoadedRef.current(loadedData, false) // false = không phải từ upload
        }

        // Xử lý dữ liệu
        const processedData = await processExcelData(loadedData)

        await scheduleAllNotification(processedData.scheduleByDate)

        return true
      }
    } catch (error) {
      console.error('Lỗi khi khôi phục dữ liệu:', error)
    }
    return false
  }, []) // Không cần dependency vì sử dụng ref

  // Lấy thông tin thời gian lưu
  const getSavedDataInfo = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        if (parsedData.uploadDate) {
          const uploadDate = new Date(parsedData.uploadDate)
          return uploadDate.toLocaleString('vi-VN')
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin thời gian:', error)
    }
    return null
  }

  // Khôi phục dữ liệu khi component mount
  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])


  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setError('')
    setFileName(file.name)
    setIsRestoredData(false)

    const reader = new FileReader()
    reader.readAsBinaryString(file)

    reader.onload = async (e) => {
      try {
        const binaryStr = e.target.result
        const workbook = XLSX.read(binaryStr, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Parse Excel data với các tùy chọn
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 10,
          range: 9,
          blankrows: false,
          defval: ''
        })

        // console.log('Raw Excel data:', jsonData)

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error('Không tìm thấy dữ liệu trong file Excel')
        }

        // Xử lý dữ liệu
        const processedData = await processExcelData(jsonData)

        // Cập nhật state và storage
        setData(jsonData)
        saveToLocalStorage(jsonData, file.name)

        if (onDataLoadedRef.current) {
          onDataLoadedRef.current(jsonData, true)
        }

        // Lên lịch thông báo sau khi đã xử lý xong dữ liệu
        await scheduleAllNotification(processedData.scheduleByDate)

        setLoading(false)
      } catch (error) {
        console.error('Error processing file:', error)
        let errorMessage = 'Có lỗi khi xử lý file Excel.'

        if (error.message.includes('Không tìm thấy dữ liệu')) {
          errorMessage = 'File không chứa dữ liệu thời khóa biểu hợp lệ.'
        } else if (error.message.includes('Không thể xử lý')) {
          errorMessage = 'Không thể xử lý được định dạng thời khóa biểu.'
        } else if (error.message.includes('Quyền thông báo')) {
          errorMessage = error.message
        }

        setError(errorMessage)
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Không thể đọc file. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <Container className="mt-5">
      <Row>
        <Col>
          <Card>
            <Card.Header className="w-100 bg-danger text-white" style={{ minWidth: '313px' }}>
              <div className="w-100 d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                  <span className="d-none d-sm-inline">📚 Hệ Thống Xem Thời Khóa Biểu</span>
                  <span className="d-sm-none">📚 Thời Khóa Biểu</span>
                </h3>
                <Button
                  style={{ backgroundColor: 'transparent', border: 'none', color: 'white' }}
                  size="sm"
                  onClick={() => setShowFileSection(!showFileSection)}
                >
                  {showFileSection ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>}
                </Button>
              </div>
            </Card.Header>
            {showFileSection && (
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>📁 Chọn file Excel thời khóa biểu:</strong>
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      Hỗ trợ định dạng: .xlsx, .xls
                    </Form.Text> <br />
                    <Form.Text className="text-muted">
                      Lưu ý: Chọn file thời khóa biểu sinh viên theo ngày học
                    </Form.Text> <br />

                  </Form.Group>

                  {isRestoredData && data.length > 0 && (
                    <Alert variant="primary">
                      <div className="d-flex align-items-center justify-content-between flex-wrap">
                        <div className="flex-grow-1">
                          <strong>💾 Dữ liệu đã khôi phục:</strong> Đã tải lại dữ liệu từ lần truy cập trước
                          {getSavedDataInfo() && (
                            <small className="d-block text-muted mt-1">
                              Lưu lúc: {getSavedDataInfo()}
                            </small>
                          )}
                        </div>
                      </div>
                    </Alert>
                  )}

                  {fileName && !isRestoredData && (
                    <Alert variant="info">
                      <strong>File đã chọn:</strong> {fileName}
                    </Alert>
                  )}

                  {loading && (
                    <Alert variant="warning">
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Đang xử lý file...
                      </div>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="danger">
                      <strong>Lỗi:</strong> {error}
                    </Alert>
                  )}

                  {data.length > 0 && (
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                      <Alert variant="success" className="flex-grow-1 mb-0">
                        <strong>Thành công!</strong>
                        <span className="d-none d-sm-inline"> Đã tải {data.length} bản ghi từ file Excel.</span>
                        <span className="d-sm-none"> {data.length} bản ghi</span>
                      </Alert>
                    </div>
                  )}
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
