import React, { useState, useMemo } from 'react';
import { Card, Table, Badge, Row, Col, Modal, Button, Dropdown, ButtonGroup } from 'react-bootstrap';

const ScheduleView = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Hàm chuyển đổi số thứ sang tên thứ
  const getDayOfWeekName = (dayNumber) => {
    const dayNames = {
      1: 'Chủ nhật',
      2: 'Thứ Hai', 
      3: 'Thứ Ba',
      4: 'Thứ Tư',
      5: 'Thứ Năm',
      6: 'Thứ Sáu',
      7: 'Thứ Bảy'
    };
    return dayNames[dayNumber] || '';
  };

  const getTimeByPeriod = (period) => {
    const timePeriod = {
        "1,2,3": "7:00 - 9:25",
        "4,5,6": "9:35 - 12:00",
        "7,8,9": "12:30 - 14:55",
        "10,11,12": "15:05 - 17:00",
        "13,14,15": "18:00 - 21:15"
    };
    return timePeriod[period] || "";
  }

  // Hàm chuyển đổi số thứ sang số ngày trong tuần của JavaScript (0=CN, 1=T2, ...)
  const getDayOfWeekNumber = (dayNumber) => {
    // Trong Excel: 1=CN, 2=T2, 3=T3, ..., 7=T7
    // Trong JS: 0=CN, 1=T2, 2=T3, ..., 6=T7
    if (dayNumber === 1) return 0; // Chủ nhật
    return dayNumber - 1; // Thứ 2-7 -> 1-6
  };

  // Phân tích cấu trúc dữ liệu Excel
  const scheduleData = useMemo(() => {
    if (!data || data.length === 0) return { scheduleByDate: {}, subjects: [], subjectGroups: {} };

    const scheduleByDate = {};
    const subjects = new Set();
    const subjectGroups = {}; // Nhóm các môn học theo mã/tên

    data.forEach(row => {
      // Tìm cột đầu tiên (thứ trong tuần - số)
      const dayOfWeekColumn = Object.keys(row)[0]; // Cột đầu tiên chứa số thứ
      
      // Tìm cột thời gian học (cột cuối cùng thường chứa định dạng ngày)
      const timeColumn = Object.keys(row).find(key => 
        row[key] && typeof row[key] === 'string' && row[key].includes('/')
      ) || Object.keys(row)[Object.keys(row).length - 1]; // Cột cuối nếu không tìm thấy
    //   console.log(timeColumn);

      // Tìm cột tên môn học (thường là cột thứ 4)
      const subjectColumn = Object.keys(row)[3] || Object.keys(row).find(key => 
        key.toLowerCase().includes('tên') ||
        key.toLowerCase().includes('môn')
      );

      // Tìm cột mã học phần (thường là cột thứ 2)
      const codeColumn = Object.keys(row)[1] || Object.keys(row).find(key => 
        key.toLowerCase().includes('mã')
      );

      // Tìm cột phòng học (thường có chứa số phòng hoặc từ "phòng")
      const roomColumn = Object.keys(row).find(key => 
        row[key] && (
          key.toLowerCase().includes('phòng')
        )
      );

      // Tìm cột tiết học (thường chứa số như "1,2,3")
      const periodColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('tiết')
      );

      // Tìm cột giảng viên (có thể để trống trong ví dụ này)
      const teacherColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('giảng viên') ||
        key.toLowerCase().includes('cbgd')
      );

      if (timeColumn && row[timeColumn] && dayOfWeekColumn && row[dayOfWeekColumn]) {
        const timeString = row[timeColumn].toString();
        const subjectName = subjectColumn ? row[subjectColumn] : 'Môn học';
        const subjectCode = codeColumn ? row[codeColumn] : 'ERR';
        const dayOfWeekNumber = parseInt(row[dayOfWeekColumn]); // Số thứ (2, 3, 4...)
        const dayOfWeekName = getDayOfWeekName(dayOfWeekNumber);
        
        // Tạo key duy nhất cho môn học (kết hợp mã và tên)
        const subjectKey = `${subjectCode}_${subjectName}`;
        
        // Nhóm các khoảng thời gian của cùng một môn
        if (!subjectGroups[subjectKey]) {
          subjectGroups[subjectKey] = {
            code: subjectCode,
            name: subjectName,
            teacher: teacherColumn ? row[teacherColumn] : '',
            timePeriods: []
          };
        }

        // Phân tích chuỗi thời gian có dạng "24/11/2025-07/12/2025"
        const dateRangeMatch = timeString.match(/(\d{1,2}\/\d{1,2}\/\d{4})-(\d{1,2}\/\d{1,2}\/\d{4})/);
        
        if (dateRangeMatch) {
          const startDate = dateRangeMatch[1];
          const endDate = dateRangeMatch[2];
          
          // Thêm thông tin khoảng thời gian vào nhóm môn học
          subjectGroups[subjectKey].timePeriods.push({
            startDate,
            endDate,
            room: roomColumn ? row[roomColumn] : '',
            period: periodColumn ? getTimeByPeriod(row[periodColumn]) : '',
            dayOfWeek: dayOfWeekName,
            dayOfWeekNumber: dayOfWeekNumber,
            timeRange: timeString
          });

        //   console.log(scheduleByDate);
          
          // Tạo danh sách các ngày trong khoảng thời gian
          const start = new Date(startDate.split('/').reverse().join('-'));
          const end = new Date(endDate.split('/').reverse().join('-'));
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Chỉ lấy những ngày trùng với thứ được chỉ định
            const currentDayOfWeek = d.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
            const targetDayOfWeek = getDayOfWeekNumber(dayOfWeekNumber);
            
            if (currentDayOfWeek === targetDayOfWeek) {
              const dateKey = d.toLocaleDateString('vi-VN');
              
              if (!scheduleByDate[dateKey]) {
                scheduleByDate[dateKey] = [];
              }
              
              const scheduleItem = {
                subject: subjectName,
                code: subjectCode,
                room: roomColumn ? row[roomColumn] : '',
                period: periodColumn ? getTimeByPeriod(row[periodColumn]) : '',
                teacher: teacherColumn ? row[teacherColumn] : '',
                dayOfWeek: dayOfWeekName,
                dayOfWeekNumber: dayOfWeekNumber,
                timeRange: timeString,
                subjectKey: subjectKey,
                rawData: row
              };
              
              scheduleByDate[dateKey].push(scheduleItem);
            }
          }
          
          if (subjectName) {
            subjects.add(subjectName);
          }
        }
      }
    });

    return { scheduleByDate, subjects: Array.from(subjects), subjectGroups };
  }, [data]);

  // Tạo lịch tháng
  const generateCalendar = () => {
    const today = new Date();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateKey = current.toLocaleDateString('vi-VN');
        const hasSchedule = scheduleData.scheduleByDate[dateKey] && 
                           scheduleData.scheduleByDate[dateKey].length > 0;
        const isCurrentMonth = current.getMonth() === currentMonth;
        const isToday = current.toDateString() === today.toDateString();
        
        weekDays.push({
          date: new Date(current),
          dateKey,
          hasSchedule,
          isCurrentMonth,
          isToday,
          dayNumber: current.getDate()
        });
        
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  // Hàm điều hướng tháng
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (!data || data.length === 0) return null;

  const calendar = generateCalendar();

  const handleDateClick = (dateInfo) => {
    if (dateInfo.hasSchedule) {
      setSelectedDate(dateInfo);
      setShowModal(true);
    }
  };

  return (
    <>
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header className="bg-dark text-white">
              <div className="d-flex justify-content-between align-items-center">
                <ButtonGroup size="sm">
                  <Button variant="outline-light" onClick={goToPreviousMonth}>
                    ‹ Trước
                  </Button>
                </ButtonGroup>
                
                <h5 className="mb-0">{currentMonth + 1}/{currentYear}</h5>
               
                  <Button size='sm' variant="outline-light" onClick={goToNextMonth}>
                    Sau ›
                  </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="calendar-table mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center">CN</th>
                    <th className="text-center">T2</th>
                    <th className="text-center">T3</th>
                    <th className="text-center">T4</th>
                    <th className="text-center">T5</th>
                    <th className="text-center">T6</th>
                    <th className="text-center">T7</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      {week.map((day, dayIndex) => (
                        <td 
                          key={dayIndex}
                          className={`calendar-day text-center p-3 position-relative ${
                            !day.isCurrentMonth ? 'text-muted bg-light' : ''
                          } ${day.isToday ? 'bg-warning bg-opacity-25' : ''} ${
                            day.hasSchedule ? 'calendar-day-has-schedule' : ''
                          }`}
                          style={{ 
                            height: '80px', 
                            cursor: day.hasSchedule ? 'pointer' : 'default',
                            borderRight: '1px solid #dee2e6',
                            borderBottom: '1px solid #dee2e6'
                          }}
                          onClick={() => handleDateClick(day)}
                        >
                          <div className="fw-bold">{day.dayNumber}</div>
                          {day.hasSchedule && (
                            <div className="position-absolute schedule-indicator" style={{top: "-5px", right: "10px"}}>
                              <div 
                                className="bg-danger rounded-circle"
                                style={{ width: '8px', height: '8px', marginTop: '15px' }}
                              ></div>
                              
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer className="text-muted">
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Modal hiển thị chi tiết lịch học */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="d-none d-sm-inline">📅 Lịch học ngày {selectedDate?.dateKey}</span>
            <span className="d-sm-none">📅 {selectedDate?.dateKey}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDate && scheduleData.scheduleByDate[selectedDate.dateKey] && (
            <div>
              {/* Nhóm các môn học theo subjectKey */}
              {Object.values(
                scheduleData.scheduleByDate[selectedDate.dateKey].reduce((groups, item) => {
                  if (!groups[item.subjectKey]) {
                    groups[item.subjectKey] = {
                      subject: item.subject,
                      code: item.code,
                      teacher: item.teacher,
                      sessions: []
                    };
                  }
                  groups[item.subjectKey].sessions.push({
                    room: item.room,
                    period: item.period,
                    dayOfWeek: item.dayOfWeek,
                    dayOfWeekNumber: item.dayOfWeekNumber,
                    timeRange: item.timeRange
                  });
                  return groups;
                }, {})
              ).map((groupedItem, index) => (
                <Card key={index} className="mb-3">
                  <Card.Body>
                    <Row>
                      <Col md={12}>
                        <h6 className="text-primary mb-2">
                          <Badge bg="primary" className="me-2">{groupedItem.code}</Badge>
                          {groupedItem.subject}
                        </h6>
                        {groupedItem.teacher && (
                          <p className="mb-2">
                            <strong>👨‍🏫 Giảng viên:</strong> {groupedItem.teacher}
                          </p>
                        )}
                        {groupedItem.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="ms-3 mt-1 p-2 bg-light rounded">
                              <Row>
                                <Col xs={12} md={6}>
                                  {session.period && (
                                    <div className="mb-1"><strong>⏰ Thời gian:</strong> {session.period}</div>
                                  )}
                                </Col>
                                <Col xs={12} md={6}>
                                  {session.room && (
                                    <div className="mb-1"><strong>🏢 Phòng:</strong> {session.room}</div>
                                  )}
                                </Col>
                              </Row>
                            </div>
                          ))}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Thống kê tổng quan */}
      {/* <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">📊 Thống Kê Thời Khóa Biểu</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>📈 Tổng quan</h6>
                  <ul className="list-unstyled">
                    <li><Badge bg="primary">Tổng số bản ghi:</Badge> <strong>{data.length}</strong></li>
                    <li><Badge bg="success">Số môn học:</Badge> <strong>{Object.keys(scheduleData.subjectGroups).length}</strong></li>
                    <li><Badge bg="warning">Số ngày có lịch:</Badge> <strong>{Object.keys(scheduleData.scheduleByDate).length}</strong></li>
                    <li><Badge bg="info">Tổng khoảng thời gian:</Badge> <strong>
                      {Object.values(scheduleData.subjectGroups).reduce((total, group) => total + group.timePeriods.length, 0)}
                    </strong></li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>📚 Danh sách môn học</h6>
                  <div>
                    {Object.values(scheduleData.subjectGroups).slice(0, 6).map((group, index) => (
                      <div key={index} className="mb-2">
                        <Badge 
                          bg={getSubjectColor(group.name, index)} 
                          className="me-2"
                        >
                          {group.code}
                        </Badge>
                        <span className="me-2">{group.name}</span>
                        <Badge bg="secondary" className="ms-1">
                          {group.timePeriods.map(period => getDayOfWeekName(period.dayOfWeekNumber)).filter(Boolean).join(', ')} - {group.timePeriods.length} khoảng TG
                        </Badge>
                      </div>
                    ))}
                    {Object.keys(scheduleData.subjectGroups).length > 6 && (
                      <Badge bg="secondary">+{Object.keys(scheduleData.subjectGroups).length - 6} môn khác</Badge>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}
    </>
  );
};

export default ScheduleView;
