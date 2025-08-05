import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Navbar, Nav, Offcanvas, Container, Button, Toast, ToastContainer } from 'react-bootstrap';
import ExcelReader from './ExcelReader';
import ScheduleView from './ScheduleView';
import ExportCSV from './ExportCSV';
import getScheduleData from './getScheduleData';
import { LocalNotifications } from '@capacitor/local-notifications';
// import NotificationSettings from './components/NotificationSettings';

async function showAllScheduledNotifications() {
  try {
    const { notifications } = await LocalNotifications.getPending();

    if (notifications.length === 0) {
      alert('📭 Không có thông báo nào đã được lên lịch.');
      return;
    }

    const message = notifications.map((noti, index) => {
      const time = new Date(noti.schedule.at).toLocaleString();
      return `#${index + 1} - ID: ${noti.id}, Title: "${noti.title}", Body: "${noti.body}" Time: ${time}`;
    }).join('\n');

    alert(`🟢 Các thông báo đã lên lịch:\n\n${message}`);
  } catch (error) {
    console.error('Lỗi khi lấy thông báo:', error);
    alert('❌ Không thể lấy danh sách thông báo.');
  }
}


const countScheduledNotification = async () => {
  try {
    const { notifications } = await LocalNotifications.getPending();
    alert(notifications.length);
  } catch (error) {
    alert('Lỗi khi đếm thông báo:' + error);
  }
};


// xóa tất cả thông báo
async function clearNotification() {
  try {
    const pendingNotifications = await LocalNotifications.getPending();
    if (pendingNotifications.notifications.length > 0) {
      // Xóa từng thông báo một
      for (const notification of pendingNotifications.notifications) {
        await LocalNotifications.cancel({
          notifications: [
            {
              id: notification.id
            }
          ]
        });
      }
    }
  } catch (error) {
    console.error('Lỗi khi xóa thông báo:', error);
  }
}

