/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Alert } from 'react-bootstrap'
import * as XLSX from 'xlsx'

export default function GradeView() {
  const [gradeData, setGradeData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // State cho tính GPA ảo
  const [virtualCredits, setVirtualCredits] = useState('')
  const [virtualGrade, setVirtualGrade] = useState('')
  const [projectedGPA, setProjectedGPA] = useState(null)

  // State cho form thêm môn học mới
  const [newSubject, setNewSubject] = useState({
    tenMonHoc: '',
    tp1: '',
    tp2: '',
    thi: '',
    tkhp: '',
    diemChu: '',
    tinChi: '',
    diemHe4: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const GRADE_STORAGE_KEY = 'gradeData'

  // Tải dữ liệu từ localStorage
  useEffect(() => {
    const loadGradeData = () => {
      try {
        const savedData = localStorage.getItem(GRADE_STORAGE_KEY)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          const loadedData = parsedData.data || []
          setGradeData(loadedData)
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu bảng điểm:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGradeData()
  }, [])

  // Tính GPA hiện tại
  const calculateCurrentGPA = useCallback(() => {
    if (gradeData.length === 0) return { gpa10: 0, gpa4: 0, totalCredits: 0 }

    let totalPoints10 = 0
    let totalPoints4 = 0
    let totalCredits = 0

    gradeData.forEach(subject => {
      const credits = parseFloat(subject.tinChi) || 0
      const tkhp = parseFloat(subject.tkhp) || 0
      const he4 = parseFloat(subject.diemHe4) || 0

      if (credits > 0) {
        totalPoints10 += tkhp * credits
        totalPoints4 += he4 * credits
        totalCredits += credits
      }
    })

    return {
      gpa10: totalCredits > 0 ? (totalPoints10 / totalCredits).toFixed(2) : 0,
      gpa4: totalCredits > 0 ? (totalPoints4 / totalCredits).toFixed(2) : 0,
      totalCredits: totalCredits
    }
  }, [gradeData])

  // Tính GPA ảo - tính điểm cần đạt cho số tín còn lại
  const calculateProjectedGPA = () => {
    const currentGPA = calculateCurrentGPA()
    const currentCredits = parseFloat(currentGPA.totalCredits)
    const additionalCredits = parseFloat(virtualCredits) || 0
    const targetGPA4 = parseFloat(virtualGrade) || 0

    if (additionalCredits <= 0) {
      alert('Vui lòng nhập số tín chỉ còn lại hợp lệ (lớn hơn 0)')
      return
    }

    if (targetGPA4 <= 0 || targetGPA4 > 4) {
      alert('Vui lòng nhập điểm GPA mong muốn hợp lệ (từ 0 đến 4)')
      return
    }

    // Tính điểm cần đạt cho số tín còn lại
    const currentTotalPoints4 = parseFloat(currentGPA.gpa4) * currentCredits
    const totalNewCredits = currentCredits + additionalCredits
    const requiredTotalPoints4 = targetGPA4 * totalNewCredits
    const requiredPoints4 = requiredTotalPoints4 - currentTotalPoints4
    const requiredGrade4 = requiredPoints4 / additionalCredits

    // Kiểm tra xem có thể đạt được không (điểm tối đa là 4.0)
    if (requiredGrade4 > 4.0) {
      // Không thể đạt được - tính số tín tối thiểu cần
      const minCreditsNeeded = (targetGPA4*currentCredits - parseFloat(currentGPA.gpa4)*currentCredits) / (4.0 - targetGPA4)
      const totalMinCredits = currentCredits + minCreditsNeeded

      setProjectedGPA({
        achievable: false,
        targetGPA4: targetGPA4,
        currentGPA4: currentGPA.gpa4,
        requiredGrade4: requiredGrade4.toFixed(2),
        additionalCredits: additionalCredits,
        minCreditsNeeded: Math.ceil(minCreditsNeeded),
        totalMinCredits: Math.ceil(totalMinCredits),
        currentCredits: currentCredits
      })
    } else if (requiredGrade4 < 0) {
      // GPA hiện tại đã cao hơn mục tiêu
      setProjectedGPA({
        achievable: true,
        alreadyAchieved: true,
        targetGPA4: targetGPA4,
        currentGPA4: currentGPA.gpa4,
        message: 'GPA hiện tại của bạn đã cao hơn mục tiêu!'
      })
    } else {
      // Có thể đạt được
      setProjectedGPA({
        achievable: true,
        alreadyAchieved: false,
        targetGPA4: targetGPA4,
        currentGPA4: currentGPA.gpa4,
        requiredGrade4: requiredGrade4.toFixed(2),
        additionalCredits: additionalCredits,
        totalNewCredits: totalNewCredits,
        currentCredits: currentCredits
      })
    }
  }

  // Reset GPA ảo
  const resetProjectedGPA = () => {
    setVirtualCredits('')
    setVirtualGrade('')
    setProjectedGPA(null)
  }

  // Xử lý thay đổi input môn học mới
  const handleNewSubjectChange = (field, value) => {
    setNewSubject(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Tính toán TKHP và Điểm hệ 4 tự động
  const calculateGrades = () => {
    const tp1 = parseFloat(newSubject.tp1) || 0
    const tp2 = parseFloat(newSubject.tp2) || 0
    const thi = parseFloat(newSubject.thi) || 0

    // TKHP = (TP1 + TP2 + THI * 2) / 4
    const tkhp = ((tp1*0.7 + tp2*0.3)*0.3 + thi*0.7).toFixed(1)

    // Chuyển đổi sang điểm chữ và hệ 4
    let diemChu = ''
    let diemHe4 = 0

    if (tkhp >= 9.0) { diemChu = 'A+'; diemHe4 = 4.0 }
    if (tkhp >= 8.5) { diemChu = 'A'; diemHe4 = 3.8 }
    else if (tkhp >= 7.8) { diemChu = 'B+'; diemHe4 = 3.5 }
    else if (tkhp >= 7.0) { diemChu = 'B'; diemHe4 = 3.0 }
    else if (tkhp >= 6.3) { diemChu = 'C+'; diemHe4 = 2.4 }
    else if (tkhp >= 5.5) { diemChu = 'C'; diemHe4 = 2.0 }
    else if (tkhp >= 4.8) { diemChu = 'D+'; diemHe4 = 1.5 }
    else if (tkhp >= 4.0) { diemChu = 'D'; diemHe4 = 1.0 }
    else { diemChu = 'F'; diemHe4 = 0 }

    return { tkhp, diemChu, diemHe4 }
  }

  // Thêm môn học mới
  const handleAddSubject = () => {
    if (!newSubject.tenMonHoc.trim()) {
      alert('Vui lòng nhập tên môn học')
      return
    }

    if (!newSubject.tinChi || parseFloat(newSubject.tinChi) <= 0) {
      alert('Vui lòng nhập số tín chỉ hợp lệ')
      return
    }

    const { tkhp, diemChu, diemHe4 } = calculateGrades()

    const subjectToAdd = {
      stt: gradeData.length + 1,
      tenMonHoc: newSubject.tenMonHoc,
      tp1: newSubject.tp1 || '0',
      tp2: newSubject.tp2 || '0',
      thi: newSubject.thi || '0',
      tkhp: tkhp,
      diemChu: diemChu,
      tinChi: newSubject.tinChi,
      diemHe4: diemHe4.toFixed(1)
    }

    const updatedData = [...gradeData, subjectToAdd]
    setGradeData(updatedData)

    // Lưu vào localStorage
    const dataToSave = {
      data: updatedData,
      fileName: 'manual_input',
      uploadDate: new Date().toISOString()
    }
    localStorage.setItem(GRADE_STORAGE_KEY, JSON.stringify(dataToSave))

    // Reset form
    setNewSubject({
      tenMonHoc: '',
      tp1: '',
      tp2: '',
      thi: '',
      tkhp: '',
      diemChu: '',
      tinChi: '',
      diemHe4: ''
    })
    setShowAddForm(false)
  }

  // Xóa môn học
  const handleDeleteSubject = (index) => {
    if (window.confirm('Bạn có chắc muốn xóa môn học này?')) {
      const updatedData = gradeData.filter((_, i) => i !== index)
      // Cập nhật lại STT
      const reindexedData = updatedData.map((item, i) => ({
        ...item,
        stt: i + 1
      }))
      setGradeData(reindexedData)

      // Lưu vào localStorage
      const dataToSave = {
        data: reindexedData,
        fileName: 'manual_input',
        uploadDate: new Date().toISOString()
      }
      localStorage.setItem(GRADE_STORAGE_KEY, JSON.stringify(dataToSave))
    }
  }

  // Xuất bảng điểm ra Excel
  const exportToExcel = () => {
    // Chuẩn bị dữ liệu cho Excel
    const worksheetData = [
      // Header
      ['STT', 'Tên môn học', 'TP1', 'TP2', 'THI', 'TKHP', 'Điểm chữ', 'Tín chỉ', 'Điểm hệ 4'],
      // Data rows
      ...gradeData.map(subject => [
        subject.stt,
        subject.tenMonHoc,
        subject.tp1,
        subject.tp2,
        subject.thi,
        subject.tkhp,
        subject.diemChu,
        subject.tinChi,
        subject.diemHe4
      ]),
      // Empty row
      [],
      // Summary section
      // ['', 'THỐNG KÊ ĐIỂM TRUNG BÌNH'],
      // ['', 'GPA (Hệ 10)', currentGPA.gpa10],
      // ['', 'GPA (Hệ 4)', currentGPA.gpa4],
      // ['', 'Tổng Tín Chỉ', currentGPA.totalCredits],
      // ['', 'Xếp Loại', academicRank.label],
      // [],
      // ['', 'Tổng số môn học', gradeData.length],
      // ['', 'Ngày xuất', new Date().toLocaleDateString('vi-VN')]
    ]

    // Tạo worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Định dạng độ rộng cột
    const columnWidths = [
      { wch: 5 }, // STT
      { wch: 40 }, // Tên Môn Học
      { wch: 8 }, // TP1
      { wch: 8 }, // TP2
      { wch: 8 }, // THI
      { wch: 8 }, // TKHP
      { wch: 12 }, // Điểm Chữ
      { wch: 10 }, // Tín Chỉ
      { wch: 12 } // Điểm Hệ 4
    ]
    worksheet['!cols'] = columnWidths

    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng Điểm')

    // Xuất file
    const fileName = `BangDiem_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // Phân loại học lực
  const getAcademicRank = (gpa) => {
    const gpaValue = parseFloat(gpa)
    if (gpaValue >= 3.6) return { label: 'Xuất sắc', color: 'success' }
    if (gpaValue >= 3.2) return { label: 'Giỏi', color: 'primary' }
    if (gpaValue >= 2.5) return { label: 'Khá', color: 'info' }
    if (gpaValue >= 2.0) return { label: 'Trung bình', color: 'warning' }
    return { label: 'Yếu', color: 'danger' }
  }

  const currentGPA = calculateCurrentGPA()
  const academicRank = getAcademicRank(currentGPA.gpa4)

  if (isLoading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </Container>
    )
  }

  if (gradeData.length === 0) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>📊 Chưa có dữ liệu bảng điểm</Alert.Heading>
          <p>Vui lòng tải lên file Excel bảng điểm tại trang chủ để xem thông tin điểm.</p>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="mt-5">
      {/* Phần 1: Bảng điểm chi tiết */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">📋 Bảng Điểm Chi Tiết</h4>
              <Button
                variant="light"
                size="sm"
                onClick={exportToExcel}
                className="d-flex align-items-center gap-2"
              >
                <i className="bi bi-file-earmark-excel"></i>
                Xuất Excel
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center">STT</th>
                      <th className='text-start'>Tên Môn Học</th>
                      <th className="text-center">TP1</th>
                      <th className="text-center">TP2</th>
                      <th className="text-center">THI</th>
                      <th className="text-center">TKHP</th>
                      <th className="text-center">ĐC</th>
                      <th className="text-center">TC</th>
                      <th className="text-center">Hệ 4</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeData.map((subject, index) => (
                      <tr key={index}>
                        <td className="text-center">{subject.stt}</td>
                        <td className='text-start'>{subject.tenMonHoc}</td>
                        <td className="text-center">{subject.tp1}</td>
                        <td className="text-center">{subject.tp2}</td>
                        <td className="text-center">{subject.thi}</td>
                        <td className="text-center">
                          <Badge bg={
                            parseFloat(subject.tkhp) >= 8 ? 'success' :
                              parseFloat(subject.tkhp) >= 6.5 ? 'primary' :
                                parseFloat(subject.tkhp) >= 5 ? 'warning' : 'danger'
                          }>
                            {subject.tkhp}
                          </Badge>
                        </td>
                        <td className="text-start">
                          <strong>{subject.diemChu}</strong>
                        </td>
                        <td className="text-center">{subject.tinChi}</td>
                        <td className="text-center">{subject.diemHe4}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteSubject(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {/* Hàng thêm môn học mới */}
                    {showAddForm ? (
                      <tr className="table-info">
                        <td className="text-center">
                          <Badge bg="secondary">Mới</Badge>
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Tên môn học"
                            value={newSubject.tenMonHoc}
                            onChange={(e) => handleNewSubjectChange('tenMonHoc', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="TP1"
                            value={newSubject.tp1}
                            onChange={(e) => handleNewSubjectChange('tp1', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="TP2"
                            value={newSubject.tp2}
                            onChange={(e) => handleNewSubjectChange('tp2', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="THI"
                            value={newSubject.thi}
                            onChange={(e) => handleNewSubjectChange('thi', e.target.value)}
                          />
                        </td>
                        <td className="text-center text-muted">
                          <small>Tự động</small>
                        </td>
                        <td className="text-center text-muted">
                          <small>Tự động</small>
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Tín chỉ"
                            value={newSubject.tinChi}
                            onChange={(e) => handleNewSubjectChange('tinChi', e.target.value)}
                          />
                        </td>
                        <td className="text-center text-muted">
                          <small>Tự động</small>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={handleAddSubject}
                            >
                              <i className="bi bi-check-lg"></i>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setShowAddForm(false)
                                setNewSubject({
                                  tenMonHoc: '',
                                  tp1: '',
                                  tp2: '',
                                  thi: '',
                                  tkhp: '',
                                  diemChu: '',
                                  tinChi: '',
                                  diemHe4: ''
                                })
                              }}
                            >
                              <i className="bi bi-x-lg"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">Tổng số môn học: <strong>{gradeData.length}</strong></small>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  disabled={showAddForm}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Thêm môn học
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Phần 2: Thống kê GPA hiện tại */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">📊 Thống Kê Điểm Trung Bình</h4>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={3}>
                  <Card className="mb-3 mb-md-0 border-primary">
                    <Card.Body>
                      <h6 className="text-muted mb-2">GPA (Hệ 10)</h6>
                      <h2 className="text-primary mb-0">{currentGPA.gpa10}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="mb-3 mb-md-0 border-success">
                    <Card.Body>
                      <h6 className="text-muted mb-2">GPA (Hệ 4)</h6>
                      <h2 className="text-success mb-0">{currentGPA.gpa4}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="mb-3 mb-md-0 border-info">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Tổng Tín Chỉ</h6>
                      <h2 className="text-info mb-0">{currentGPA.totalCredits}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`mb-3 mb-md-0 border-${academicRank.color}`}>
                    <Card.Body>
                      <h6 className="text-muted mb-2">Xếp Loại</h6>
                      <h2 className={`text-${academicRank.color} mb-0`}>{academicRank.label}</h2>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Phần 3: Tính GPA ảo */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="bg-warning text-dark">
              <h4 className="mb-0">🎯 Tính GPA Dự Kiến (GPA Ảo)</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Hướng dẫn:</strong> Nhập số tín chỉ còn lại và GPA mong muốn khi kết thúc khóa học. Hệ thống sẽ tính toán điểm cần đạt cho các môn còn lại để đạt được mục tiêu.
              </Alert>

              <Form>
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Số tín chỉ còn lại:</strong></Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Nhập số tín chỉ..."
                          value={virtualCredits}
                          onChange={(e) => setVirtualCredits(e.target.value)}
                        />
                        <InputGroup.Text>tín chỉ</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>GPA mong muốn khi tốt nghiệp (hệ 4):</strong></Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min="0"
                          max="4"
                          step="0.01"
                          placeholder="VD: 3.2 (Giỏi)"
                          value={virtualGrade}
                          onChange={(e) => setVirtualGrade(e.target.value)}
                        />
                        <InputGroup.Text>/4</InputGroup.Text>
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Gợi ý: 3.6+ (Xuất sắc), 3.2+ (Giỏi), 2.5+ (Khá)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Label className="d-none d-md-block">&nbsp;</Form.Label>
                    <div className="d-grid gap-2">
                      <Button variant="primary" onClick={calculateProjectedGPA}>
                        <i className="bi bi-calculator me-2"></i>Tính toán
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>

              {projectedGPA && (
                <>
                  <hr />
                  {projectedGPA.achievable && !projectedGPA.alreadyAchieved ? (
                    <Alert variant="success">
                      <Alert.Heading>✅ Mục Tiêu Có Thể Đạt Được!</Alert.Heading>
                      <div className="mt-3">
                        <Row>
                          <Col md={12}>
                            <Card className="mb-3 bg-light border-success">
                              <Card.Body>
                                <h5 className="text-success mb-3">
                                  <i className="bi bi-trophy me-2"></i>
                                  Điểm Cần Đạt Cho {projectedGPA.additionalCredits} Tín Chỉ Còn Lại
                                </h5>
                                <h2 className="text-primary mb-2">
                                  {projectedGPA.requiredGrade4}/4.0
                                </h2>
                                <p className="mb-2">
                                  <strong>GPA hiện tại:</strong> {projectedGPA.currentGPA4}/4.0
                                  <small className="text-muted"> ({projectedGPA.currentCredits} tín chỉ)</small>
                                </p>
                                <p className="mb-2">
                                  <strong>GPA mục tiêu:</strong> {projectedGPA.targetGPA4}/4.0
                                  <small className="text-muted"> ({projectedGPA.totalNewCredits} tín chỉ)</small>
                                </p>
                                <p className="mb-0">
                                  <strong>Xếp loại mục tiêu:</strong>{' '}
                                  <Badge bg={getAcademicRank(projectedGPA.targetGPA4).color}>
                                    {getAcademicRank(projectedGPA.targetGPA4).label}
                                  </Badge>
                                </p>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                        <Alert variant="info" className="mb-2">
                          <i className="bi bi-lightbulb me-2"></i>
                          <strong>Lời khuyên:</strong> Bạn cần đạt trung bình <strong>{projectedGPA.requiredGrade4}/4.0</strong> cho {projectedGPA.additionalCredits} tín chỉ còn lại để đạt GPA {projectedGPA.targetGPA4}/4.0 khi tốt nghiệp.
                        </Alert>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline-secondary" size="sm" onClick={resetProjectedGPA}>
                          <i className="bi bi-arrow-counterclockwise me-2"></i>Tính lại
                        </Button>
                      </div>
                    </Alert>
                  ) : projectedGPA.alreadyAchieved ? (
                    <Alert variant="success">
                      <Alert.Heading>🎉 Chúc Mừng!</Alert.Heading>
                      <p className="mb-0">{projectedGPA.message}</p>
                      <p className="mt-2 mb-0">
                        <strong>GPA hiện tại:</strong> {projectedGPA.currentGPA4}/4.0<br />
                        <strong>GPA mục tiêu:</strong> {projectedGPA.targetGPA4}/4.0
                      </p>
                      <div className="mt-3">
                        <Button variant="outline-secondary" size="sm" onClick={resetProjectedGPA}>
                          <i className="bi bi-arrow-counterclockwise me-2"></i>Tính lại
                        </Button>
                      </div>
                    </Alert>
                  ) : (
                    <Alert variant="danger">
                      <Alert.Heading>⚠️ Không Thể Đạt Được Với Số Tín Hiện Tại</Alert.Heading>
                      <div className="mt-3">
                        <Card className="mb-3 bg-light border-danger">
                          <Card.Body>
                            <p className="mb-2">
                              <strong>Điểm cần đạt:</strong> <span className="text-danger">{projectedGPA.requiredGrade4}/4.0</span>
                              <Badge bg="danger" className="ms-2">Vượt quá giới hạn 4.0</Badge>
                            </p>
                            <p className="mb-2">
                              <strong>GPA hiện tại:</strong> {projectedGPA.currentGPA4}/4.0
                              <small className="text-muted"> ({projectedGPA.currentCredits} tín chỉ)</small>
                            </p>
                            <p className="mb-2">
                              <strong>GPA mục tiêu:</strong> {projectedGPA.targetGPA4}/4.0
                            </p>
                            <p className="mb-0">
                              <strong>Số tín đã nhập:</strong> {projectedGPA.additionalCredits} tín chỉ
                            </p>
                          </Card.Body>
                        </Card>
                        <Alert variant="info">
                          <h6 className="mb-2">💡 Giải pháp:</h6>
                          <p className="mb-2">
                            Để đạt GPA <strong>{projectedGPA.targetGPA4}/4.0</strong>, bạn cần <strong>tối thiểu {projectedGPA.minCreditsNeeded} tín chỉ</strong> (đạt điểm tối đa 4.0/4.0).
                          </p>
                          <p className="mb-0">
                            <strong>Tổng tín chỉ cần:</strong> {projectedGPA.totalMinCredits} tín chỉ
                            <small className="text-muted"> (Hiện tại: {projectedGPA.currentCredits} tín chỉ)</small>
                          </p>
                        </Alert>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline-secondary" size="sm" onClick={resetProjectedGPA}>
                          <i className="bi bi-arrow-counterclockwise me-2"></i>Tính lại
                        </Button>
                      </div>
                    </Alert>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
