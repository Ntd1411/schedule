# 📅 Ứng Dụng Quản Lý Thời Khóa Biểu

Ứng dụng React Native/Capacitor giúp sinh viên quản lý thời khóa biểu một cách tiện lợi và hiệu quả.

## ✨ Tính Năng Chính

### 📋 Quản Lý Lịch Học
- **Tải file Excel**: Hỗ trợ đọc và import dữ liệu từ file Excel (.xlsx, .xls)
- **Lịch tháng tương tác**: Giao diện lịch đẹp mắt với khả năng swipe nhanh giữa các tháng
- **Hiển thị chi tiết**: Xem thông tin chi tiết môn học, phòng học, giảng viên, thời gian
- **Tự động nhận diện**: Tự động phân tích cấu trúc file Excel và trích xuất thông tin lịch học

### 🔔 Thông Báo Thông Minh
- **Thông báo tự động**: Tự động lên lịch thông báo cho tất cả lớp học
- **Thông báo tùy chỉnh**: Tạo thông báo riêng cho thời gian cụ thể
- **Quản lý thông báo**: Xem danh sách, đếm số lượng và xóa thông báo đã lên lịch

### 📱 Giao Diện Thân Thiện
- **Responsive Design**: Hoạt động mượt mà trên cả web và mobile
- **Dark Theme**: Giao diện tối hiện đại và dễ nhìn
- **Swiper Navigation**: Vuốt nhanh để chuyển đổi giữa các tháng
- **Bootstrap Icons**: Biểu tượng đẹp mắt và nhất quán

### 💾 Lưu Trữ & Xuất Dữ Liệu
- **LocalStorage**: Tự động lưu dữ liệu, không mất khi tắt app
- **Xuất CSV**: Xuất lịch học ra file CSV để sử dụng trong các ứng dụng khác
- **Backup & Restore**: Sao lưu và khôi phục dữ liệu dễ dàng

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: React 19.1.0
- **UI Framework**: React Bootstrap 2.10.10
- **Mobile**: Capacitor 7.4.2 (Android support)
- **Build Tool**: Vite 7.0.4
- **Navigation**: Swiper 11.2.10
- **File Processing**: XLSX 0.18.5
- **Notifications**: Capacitor Local Notifications

## 📦 Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js 16+ 
- npm hoặc yarn
- Android Studio (cho mobile build)

### Cài Đặt Dependencies
```bash
# Clone repository
git clone <repository-url>
cd schedule

# Cài đặt dependencies
npm install
# hoặc
yarn install
```

### Chạy Ứng Dụng

#### Web Development
```bash
# Chạy dev server
npm run dev
# hoặc
yarn dev

# Truy cập http://localhost:5173
```

#### Build Production
```bash
# Build for production
npm run build
# hoặc
yarn build
```

#### Mobile (Android)
```bash
# Sync với Capacitor
npx cap sync android

# Mở Android Studio
npx cap open android

# Build và run trên thiết bị/emulator
```

## 📱 Hướng Dẫn Sử Dụng

### 1. Tải File Excel
1. Mở ứng dụng và vào trang chủ
2. Click "Chọn file Excel" hoặc kéo thả file vào vùng upload
3. File sẽ được tự động phân tích và hiển thị lịch học

### 2. Xem Lịch Học
1. Sau khi tải file thành công, app tự động chuyển đến trang lịch
2. Swipe trái/phải để chuyển tháng
3. Click vào ngày có lịch (có dấu chấm đỏ) để xem chi tiết
4. Click nút calendar trên navbar để quay về tháng hiện tại

### 3. Quản Lý Thông Báo
1. Vào menu → Cài đặt
2. Sử dụng các nút để:
   - Kiểm tra số thông báo đã lên lịch
   - Xem danh sách thông báo chi tiết
   - Tạo thông báo tùy chỉnh
3. Thông báo sẽ tự động được tạo khi tải file Excel

### 4. Xuất Dữ Liệu
1. Vào menu → Xuất file CSV
2. Chọn tháng muốn xuất
3. File CSV sẽ được tải về máy

## 📁 Cấu Trúc Dự Án

```
src/
├── components/           # Các component tái sử dụng
│   └── NavBar.jsx       # Navigation bar component
├── pages/               # Các trang chính
│   ├── App.jsx         # Component gốc
│   └── AppLayout/      # Layout components
├── utils/              # Utility functions
│   ├── getScheduleData.js    # Xử lý dữ liệu Excel
│   └── manageNotification.js # Quản lý thông báo
├── AppLayout.jsx       # Layout chính của app
├── ExcelReader.jsx     # Component đọc file Excel
├── ScheduleView.jsx    # Component hiển thị lịch
├── ExportCSV.jsx      # Component xuất CSV
└── ScheduleCustomNotification.jsx # Thông báo tùy chỉnh
```

## 🔧 Cấu Hình

### Capacitor Config
File `capacitor.config.json` đã được cấu hình cho:
- Android app với package ID
- Local notifications
- File system access

### Build Config
- Vite config tối ưu cho React
- ESLint rules cho code quality
- Bootstrap CSS integration

## 🚀 Triển Khai

### Web Hosting
```bash
# Build production
npm run build

# Deploy thư mục dist/ lên hosting service
# (Vercel, Netlify, GitHub Pages, etc.)
```

### Android APK
```bash
# Build Android
npx cap sync android
npx cap open android

# Trong Android Studio:
# Build → Generate Signed Bundle/APK
```

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **File Excel không đọc được**
   - Kiểm tra format file (.xlsx, .xls)
   - Đảm bảo cấu trúc file đúng định dạng

2. **Thông báo không hoạt động**
   - Kiểm tra quyền notification trên thiết bị
   - Đảm bảo app không bị kill bởi battery optimization

3. **Swiper bị giật**
   - Kiểm tra tốc độ internet
   - Clear cache và reload app

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 🙏 Cảm Ơn

- React team cho framework tuyệt vời
- Bootstrap team cho UI components
- Capacitor team cho mobile integration
- Swiper team cho smooth navigation

---

**⭐ Nếu dự án hữu ích, hãy cho một star để ủng hộ nhé!**