const AppLayout = () => {
  const [show, setShow] = useState(false);
  const [activeSection, setActiveSection] = useState('home'); // home, schedule, settings
  const [scheduleData, setScheduleData] = useState(null);
  // const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // setActiveSection("schedule");

  const scheduleDatas = useMemo(() => {
      return getScheduleData(scheduleData);
    }, [scheduleData]);
  
    // Truy cập scheduleByDate
    const scheduleByDate = scheduleDatas.scheduleByDate;

  const handleSectionChange = (section) => {
    setActiveSection(section);
    handleClose();
  };



  // Callback để nhận dữ liệu từ ExcelReader
  const handleDataLoaded = useCallback((data, isFromUpload = false) => {
    setScheduleData(data);
    // clearNotification();

    // Chuyển sang trang lịch nếu:
    // 1. Đang ở trang chủ và có dữ liệu (lần đầu load app)
    // 2. Upload thành công từ trang chủ
    if (!hasInitialized && data && data.length > 0) {
      setActiveSection('schedule');
      setHasInitialized(true);
      setToastMessage('Đã tải dữ liệu lịch học thành công!');
      // setShowSuccessToast(true);
    } else if (isFromUpload && activeSection === 'home') {
      setActiveSection('schedule');
      setToastMessage('Upload file thành công! Đã chuyển đến trang lịch.');
      setShowSuccessToast(true);
    }
  }, [hasInitialized, activeSection]);


  // Effect để kiểm tra và chuyển hướng khi app khởi động
  useEffect(() => {
    // Kiểm tra nếu có dữ liệu từ localStorage khi app khởi động
    const checkInitialData = () => {
      try {
        const savedData = localStorage.getItem('scheduleData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.data && parsedData.data.length > 0 && !hasInitialized) {
            // Chỉ chuyển hướng nếu đang ở trang chủ
            if (activeSection === 'home') {
              setActiveSection('schedule');
            }
            setHasInitialized(true);
          }
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra dữ liệu khởi động:', error);
      }
    };

    // Delay nhỏ để đảm bảo component đã mount hoàn toàn
    const timer = setTimeout(checkInitialData, 100);
    return () => clearTimeout(timer);
  }, [hasInitialized, activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <ExcelReader onDataLoaded={handleDataLoaded} />;
      case 'schedule':
        return scheduleData ? (
          <ScheduleView
            data={scheduleData}
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
        );
      case 'settings':
        return (
          <Container className="py-4 pt-5 mt-5 fade-in-up">
            <div className="text-center">
              <h2 className='mb-4'>⚙️ Cài đặt ứng dụng</h2>

              <div className="row justify-content-center">
                <div className="col-md-8">
                  <div className="list-group d-flex flex-column" style={{ height: '65vh' }}>
                    <div className="list-group-item">
                      <div className="">
                        <div>
                          <h5 className="mb-1 mt-2">🔔 Thông báo</h5>
                        </div>
                        <div className='d-flex justify-content-around mt-3'>
                          <Button
                            style={{ fontSize: "0.7rem" }}
                            variant='danger'
                            size="sm"
                            onClick={countScheduledNotification}
                          >
                            Test số thông báo
                          </Button>
                          <Button
                            style={{ fontSize: "0.7rem" }}
                            variant='warning'
                            size="sm"
                            onClick={showAllScheduledNotifications}
                          >
                            Danh sách thông báo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1 mt-2">🗑️ Xóa dữ liệu</h5>
                          <p className="mb-1 text-muted" style={{ fontSize: "0.9rem", marginLeft: "30px" }}>Xóa toàn bộ dữ liệu</p>
                        </div>
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            localStorage.clear();
                            setScheduleData(null);
                            clearNotification();
                            setActiveSection('home');
                          }}
                        >
                          Xóa hết
                        </Button>
                      </div>
                    </div>
                    <div className="list-group-item mt-auto">
                      <div className="d-flex justify-content-start">
                        <div>
                          <h5 className="mb-1">📱 Thông tin ứng dụng</h5>
                          <small className="text-muted" style={{ fontSize: "0.9rem", marginLeft: "30px" }}>Ứng dụng quản lý thời khóa biểu sinh viên</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        );
      case 'exportcsv':
        return <ExportCSV data={scheduleByDate}></ExportCSV>
      default:
        return <ExcelReader onDataLoaded={handleDataLoaded} />;
    }
  };

  return (
    <>
      {/* Navbar với Hamburger Menu */}
      <Navbar bg="dark" variant="dark" expand={false} fixed="top" >
        <Container >
          <Button
            style={{ backgroundColor: 'transparent', border: 'none', color: 'white' }}
            onClick={handleShow}
            className="me-2"
          >
            <i className="bi bi-list fs-4"></i>
          </Button>
          <Navbar.Brand href="#" className="d-flex align-items-center">
            <i className="bi bi-calendar-check me-2"></i>
            Thời Khóa Biểu
          </Navbar.Brand>
        </Container>
      </Navbar>

      {/* Offcanvas Menu */}
      <Offcanvas show={show} onHide={handleClose} placement="start" className="offcanvas-custom">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <i className="bi bi-calendar-check me-2"></i>
            Menu
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            <Nav.Link
              className={`p-3 border-bottom ${activeSection === 'home' ? 'bg-primary text-white' : ''}`}
              onClick={() => handleSectionChange('home')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-house-door me-2"></i>
              Trang chủ
              <small className="d-block text-muted">Tải file Excel thời khóa biểu</small>
            </Nav.Link>

            <Nav.Link
              className={`p-3 border-bottom ${activeSection === 'schedule' ? 'bg-primary text-white' : ''}`}
              onClick={() => handleSectionChange('schedule')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-calendar3 me-2"></i>
                  Lịch học
                  <small className="d-block text-muted">Xem thời khóa biểu chi tiết</small>
                </div>
              </div>
            </Nav.Link>
            <Nav.Link
              className={`p-3 border-bottom ${activeSection === 'exportcsv' ? 'bg-primary text-white' : ''}`}
              onClick={() => handleSectionChange('exportcsv')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-calendar3 me-2"></i>
                  Xuất file csv
                  <small className="d-block text-muted">Tải về file csv</small>
                </div>
              </div>
            </Nav.Link>

            <Nav.Link
              className={`p-3 border-bottom ${activeSection === 'settings' ? 'bg-primary text-white' : ''}`}
              onClick={() => handleSectionChange('settings')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-gear me-2"></i>
              Cài đặt
              <small className="d-block text-muted">Thông báo và tùy chọn ứng dụng</small>
            </Nav.Link>
          </Nav>

          {/* Footer của menu */}
          <div className="mt-auto p-3 border-top bg-light">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Ứng dụng xem thời khóa biểu
            </small>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <div className="content-area">
        {renderContent()}
      </div>

      {/* Notification Settings Modal */}
      {/* {(
        <NotificationSettings
          show={showNotificationSettings}
          onHide={() => setShowNotificationSettings(false)}
          scheduleData={scheduleData}
        />
      )} */}

      {/* Success Toast */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          delay={4000}
          autohide
          bg="success"
          className="text-white"
        >
          <Toast.Header>
            <strong className="mt-2 me-auto"> <i className="bi bi-check"></i>Thành công</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default AppLayout;
