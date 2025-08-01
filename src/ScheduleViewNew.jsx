import React, { useState, useMemo } from 'react';
import { Card, Table, Badge, Row, Col, Modal, Button } from 'react-bootstrap';

const ScheduleView = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Hàm để tạo màu cho các môn học khác nhau
  const getSubjectColor = (subject, index) => {
    const colors = ['primary', 'success', 'danger', 'warning', 'info', 'secondary'];
    return colors[index % colors.length];
  };

  // Hàm chuyển đổi tên thứ sang số
  const getDayOfWeekNumber = (dayName) => {
    const dayMap = {
      'chủ nhật': 0, 'cn': 0,
      'thứ hai': 1, 'thứ 2': 1, 't2': 1,
      'thứ ba': 2, 'thứ 3': 2, 't3': 2,
      'thứ tư': 3, 'thứ 4': 3, 't4': 3,
      'thứ năm': 4, 'thứ 5': 4, 't5': 4,
      'thứ sáu': 5, 'thứ 6': 5, 't6': 5,
      'thứ bảy': 6, 'thứ 7': 6, 't7': 6
    };
    return dayMap[dayName.toLowerCase()] ?? -1;
  };

  // Phân tích cấu trúc dữ liệu Excel
  const scheduleData = useMemo(() => {
    if (!data || data.length === 0) return { scheduleByDate: {}, subjects: [], subjectGroups: {} };

    const scheduleByDate = {};
    const subjects = new Set();
    const subjectGroups = {}; // Nhóm các môn học theo mã/tên

    data.forEach(row => {
      // Tìm cột thời gian học (có thể chứa định dạng ngày)
      const timeColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('thời gian') || 
        key.toLowerCase().includes('time') ||
        (row[key] && typeof row[key] === 'string' && row[key].includes('/'))
      );

      // Tìm cột tên môn học
      const subjectColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('tên học phần') ||
        key.toLowerCase().includes('môn học') ||
        key.toLowerCase().includes('học phần')
      );

      // Tìm cột mã học phần
      const codeColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('mã học phần') ||
        key.toLowerCase().includes('mã môn')
      );

      // Tìm cột phòng học
      const roomColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('phòng') ||
        key.toLowerCase().includes('room')
      );

      // Tìm cột tiết học
      const periodColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('tiết') ||
        key.toLowerCase().includes('period')
      );

      // Tìm cột giảng viên
      const teacherColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('cbgd') ||
        key.toLowerCase().includes('giảng viên') ||
        key.toLowerCase().includes('teacher')
      );

      // Tìm cột thứ trong tuần
      const dayOfWeekColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes('thứ') ||
        key.toLowerCase().includes('ngày trong tuần')
      );

      if (timeColumn && row[timeColumn]) {
        const timeString = row[timeColumn].toString();
        const subjectName = subjectColumn ? row[subjectColumn] : 'Môn học';
        const subjectCode = codeColumn ? row[codeColumn] : '';
        const dayOfWeek = dayOfWeekColumn ? row[dayOfWeekColumn] : '';
        
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

        // Phân tích chuỗi thời gian có dạng "11/08/2025-31/08/2025"
        const dateRangeMatch = timeString.match(/(\d{1,2}\/\d{1,2}\/\d{4})-(\d{1,2}\/\d{1,2}\/\d{4})/);
        
        if (dateRangeMatch) {
          const startDate = dateRangeMatch[1];
          const endDate = dateRangeMatch[2];
          
          // Thêm thông tin khoảng thời gian vào nhóm môn học
          subjectGroups[subjectKey].timePeriods.push({
            startDate,
            endDate,
            room: roomColumn ? row[roomColumn] : '',
            period: periodColumn ? row[periodColumn] : '',
            dayOfWeek: dayOfWeek,
            timeRange: timeString
          });
          
          // Tạo danh sách các ngày trong khoảng thời gian
          const start = new Date(startDate.split('/').reverse().join('-'));
          const end = new Date(endDate.split('/').reverse().join('-'));
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Kiểm tra thứ trong tuần nếu có
            const currentDayOfWeek = d.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
            let shouldInclude = true;
            
            if (dayOfWeek) {
              const dayOfWeekNum = getDayOfWeekNumber(dayOfWeek);
              shouldInclude = currentDayOfWeek === dayOfWeekNum;
            }
            
            if (shouldInclude) {
              const dateKey = d.toLocaleDateString('vi-VN');
              
              if (!scheduleByDate[dateKey]) {
                scheduleByDate[dateKey] = [];
              }
              
              const scheduleItem = {
                subject: subjectName,
                code: subjectCode,
                room: roomColumn ? row[roomColumn] : '',
                period: periodColumn ? row[periodColumn] : '',
                teacher: teacherColumn ? row[teacherColumn] : '',
                dayOfWeek: dayOfWeek,
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
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
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

  if (!data || data.length === 0) return null;

  const calendar = generateCalendar();
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const today = new Date();

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
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">📅 {monthNames[today.getMonth()]} {today.getFullYear()}</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="calendar-table mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center">Chủ Nhật</th>
                    <th className="text-center">Thứ Hai</th>
                    <th className="text-center">Thứ Ba</th>
                    <th className="text-center">Thứ Tư</th>
                    <th className="text-center">Thứ Năm</th>
                    <th className="text-center">Thứ Sáu</th>
                    <th className="text-center">Thứ Bảy</th>
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
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <div 
                                className="bg-danger rounded-circle"
                                style={{ width: '8px', height: '8px', marginTop: '15px' }}
                              ></div>
                              <small className="text-primary fw-bold">
                                {Object.keys(
                                  scheduleData.scheduleByDate[day.dateKey].reduce((groups, item) => {
                                    groups[item.subjectKey] = true;
                                    return groups;
                                  }, {})
                                ).length} môn
                              </small>
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
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="me-3">
                    <span className="bg-danger rounded-circle d-inline-block me-1" 
                          style={{ width: '8px', height: '8px' }}></span>
                    Có lịch học
                  </span>
                  <span className="me-3">
                    <span className="bg-warning bg-opacity-25 d-inline-block me-1 border" 
                          style={{ width: '12px', height: '12px' }}></span>
                    Hôm nay
                  </span>
                </div>
                <div>
                  <strong>Tổng: {Object.keys(scheduleData.subjectGroups).length} môn học</strong>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Modal hiển thị chi tiết lịch học */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            📅 Lịch học ngày {selectedDate?.dateKey}
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
                        
                        {/* Hiển thị tất cả các buổi học của môn này */}
                        <div className="mt-2">
                          <strong>📅 Các buổi học:</strong>
                          {groupedItem.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="ms-3 mt-1 p-2 bg-light rounded">
                              <Row>
                                <Col md={6}>
                                  {session.room && (
                                    <div><strong>🏢 Phòng:</strong> {session.room}</div>
                                  )}
                                  {session.period && (
                                    <div><strong>⏰ Tiết:</strong> {session.period}</div>
                                  )}
                                </Col>
                                <Col md={6}>
                                  {session.dayOfWeek && (
                                    <div><strong>📆 Thứ:</strong> {session.dayOfWeek}</div>
                                  )}
                                  {session.timeRange && (
                                    <div><strong>📊 Khoảng thời gian:</strong> 
                                      <small className="text-muted"> {session.timeRange}</small>
                                    </div>
                                  )}
                                </Col>
                              </Row>
                            </div>
                          ))}
                        </div>
                      </Col>
                      <Col md={12} className="text-end mt-2">
                        <Badge bg={getSubjectColor(groupedItem.subject, index)} className="me-1">
                          {groupedItem.sessions.length} buổi học
                        </Badge>
                        <Badge bg="secondary">
                          Môn #{index + 1}
                        </Badge>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Thống kê tổng quan */}
      <Row className="mt-4">
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
                          {group.timePeriods.length} khoảng TG
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
      </Row>
    </>
  );
};

export default ScheduleView;
