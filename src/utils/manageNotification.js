/* eslint-disable no-console */
import getScheduleData from './getScheduleData'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export async function showAllScheduledNotifications() {
  try {
    const { notifications } = await LocalNotifications.getPending()

    if (notifications.length === 0) {
      alert('📭 Không có thông báo nào đã được lên lịch.')
      return
    }

    console.log(notifications.length)
    console.log(notifications.sort((a, b) => new Date(a.schedule.at) - new Date(b.schedule.at)))


    const message = notifications.sort((a, b) => new Date(a.schedule.at) - new Date(b.schedule.at)).map((noti, index) => {
      const time = new Date(noti.schedule.at).toLocaleString()
      return `#${index + 1} - ID: ${noti.id}, Title: "${noti.title}", Body: "${noti.body}" Time: ${time}`
    }).join('\n')

    alert(`🟢 Các thông báo đã lên lịch:\n\n${message}`)
  } catch (error) {
    console.error('Lỗi khi lấy thông báo:', error)
    alert('❌ Không thể lấy danh sách thông báo.')
  }
}


export const countScheduledNotification = async () => {
  try {
    const { notifications } = await LocalNotifications.getPending()
    alert(notifications.length)
  } catch (error) {
    alert('Lỗi khi đếm thông báo:' + error)
  }
}


// xóa tất cả thông báo
export async function clearNotification() {
  try {
    const pendingNotifications = await LocalNotifications.getPending()
    if (pendingNotifications.notifications.length > 0) {
      // Xóa từng thông báo một
      for (const notification of pendingNotifications.notifications) {
        await LocalNotifications.cancel({
          notifications: [
            {
              id: notification.id
            }
          ]
        })
      }
    }
  } catch (error) {
    console.error('Lỗi khi xóa thông báo:', error)
  }
}

export const processExcelData = async (jsonData) => {
  // Xử lý và kiểm tra dữ liệu
  const processedData = getScheduleData(jsonData)
  // console.log('Processed data:', processedData);

  if (!processedData || !processedData.scheduleByDate) {
    throw new Error('Không thể xử lý dữ liệu thời khóa biểu')
  }

  const schedules = processedData.scheduleByDate
  if (Object.keys(schedules).length === 0) {
    throw new Error('Không tìm thấy lịch học trong dữ liệu')
  }

  return processedData
}

const getStartTimeByPeriod = (period) => {
  const timePeriod = {
    '7:00 - 9:25': '7:00',
    '9:35 - 12:00': '9:35',
    '12:30 - 14:55': '12:30',
    '15:05 - 17:00': '15:05',
    '18:00 - 21:15': '18:00'
  }
  return timePeriod[period] || ''
}

const generateNotificationId = (dateKey, code, index) => {
  return parseInt(`${Math.abs(hashString(dateKey + code + index))}`.slice(0, 9))
}

const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const scheduleAllNotification = async (scheduleByDateData) => {
  try {

    if (!scheduleByDateData || Object.keys(scheduleByDateData).length === 0) {
      throw new Error('Không có dữ liệu lịch học để lên lịch thông báo')
    }

    // Kiểm tra quyền thông báo
    let status = await LocalNotifications.checkPermissions()
    if (status.display === 'prompt') {
      status = await LocalNotifications.requestPermissions()
    }

    if (status.display !== 'granted') {
      throw new Error('Quyền thông báo bị từ chối. Vui lòng cấp quyền để nhận thông báo')
    }

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.createChannel({
        id: 'schedule',
        name: 'Lịch học',
        description: 'Thông báo cho các môn học sắp tới',
        importance: 5,
        visibility: 1
      })
    }

    // Xóa thông báo cũ
    await clearNotification()

    let scheduledCount = 0
    const currentDate = new Date()

    for (const [dateKey, schedules] of Object.entries(scheduleByDateData)) {
      for (const [index, schedule] of schedules.entries()) {
        try {
          const startTime = getStartTimeByPeriod(schedule.period)
          if (!startTime) continue

          const [day, month, year] = dateKey.split('/').map(Number)
          const [hours, minutes] = startTime.split(':').map(Number)
          const date = new Date(year, month - 1, day, hours, minutes, 0, 0)

          // Chỉ lên lịch cho các thông báo trong tương lai
          if (date <= currentDate) continue

          const notificationTime = new Date(date.getTime() - 15 * 60 * 1000)
          // console.log('Sẽ thông báo lúc:', notificationTime.toString());

          const notificationID = generateNotificationId(dateKey, schedule.code, index)

          await LocalNotifications.schedule({
            notifications: [{
              title: `Môn ${schedule.subject}`,
              body: `${startTime}, ${schedule.room}`,
              id: notificationID,
              channelId: 'schedule',
              schedule: { at: notificationTime, allowWhileIdle: true },
              smallIcon: 'ic_stat_notify'
            }]
          })

          scheduledCount++
        } catch (e) {
          console.error('Lỗi khi lên lịch thông báo cụ thể:', e)
        }
      }
    }

    if (scheduledCount > 0) {
      // alert(`Đã lên lịch ${scheduledCount} thông báo cho các môn học sắp tới`);
    } else {
      alert('Không có môn học nào cần lên lịch thông báo')
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo thông báo:', error)
    alert('Có lỗi khi thiết lập thông báo: ' + error.message)
  }
}