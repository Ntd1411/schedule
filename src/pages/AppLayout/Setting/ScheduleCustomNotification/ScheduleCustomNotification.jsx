import React, { useState } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Button } from 'react-bootstrap'
import { Capacitor } from '@capacitor/core'

export default function ScheduleCustomNotification() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const scheduleNotification = async () => {
    if (!date || !time) {
      alert('Vui lòng chọn ngày và giờ')
      return
    }

    // 1. Kiểm tra quyền thông báo
    let status = await LocalNotifications.checkPermissions()
    if (status.display === 'prompt') {
      status = await LocalNotifications.requestPermissions()
    }
    if (status.display !== 'granted') {
      alert('Bạn chưa cấp quyền thông báo')
      return
    }

    // 2. Tạo channel (Android 8+)
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.createChannel({
        id: 'test',
        name: 'test',
        description: 'Thông báo thử nghiệm',
        importance: 5,
        visibility: 1
      })
    }
    // 3. Chuyển ngày + giờ thành Date object
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = time.split(':').map(Number)
    const scheduleAt = new Date(year, month - 1, day, hours, minutes, 0, 0)

    // 4. Lên lịch thông báo
    await LocalNotifications.schedule({
      notifications: [{
        title: '🔔 Thông báo test',
        body: `Báo lúc ${time} ngày ${date}`,
        id: Math.floor(Date.now() % 2147483647),
        channelId: 'test',
        schedule: { at: scheduleAt, allowWhileIdle: true },
        smallIcon: 'ic_stat_notify'
      }]
    })

    alert('Đã lên lịch thông báo!')
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>📅 Đặt thông báo cho thời gian cụ thể</h3>
      <div style={{ marginBottom: 10 }}>
        <label>Ngày: </label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Giờ: </label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} />
      </div>
      <Button onClick={scheduleNotification}>
        Lên lịch thông báo
      </Button>
    </div>
  )
}
