import AppLayout from './AppLayout'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { LocalNotifications } from '@capacitor/local-notifications';
import { useEffect, useState } from 'react';

function App() {
  const [notificationPermission, setNotificationPermission] = useState('prompt');

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Kiểm tra quyền thông báo hiện tại
        const status = await LocalNotifications.checkPermissions();
        setNotificationPermission(status.display);

        // Yêu cầu quyền nếu chưa có
        if (status.display === 'prompt') {
          const perm = await LocalNotifications.requestPermissions();
          setNotificationPermission(perm.display);
        }

        // Gửi thông báo welcome nếu có quyền
        if (status.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: 'Ứng dụng đã sẵn sàng',
                body: 'Bạn sẽ nhận được thông báo trước khi môn học bắt đầu',
                // schedule: { at: new Date(Date.now() + 60000) },
                id: 1,
                smallIcon: 'ic_stat_notify',
              },
            ],
          });
          // const { notifications } = await LocalNotifications.getPending();
          // alert('🟢 Đã lên lịch:' + notifications.length);
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo thông báo:', error);
      }
    };

    // console.log("app");
    initializeNotifications();
  }, []);



  return (
    <div className="w-100 min-vh-100 bg-light">
      {notificationPermission === 'denied' && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1050 }}>
          <div className="alert alert-warning alert-dismissible" role="alert">
            <strong>⚠️ Thông báo bị tắt</strong>
            <small className="d-block">Vui lòng bật thông báo trong cài đặt để nhận nhắc nhở lịch học</small>
          </div>
        </div>
      )}
      <AppLayout />
    </div>
  )
}

export default App
