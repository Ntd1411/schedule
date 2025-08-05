import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Modal, Button, Dropdown, ButtonGroup, CardHeader } from 'react-bootstrap';
import getScheduleData from './getScheduleData';
import { Capacitor } from '@capacitor/core';

const ScheduleView = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState({
    date: new Date(0),
    dateKey: "1/1/1970",
    hasSchedule: false,
    isCurrentMonth: false,
    isToday: false,
    isSelectedDate: false,
    dayNumber: 0
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSwipeFeedback, setShowSwipeFeedback] = useState({ show: false, direction: '' });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for swipe handling
  const calendarRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const swipeThreshold = 50; // Minimum distance for swipe



  // Phân tích cấu trúc dữ liệu Excel
  const scheduleData = useMemo(() => {
    return getScheduleData(data);
  }, [data]);

  // Tạo lịch tháng cho một tháng cụ thể
  const generateCalendarForMonth = (year, month) => {
    const today = new Date();

    const firstDay = new Date(year, month, 1);
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
        const isCurrentMonth = current.getMonth() === month;
        // console.log(selectedDate);
        const isSelectedDate = selectedDate.date.toDateString() === current.toDateString();
        const isToday = current.toDateString() === today.toDateString();

        weekDays.push({
          date: new Date(current),
          dateKey,
          hasSchedule,
          isCurrentMonth,
          isToday,
          isSelectedDate,
          dayNumber: current.getDate()
        });

        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }

    return calendar;
  };

  // Tạo 3 tháng: trước, hiện tại, sau
  const generate3MonthsCalendar = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    return {
      prev: {
        calendar: generateCalendarForMonth(prevYear, prevMonth),
        month: prevMonth,
        year: prevYear
      },
      current: {
        calendar: generateCalendarForMonth(currentYear, currentMonth),
        month: currentMonth,
        year: currentYear
      },
      next: {
        calendar: generateCalendarForMonth(nextYear, nextMonth),
        month: nextMonth,
        year: nextYear
      }
    };
  };

  // Hàm điều hướng tháng
  const goToPreviousMonth = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNextMonth = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }

    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (isTransitioning) return;

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    isDraggingRef.current = false;
    setSwipeOffset(0);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || isTransitioning) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;

    // Reset offset và feedback
    setSwipeOffset(0);
    setShowSwipeFeedback({ show: false, direction: '' });

    // Thực hiện chuyển tháng nếu swipe đủ xa
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        goToPreviousMonth();
      } else {
        goToNextMonth();
      }
    }

    // Reset refs
    touchStartRef.current = { x: 0, y: 0 };
    touchEndRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
  };

  // Add event listeners with passive: false option using useEffect
  useEffect(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    const handleTouchMovePassive = (e) => {
      if (!touchStartRef.current.x || isTransitioning) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartRef.current.x;
      const deltaY = currentY - touchStartRef.current.y;

      // Chỉ xử lý horizontal swipe nếu deltaX > deltaY
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        e.preventDefault();
        isDraggingRef.current = true;

        // Tính toán offset dựa trên container width
        const containerWidth = calendarElement.offsetWidth || 400;
        const maxOffset = containerWidth * 0.3; // Tối đa 30% width
        const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.8));
        setSwipeOffset(limitedOffset);

        // Hiển thị feedback
        if (Math.abs(deltaX) > swipeThreshold * 0.6) {
          setShowSwipeFeedback({
            show: true,
            direction: deltaX > 0 ? 'left' : 'right'
          });
        } else {
          setShowSwipeFeedback({ show: false, direction: '' });
        }
      }

      touchEndRef.current = { x: currentX, y: currentY };
    };

    // Add event listeners with passive: false
    calendarElement.addEventListener('touchmove', handleTouchMovePassive, { passive: false });

    // Cleanup function
    return () => {
      calendarElement.removeEventListener('touchmove', handleTouchMovePassive);
    };
  }, [isTransitioning, swipeThreshold]);

  // Mouse events for desktop
  const handleMouseDown = (e) => {
    if (isTransitioning) return;

    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    isDraggingRef.current = false;
    setSwipeOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!touchStartRef.current.x || !e.buttons || isTransitioning) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
      isDraggingRef.current = true;

      const containerWidth = calendarRef.current?.offsetWidth || 400;
      const maxOffset = containerWidth * 0.3;
      const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.8));
      setSwipeOffset(limitedOffset);

      if (Math.abs(deltaX) > swipeThreshold * 0.6) {
        setShowSwipeFeedback({
          show: true,
          direction: deltaX > 0 ? 'left' : 'right'
        });
      } else {
        setShowSwipeFeedback({ show: false, direction: '' });
      }
    }

    touchEndRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current || isTransitioning) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;

    setSwipeOffset(0);
    setShowSwipeFeedback({ show: false, direction: '' });

    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        goToPreviousMonth();
      } else {
        goToNextMonth();
      }
    }

    touchStartRef.current = { x: 0, y: 0 };
    touchEndRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
  };

  if (!data || data.length === 0) return null;

  const threeMonthsData = generate3MonthsCalendar();

  const handleDateClick = (dateInfo) => {
    // Không xử lý click nếu đang trong quá trình swipe
    if (isDraggingRef.current || Math.abs(swipeOffset) > 10) {
      return;
    }

    if (dateInfo.hasSchedule) {
      setSelectedDate(dateInfo);
    }
  };

  // Render calendar table cho một tháng
  const renderCalendarTable = (calendar) => {
    return (
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
                  className={`calendar-day text-center p-3 position-relative ${!day.isCurrentMonth ? 'text-muted' : ''
                    } ${day.isToday ? 'bg-warning bg-opacity-25' : ''} ${day.hasSchedule ? 'calendar-day-has-schedule' : ''
                    } ${day.isSelectedDate ? 'calendar-day-selected' : ''}`}
                  style={{
                    cursor: day.hasSchedule ? 'pointer' : 'default',
                    borderRadius: '15px',
                    margin: '5px',
                    borderRight: '1px solid #dee2e6',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: day.isSelectedDate ? 'rgb(220, 53, 69)' : '',
                    color: day.isSelectedDate ? '#fff' : '',
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="fw-bold">{day.dayNumber}</div>
                  {day.hasSchedule && (
                    <div className="position-absolute schedule-indicator" style={{ top: "-5px", right: "10px" }}>
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
    );
  };

  return (
    <>
      <Row className='fade-in-up' style={{ margin: "24px 0 0px", padding: "0" }}>
        <Col className='p-0'>
          <Card className='w-100 mb-0'>
            <Card.Header className="bg-dark text-white">
              <div className={Capacitor.isNativePlatform() ? 'text-center' : 'd-flex justify-content-between align-items-center'}>
                {!Capacitor.isNativePlatform() ? <ButtonGroup size="sm">
                  <Button variant="dark" onClick={goToPreviousMonth} disabled={isTransitioning}>
                    ‹ Trước
                  </Button>
                </ButtonGroup> : ''}
                <h5 className="mb-0">{currentMonth + 1}/{currentYear}</h5>
                {!Capacitor.isNativePlatform() ? <Button size='sm' variant="dark" onClick={goToNextMonth} disabled={isTransitioning}>
                  Sau ›
                </Button> : ''}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div
                className="calendar-container position-relative"
                ref={calendarRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
              >
                {/* Swipe feedback indicators */}
                {showSwipeFeedback.show && (
                  <div className={`calendar-swipe-feedback ${showSwipeFeedback.direction}`}>
                    {showSwipeFeedback.direction === 'left' ? '‹' : '›'}
                  </div>
                )}

                <div
                  className="calendar-wrapper"
                  style={{
                    transform: `translateX(calc(-33.333% + ${swipeOffset}px))`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  {/* Tháng trước */}
                  <div className="calendar-month">
                    {renderCalendarTable(threeMonthsData.prev.calendar)}
                  </div>

                  {/* Tháng hiện tại */}
                  <div className="calendar-month">
                    {renderCalendarTable(threeMonthsData.current.calendar)}
                  </div>

                  {/* Tháng sau */}
                  <div className="calendar-month">
                    {renderCalendarTable(threeMonthsData.next.calendar)}
                  </div>
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="text-muted">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {selectedDate && scheduleData.scheduleByDate[selectedDate.dateKey] && (
        <div className='fade-in-up' key={selectedDate.dateKey}>
          <Card className='mb-0'>
            <Card.Header className="bg-danger text-white fw-bold text-center">
              Ngày {selectedDate.date.getDate()}/{selectedDate.date.getMonth() + 1}/{selectedDate.date.getFullYear()}
            </Card.Header>
          </Card>

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
            <Card key={index} className="mb-0">
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <h6 className="text-danger" style={{ fontSize: '0.9rem' }}>
                      <Badge bg="danger" className="me-2">{groupedItem.code}</Badge>
                      {groupedItem.subject} ({groupedItem.teacher})
                    </h6>

                  </Col>
                  {groupedItem.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="bg-light" style={{ fontSize: '0.8rem' }}>
                      <Col xs={12} md={6}>
                        {session.period && (
                          <div className="mb-1 text-muted"><strong>Thời gian:</strong> {session.period}, {session.room}</div>
                        )}
                      </Col>
                    </div>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};
export default ScheduleView;

