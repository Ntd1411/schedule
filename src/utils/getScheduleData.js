export const getTimeByPeriod = (period) => {
  const timePeriod = {
    '1,2,3': '7:00 - 9:25',
    '4,5,6': '9:35 - 12:00',
    '7,8,9': '12:30 - 14:55',
    '10,11,12': '15:05 - 17:00',
    '13,14,15': '18:00 - 21:15'
  }
  return timePeriod[period] || ''
}
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
  }
  return dayNames[dayNumber] || ''
}


// Hàm chuyển đổi số thứ sang số ngày trong tuần của JavaScript (0=CN, 1=T2, ...)
const getDayOfWeekNumber = (dayNumber) => {
  // Trong Excel: 1=CN, 2=T2, 3=T3, ..., 7=T7
  // Trong JS: 0=CN, 1=T2, 2=T3, ..., 6=T7
  if (dayNumber === 1) return 0 // Chủ nhật
  return dayNumber - 1 // Thứ 2-7 -> 1-6
}
export default function getScheduleData(data) {


  if (!data || data.length === 0) return { scheduleByDate: {}, subjects: [], subjectGroups: {} }

  const scheduleByDate = {}
  const subjects = new Set()
  const subjectGroups = {} // Nhóm các môn học theo mã/tên

  data.forEach(row => {
    // Tìm cột đầu tiên (thứ trong tuần - số)
    const dayOfWeekColumn = Object.keys(row)[0] // Cột đầu tiên chứa số thứ

    // Tìm cột thời gian học (cột cuối cùng thường chứa định dạng ngày)
    const timeColumn = Object.keys(row).find(key =>
      row[key] && typeof row[key] === 'string' && row[key].includes('/')
    ) || Object.keys(row)[Object.keys(row).length - 1] // Cột cuối nếu không tìm thấy
    //   console.log(timeColumn);

    // Tìm cột tên môn học (thường là cột thứ 4)
    const subjectColumn = Object.keys(row)[4] || Object.keys(row).find(key =>
      key.toLowerCase().includes('lớp')
    )

    // Tìm cột mã học phần (thường là cột thứ 2)
    const codeColumn = Object.keys(row)[1] || Object.keys(row).find(key =>
      key.toLowerCase().includes('mã')
    )

    // Tìm cột phòng học (thường có chứa số phòng hoặc từ "phòng")
    const roomColumn = Object.keys(row).find(key =>
      row[key] && (
        key.toLowerCase().includes('phòng')
      )
    )

    // Tìm cột tiết học (thường chứa số như "1,2,3")
    const periodColumn = Object.keys(row).find(key =>
      key.toLowerCase().includes('tiết')
    )

    // Tìm cột giảng viên (có thể để trống trong ví dụ này)
    const teacherColumn = Object.keys(row).find(key =>
      key.toLowerCase().includes('giảng viên') ||
      key.toLowerCase().includes('cbgd')
    )

    if (timeColumn && row[timeColumn] && dayOfWeekColumn && row[dayOfWeekColumn]) {
      const timeString = row[timeColumn].toString()
      const subjectName = subjectColumn ? row[subjectColumn] : 'Môn học'
      const subjectCode = codeColumn ? row[codeColumn] : 'ERR'
      const dayOfWeekNumber = parseInt(row[dayOfWeekColumn]) // Số thứ (2, 3, 4...)
      const dayOfWeekName = getDayOfWeekName(dayOfWeekNumber)

      // Tạo key duy nhất cho môn học (kết hợp mã và tên)
      const subjectKey = `${subjectCode}_${subjectName}`

      // Nhóm các khoảng thời gian của cùng một môn
      if (!subjectGroups[subjectKey]) {
        subjectGroups[subjectKey] = {
          code: subjectCode,
          name: subjectName,
          teacher: teacherColumn ? row[teacherColumn] : '',
          timePeriods: []
        }
      }

      // Phân tích chuỗi thời gian có dạng "24/11/2025-07/12/2025"
      const dateRangeMatch = timeString.match(/(\d{1,2}\/\d{1,2}\/\d{4})-(\d{1,2}\/\d{1,2}\/\d{4})/)

      if (dateRangeMatch) {
        const startDate = dateRangeMatch[1]
        const endDate = dateRangeMatch[2]

        // Thêm thông tin khoảng thời gian vào nhóm môn học
        subjectGroups[subjectKey].timePeriods.push({
          startDate,
          endDate,
          room: roomColumn ? row[roomColumn] : '',
          period: periodColumn ? getTimeByPeriod(row[periodColumn]) : '',
          dayOfWeek: dayOfWeekName,
          dayOfWeekNumber: dayOfWeekNumber,
          timeRange: timeString
        })

        //   console.log(scheduleByDate);

        // Tạo danh sách các ngày trong khoảng thời gian
        const start = new Date(startDate.split('/').reverse().join('-'))
        const end = new Date(endDate.split('/').reverse().join('-'))

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Chỉ lấy những ngày trùng với thứ được chỉ định
          const currentDayOfWeek = d.getDay() // 0 = Chủ nhật, 1 = Thứ 2, ...
          const targetDayOfWeek = getDayOfWeekNumber(dayOfWeekNumber)

          if (currentDayOfWeek === targetDayOfWeek) {
            const dateKey = d.toLocaleDateString('vi-VN')

            if (!scheduleByDate[dateKey]) {
              scheduleByDate[dateKey] = []
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
            }

            scheduleByDate[dateKey].push(scheduleItem)
          }
        }

        if (subjectName) {
          subjects.add(subjectName)
        }
      }
    }
  })

  return { scheduleByDate, subjects: Array.from(subjects), subjectGroups }
}