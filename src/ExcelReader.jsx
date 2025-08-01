import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as XLSX from 'xlsx';
import { Container, Row, Col, Card, Table, Button, Alert, Form, Badge } from 'react-bootstrap';
import ScheduleView from './ScheduleView';

export default function ExcelReader() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFileSection, setShowFileSection] = useState(true);
  const [isRestoredData, setIsRestoredData] = useState(false);

  // Khóa lưu trữ trong localStorage
  const STORAGE_KEY = 'scheduleData';
  const FILENAME_KEY = 'scheduleFileName';
  const UPLOAD_DATE_KEY = 'scheduleUploadDate';

  // Lưu dữ liệu vào localStorage
  const saveToLocalStorage = (scheduleData, filename) => {
    try {
      const dataToSave = {
        data: scheduleData,
        fileName: filename,
        uploadDate: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Đã lưu dữ liệu vào localStorage');
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
    }
  };

  // Khôi phục dữ liệu từ localStorage
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData.data || []);
        setFileName(parsedData.fileName || '');
        setIsRestoredData(true);
        // Tự động thu gọn nếu có dữ liệu cũ
        if (parsedData.data && parsedData.data.length > 0) {
          setShowFileSection(false);
        }
        return true;
      }
    } catch (error) {
      console.error('Lỗi khi khôi phục dữ liệu:', error);
    }
    return false;
  };

  // Lấy thông tin thời gian lưu
  const getSavedDataInfo = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.uploadDate) {
          const uploadDate = new Date(parsedData.uploadDate);
          return uploadDate.toLocaleString('vi-VN');
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin thời gian:', error);
    }
    return null;
  };

  // Xóa dữ liệu từ localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Đã xóa dữ liệu khỏi localStorage');
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
    }
  };

  // Khôi phục dữ liệu khi component mount
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    setLoading(true);
    setError('');
    setFileName(file.name);
    setIsRestoredData(false); // Reset trạng thái khôi phục khi upload file mới

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = (e) => {
      try {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });

        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        // console.log(jsonData);
        setData(jsonData);
        setLoading(false);
        
        // Lưu dữ liệu vào localStorage
        saveToLocalStorage(jsonData, file.name);
        
        // Tự động thu gọn sau khi upload thành công
        setShowFileSection(false);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setError('Có lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Có lỗi khi đọc file.');
      setLoading(false);
    };
  };

  const clearData = () => {
    setData([]);
    setFileName('');
    setError('');
    setShowFileSection(true); // Mở rộng lại phần chọn file
    clearLocalStorage(); // Xóa dữ liệu khỏi localStorage
  };

  

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-danger text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                  <span className="d-none d-sm-inline">📚 Hệ Thống Xem Thời Khóa Biểu</span>
                  <span className="d-sm-none">📚 Thời Khóa Biểu</span>
                </h3>
                <Button 
                  variant="outline-light" 
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
                    </Form.Text>
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
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setShowFileSection(true)}
                          className="flex-shrink-0 ms-2"
                        >
                          📂 Upload mới
                        </Button>
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
                      <Button variant="outline-danger" onClick={clearData} className="flex-shrink-0">
                        <span className="d-none d-sm-inline">🗑️ Xóa dữ liệu</span>
                        <span className="d-sm-none">🗑️ Xóa</span>
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            )}
            
            {/* Hiển thị thông tin tóm tắt khi thu gọn */}
            {!showFileSection && data.length > 0 && (
              <Card.Body className="py-2 file-section-collapsed">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div className="d-flex align-items-center flex-grow-1 me-2">
                    <Badge bg={isRestoredData ? "primary" : "success"} className="me-2">
                      {isRestoredData ? "💾" : "✓"}
                    </Badge>
                    <small className="text-truncate">
                      <strong className="d-none d-sm-inline">{fileName}</strong>
                      <span className="d-sm-none">{fileName.substring(0, 20)}...</span>
                      <span className="text-muted"> - {data.length} bản ghi</span>
                      {isRestoredData && (
                        <span className="text-primary d-none d-sm-inline"> (Đã lưu)</span>
                      )}
                    </small>
                  </div>
                  <div className="d-flex gap-1">
                    {isRestoredData && (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => setShowFileSection(true)}
                        className="flex-shrink-0"
                      >
                        <span className="d-none d-sm-inline">📂 Upload mới</span>
                        <span className="d-sm-none">📂</span>
                      </Button>
                    )}
                    <Button variant="outline-danger" size="sm" onClick={clearData} className="flex-shrink-0">
                      <span className="d-none d-sm-inline">🗑️ Xóa</span>
                      <span className="d-sm-none">🗑️</span>
                    </Button>
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>
      <ScheduleView data={data} />
    </Container>
  );
}
