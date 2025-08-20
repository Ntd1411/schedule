import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Card, Table, Badge, Row, Col, Modal, Button, Dropdown, ButtonGroup, CardHeader } from 'react-bootstrap'
import getScheduleData from '~/utils/getScheduleData'
import { Capacitor } from '@capacitor/core'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'


const ScheduleView = ({ data, onGoToCurrentMonth }) => {
  const swiper = useRef(null)

  // Phân tích cấu trúc dữ liệu Excel
  const scheduleData = useMemo(() => {
    return getScheduleData(data)
  }, [data])
  const [selectedDate, setSelectedDate] = useState({
    date: new Date(),
    dateKey: new Date().toLocaleDateString('vi-VN'),
    hasSchedule: scheduleData.scheduleByDate[new Date().toLocaleDateString('vi-VN')]
      && scheduleData.scheduleByDate[new Date().toLocaleDateString('vi-VN')].length > 0,
    isCurrentMonth: true,
    isToday: true,
    isSelectedDate: true,
    dayNumber: new Date().getDate()
  })

  const currentYear = new Date().getFullYear()
  const [prevYearGenerated, setPrevYearGenerated] = useState(currentYear - 1)
  const [nextYearGenerated, setNextYearGenerated] = useState(currentYear + 2)


  // Tạo lịch tháng cho một tháng cụ thể
  const generateCalendarForMonth = useCallback((year, month) => {
    const today = new Date()
    month = month - 1

    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const calendar = []
    const current = new Date(startDate)

    for (let week = 0; week < 6; week++) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        const dateKey = current.toLocaleDateString('vi-VN')
        const hasSchedule = scheduleData.scheduleByDate[dateKey] &&
          scheduleData.scheduleByDate[dateKey].length > 0
        const isCurrentMonth = current.getMonth() === month
        const isSelectedDate = selectedDate.date.toDateString() === current.toDateString()
        const isToday = current.toDateString() === today.toDateString()

        weekDays.push({
          date: new Date(current),
          dateKey,
          hasSchedule,
          isCurrentMonth,
          isToday,
          isSelectedDate,
          dayNumber: current.getDate()
        })

        current.setDate(current.getDate() + 1)
      }
      calendar.push(weekDays)
    }
    month++

    return { month, year, calendar }
  }, [selectedDate, scheduleData])

  const generateTwoYearCalendar = useCallback(() => {
    const calendar = []

    for (let month = 1; month < 13; month++) {
      calendar.push(generateCalendarForMonth(currentYear, month))
    }
    for (let month = 1; month < 13; month++) {
      calendar.push(generateCalendarForMonth(currentYear + 1, month))
    }

    return calendar
  }, [generateCalendarForMonth, currentYear])

  const [calendarData, setCalendarData] = useState([])

  // Tạo lại calendar mỗi khi selectedDate thay đổi
  useEffect(() => {
    const newCalendarData = generateTwoYearCalendar()
    setCalendarData(newCalendarData)
  }, [generateTwoYearCalendar])


  const handleDateClick = (dateInfo) => {
    setSelectedDate(dateInfo)
  }

  // Hàm để quay về tháng hiện tại
  const goToCurrentMonth = useCallback(() => {
    if (!swiper.current) return

    const now = new Date()
    const currentMonthIndex = now.getMonth() // 0-11
    const currentYearNum = now.getFullYear()

    // Tìm index của slide tương ứng với tháng hiện tại
    let targetSlideIndex = -1

    calendarData.forEach((monthData, index) => {
      if (monthData.year === currentYearNum && monthData.month === currentMonthIndex + 1) {
        targetSlideIndex = index
      }
    })

    if (targetSlideIndex !== -1) {
      swiper.current.slideTo(targetSlideIndex, 500)
    }
  }, [calendarData])

  // Đăng ký callback với component cha
  useEffect(() => {
    if (onGoToCurrentMonth) {
      onGoToCurrentMonth(goToCurrentMonth)
    }
  }, [goToCurrentMonth, onGoToCurrentMonth])

  const handleReachBeginning = useCallback(() => {
    if (swiper.current?.activeIndex === 1) {
      const prevYearCalendar = []

      // Thêm năm trước vào đầu
      for (let month = 1; month < 13; month++) {
        prevYearCalendar.push(generateCalendarForMonth(prevYearGenerated, month))
      }

      setCalendarData([...prevYearCalendar, ...calendarData])
      setPrevYearGenerated(prevYearGenerated - 1)

      requestAnimationFrame(() => {
        swiper.current.slideTo(12, 0, false) // Di chuyển đến slide tương ứng với tháng hiện tại
      })
    }
  }, [generateCalendarForMonth, prevYearGenerated, calendarData])

  const handleReachEnd = useCallback(() => {
    const totalSlides = calendarData.length
    if (swiper.current?.activeIndex === totalSlides - 2) {
      const nextYearCalendar = []

      // Thêm năm mới vào cuối
      for (let month = 1; month < 13; month++) {
        nextYearCalendar.push(generateCalendarForMonth(nextYearGenerated, month))
      }

      setCalendarData([...calendarData, ...nextYearCalendar])
      setNextYearGenerated(nextYearGenerated + 1)
    }
  }, [generateCalendarForMonth, nextYearGenerated, calendarData])

  if (!data || data.length === 0) return null

  // Render calendar table cho một tháng
  const renderCalendarTable = () => {
    return (
      <>
        {calendarData.map((calendarMonth, index) =>
          <SwiperSlide key={index}>
            <Card className='w-100 mb-0 calendar-month'>
              <Card.Header className="bg-dark text-white">
                <div className={Capacitor.isNativePlatform() ? 'text-center' : 'd-flex justify-content-between align-items-center'}>
                  {!Capacitor.isNativePlatform() ? <ButtonGroup size="sm">
                    <Button variant="dark" onClick={() => swiper.current?.slidePrev(500)}>
                      ‹ Trước
                    </Button>
                  </ButtonGroup> : ''}
                  <h5 className="mb-0">{calendarMonth.month.toString().padStart(2, '0')}/{calendarMonth.year}</h5>
                  {!Capacitor.isNativePlatform() ? <Button size='sm' variant="dark" onClick={() => swiper.current?.slideNext(500)}>
                    Sau ›
                  </Button> : ''}
                </div>
              </Card.Header>
              <Card.Body className="p-0 calendar-container">
                <div className='calendar-wrapper'>
                  <div className="calendar-month">
                    <Table className="calendar-table mb-0">
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
                        {calendarMonth.calendar.map((week, weekIndex) => (
                          <tr key={weekIndex}>
                            {week.map((day, dayIndex) => (
                              <td
                                key={dayIndex}
                                className={`calendar-day text-center p-3 position-relative ${!day.isCurrentMonth ? 'text-muted' : ''
                                } ${day.isToday ? 'bg-warning bg-opacity-50 calendar-today' : ''} ${day.hasSchedule ? 'calendar-day-has-schedule' : ''
                                } ${day.isSelectedDate ? 'calendar-day-selected' : ''}`}
                                style={{
                                  cursor: day.hasSchedule ? 'pointer' : 'default',
                                  borderRadius: '15px',
                                  margin: '5px',
                                  borderRight: '1px solid rgba(185, 185, 185, 1)',
                                  borderBottom: '1px solid #adadadff',
                                  backgroundColor: day.isSelectedDate ? 'rgb(220, 53, 69)' : '',
                                  color: day.isSelectedDate ? '#fff' : ''
                                }}
                                onClick={() => handleDateClick(day)}
                              >
                                <div className="fw-bold">{day.dayNumber}</div>
                                {day.hasSchedule && (
                                  <div className="position-absolute schedule-indicator" style={{ top: '-5px', right: '10px' }}>
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
                  </div>
                </div>
              </Card.Body>
              <Card.Footer className="">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                </div>
              </Card.Footer>
            </Card>
          </SwiperSlide>
        )}
      </>
    )
  }

  return (
    <>
      <Row className='fade-in-up' style={{ margin: '24px 0 0px', padding: '0' }}>
        <Col className='p-0 d-flex calendar-wrapper'>
          <Swiper
            resistanceRatio={0.65}
            threshold={10}
            touchStartPreventDefault={false}
            followFinger={true} // vuốt theo ngón tay
            shortSwipes={true} // vuốt ngắn vẫn nhận
            longSwipesRatio={0.15} // tỷ lệ vuốt cần để đổi slide
            touchMoveStopPropagation={true}
            passiveListeners={true}
            speed={500}
            spaceBetween={1}
            onReachEnd={handleReachEnd}
            onReachBeginning={handleReachBeginning}
            onSwiper={(s) => (swiper.current = s)}
            initialSlide={
              new Date().getFullYear() === currentYear
                ? new Date().getMonth()
                : 0
            }
            className='calendar-wrapper'>
            {renderCalendarTable()}
          </Swiper>
        </Col>
      </Row>

      {selectedDate && !scheduleData.scheduleByDate[selectedDate.dateKey] &&
        <div className='fade-in-up' key={selectedDate.date.getDate() + selectedDate.date.getMonth()}>
          <Card className='mb-0'>
            <Card.Header className="bg-danger text-white fw-bold text-center">
              {selectedDate.date.getDate().toString().padStart(2, '0')}/{(selectedDate.date.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.date.getFullYear()}
            </Card.Header>
          </Card>
          <Card>
            <Card.Header className='text-center pb-4 pt-4'>
              Không có dữ liệu
            </Card.Header>
          </Card>
        </div>
      }

      {selectedDate && scheduleData.scheduleByDate[selectedDate.dateKey] && (
        <div className='fade-in-up' key={selectedDate.dateKey}>
          <Card className='mb-0'>
            <Card.Header className="bg-danger text-white fw-bold text-center">
              {selectedDate.date.getDate().toString().padStart(2, '0')}/{(selectedDate.date.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.date.getFullYear()}
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
                }
              }
              groups[item.subjectKey].sessions.push({
                room: item.room,
                period: item.period,
                dayOfWeek: item.dayOfWeek,
                dayOfWeekNumber: item.dayOfWeekNumber,
                timeRange: item.timeRange
              })
              return groups
            }, {})
          ).map((groupedItem, index) => (
            <Card key={index} className="mb-0">
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <h6 className="text-danger" style={{ fontSize: '0.9rem' }}>
                      <Badge bg="danger" className="me-2">{groupedItem.code}</Badge>
                      {groupedItem.subject}
                    </h6>

                  </Col>
                  {groupedItem.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="bg-light" style={{ fontSize: '0.8rem' }}>
                      <Col xs={12} md={6}>
                        {session.period && (
                          <div className="mb-1 text-muted"><strong>Giảng viên:</strong> {groupedItem.teacher}</div>
                        )}
                      </Col>
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
  )
}
export default ScheduleView

