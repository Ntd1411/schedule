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
        let status = await LocalNotifications.checkPermissions();
        setNotificationPermission(status.display);

        // Yêu cầu quyền nếu chưa có
        if (status.display === 'prompt') {
          const perm = await LocalNotifications.requestPermissions();
          setNotificationPermission(perm.display);
        }

        status = await LocalNotifications.checkPermissions();

        // Gửi thông báo welcome nếu có quyền
        if (status.display === 'granted') {
          const greetings = [
            "📅 Hôm nay có học không? Mở app mà biết 😏",
            "🧠 Đã vào app, tức là sắp học... hoặc sắp trốn học 🙃",
            "📚 App đã mở. Tự hỏi: học hành hay chỉ đang giết thời gian giữa hai trận game?",
            "💤 Mở app lúc 7 giờ sáng? Ai bắt ép vậy?!",
            "🥲 Người ta vào app để học. Còn bạn... chắc chỉ check xem hôm nay có môn nào mình ghét không.",
            "⏰ Chào mừng bạn quay lại sau 14 ngày và 8 giờ kể từ lần đăng nhập cuối cùng 🤖",
            "🎮 App lịch học à? Hay app lịch nghỉ trá hình?",
            "🌱 Một ngày học tốt bắt đầu từ việc mở app (và không tắt nó ngay sau đó).",
            "💡 Biết mình có môn gì hôm nay là 50% chiến thắng. 50% còn lại là... đi học thật.",
            "🏁 Bạn đã sẵn sàng học chưa? Không sao, app thì sẵn sàng rồi đó.",
            "🎯 Vào app rồi thì ít nhất cũng xem thử hôm nay có phải đến lớp không nhé?",
            "Mở app là tốt rồi đó… giờ thì đừng chỉ mở cho vui thôi nhé 😏",
            "App thì có lịch, còn học hay không thì… chắc còn tùy tâm trạng 😆",
            "Vào app xem lịch mà cứ như soi vận mệnh vậy á trời 😅",
            "Có môn mình thích không? Không có cũng ráng học nha, đừng buông xuôi 🥲",
            "Hôm nay có 3 tiết, 2 môn, 1 ước muốn: được nghỉ. Nhưng… không nha 😌",
            "Mỗi lần mở app là một bước tiến gần hơn đến thành công – dù chỉ là một bước nhỏ 😄",
            "Biết hôm nay học gì là nửa chặng đường rồi, giờ chỉ cần… đi học nữa thôi!",
            "Một ngày mới bắt đầu, thời khóa biểu đã sẵn, hãy bắt đầu nhẹ nhàng nhé!",
            "Lịch học không bao giờ đợi ai, nên… mình cũng đừng lười nữa 😅",
          ];

          const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "",
                body: randomGreeting,
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
