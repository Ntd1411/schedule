import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from 'react-bootstrap'
import NavBar from '~/components/NavBar'
import ExcelReader from './ExcelReader/ExcelReader'
import ScheduleView from './ScheduleView/ScheduleView'
import ExportCSV from './ExportCSV/ExportCSV'
import GradeView from './GradeView/GradeView'
import getScheduleData from '~/utils/getScheduleData'
import Setting from './Setting/Setting'
import ToastCustom from './Toast/ToastCustom'

const AppLayout = () => {
  const [show, setShow] = useState(false)
  const [activeSection, setActiveSection] = useState('home') // home, schedule, grades, settings, exportcsv
  const [scheduleData, setScheduleData] = useState(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [goToCurrentMonthFn, setGoToCurrentMonthFn] = useState(null)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  // setActiveSection("schedule")

  const scheduleDatas = useMemo(() => {
    return getScheduleData(scheduleData)
  }, [scheduleData])

  // Truy cập scheduleByDate
  const scheduleByDate = scheduleDatas.scheduleByDate

  const handleSectionChange = (section) => {
    setActiveSection(section)
    handleClose()
  }

  // Callback để nhận hàm goToCurrentMonth từ ScheduleView
  const handleGoToCurrentMonthCallback = useCallback((goToCurrentMonthFn) => {
    setGoToCurrentMonthFn(() => goToCurrentMonthFn)
  }, [])

  // Hàm xử lý khi bấm nút calendar trong navbar
  const handleCalendarButtonClick = () => {
    if (activeSection !== 'schedule') {
      // Nếu không ở trang schedule, chuyển đến trang schedule
      setActiveSection('schedule')
    } else if (goToCurrentMonthFn) {
      // Nếu đã ở trang schedule, quay về tháng hiện tại
      goToCurrentMonthFn()
    }
  }

  // Callback để nhận dữ liệu từ ExcelReader
  const handleDataLoaded = useCallback((data, isFromUpload = false) => {
    setScheduleData(data)
    // clearNotification()

    // Chuyển sang trang lịch nếu:
    // 1. Đang ở trang chủ và có dữ liệu (lần đầu load app)
    // 2. Upload thành công từ trang chủ
    if (!hasInitialized && data && data.length > 0) {
      setActiveSection('schedule')
      setHasInitialized(true)
      setToastMessage('Đã tải dữ liệu lịch học thành công!')
      // setShowSuccessToast(true)
    } else if (isFromUpload && activeSection === 'home') {
      setActiveSection('schedule')
      setToastMessage('Upload file thành công! Đã chuyển đến trang lịch.')
      setShowSuccessToast(true)
    }
  }, [hasInitialized, activeSection])


  // Effect để kiểm tra và chuyển hướng khi app khởi động
  useEffect(() => {
    // Kiểm tra nếu có dữ liệu từ localStorage khi app khởi động
    const checkInitialData = () => {
      try {
        const savedData = localStorage.getItem('scheduleData')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          if (parsedData.data && parsedData.data.length > 0 && !hasInitialized) {
            // Chỉ chuyển hướng nếu đang ở trang chủ
            if (activeSection === 'home') {
              setActiveSection('schedule')
            }
            setHasInitialized(true)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Lỗi khi kiểm tra dữ liệu khởi động:', error)
      }
    }

    // Delay nhỏ để đảm bảo component đã mount hoàn toàn
    const timer = setTimeout(checkInitialData, 100)
    return () => clearTimeout(timer)
  }, [hasInitialized, activeSection])

  const renderContent = () => {
    switch (activeSection) {
    case 'home':
      return <ExcelReader onDataLoaded={handleDataLoaded} />
    case 'schedule':
      return scheduleData ? (
        <ScheduleView
          data={scheduleData}
          onGoToCurrentMonth={handleGoToCurrentMonthCallback}
        />
      ) : (
        <div className="text-center py-5">
          <h4>Chưa có dữ liệu lịch học</h4>
          <p className="text-muted">Vui lòng tải file Excel ở trang chủ</p>
          <Button
            variant="primary"
            onClick={() => handleSectionChange('home')}
          >
            Đi đến trang chủ
          </Button>
        </div>
      )
    case 'grades':
      return <GradeView />
    case 'settings':
      return <Setting setScheduleData={setScheduleData} setActiveSection={setActiveSection} />
    case 'exportcsv':
      return <ExportCSV data={scheduleByDate}></ExportCSV>
    default:
      return <ExcelReader onDataLoaded={handleDataLoaded} />
    }
  }

  return (
    <>
      <NavBar
        activeSection={activeSection}
        handleCalendarButtonClick={handleCalendarButtonClick}
        handleClose={handleClose}
        handleSectionChange={handleSectionChange}
        handleShow={handleShow}
        show={show}
      />

      {/* Main Content */}
      <div className="content-area">
        {renderContent()}
      </div>

      <ToastCustom
        setShowSuccessToast={setShowSuccessToast}
        showSuccessToast={showSuccessToast}
        toastMessage={toastMessage}
      />
    </>
  )
}

export default AppLayout
