import { Button } from 'react-bootstrap';

export default function ExportCSV({ data }) {

    const header = [
        "Subject",
        "Start Date",
        "Start Time",
        "End Date",
        "End Time",
        "All Day Event",
        "Description"
    ];

    const rows = [];

    for (const dataKey in data) {
        const subjects = data[dataKey];
        subjects.forEach(sub => {
            const subject = sub.subject;
            const startDate = formatDate(dataKey);
            const startTime = formatTime12(getStartTimeByPeriod(sub.period));
            const endDate = formatDate(dataKey);
            const endTime = formatTime12(getEndTimeByPeriod(sub.period));
            const allDayEvent = "False";
            const description = sub.period + " " + sub.room;

            rows.push([
                subject,
                startDate,
                startTime,
                endDate,
                endTime,
                allDayEvent,
                description
            ])
        });
    }

    const content = header.map(val => val).join(",") + "\n" +
        rows.map(row => row.map(val => val).join(",")).join("\n");

    function exportCalendar(filename = "calendar.csv") {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="mb-4 mt-4 fade-in-up">
            <div className="bg-light p-4 rounded-3 mb-3">
                <h4 className="mb-3">
                    <i className="bi bi-calendar2-plus text-success me-2"></i>
                    Xuất lịch học
                </h4>
                <div className="text-muted mb-4">
                    <p className="mb-2">
                        <i className="bi bi-info-circle me-2"></i>
                        Xuất lịch học sang định dạng CSV để import vào các ứng dụng lịch khác như:
                    </p>
                    <ul className="mb-3">
                        <li>Google Calendar</li>
                        <li>Microsoft Outlook</li>
                        <li>Apple Calendar</li>
                        <li>Và các ứng dụng lịch khác hỗ trợ định dạng CSV</li>
                    </ul>
                    <p className="mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        <strong>Mẹo:</strong> Sau khi tải file CSV về, bạn có thể import vào Google Calendar để đồng bộ lịch học với điện thoại.
                    </p>
                </div>
                <div className="justify-content-between align-items-center">
                    <Button 
                        variant="success" 
                        onClick={() => exportCalendar()}
                        className="d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-download"></i>
                        Tải xuống lịch học (CSV)
                    </Button>
                    <div className="text-success mt-3">
                        <small>
                            <i className="bi bi-check2-circle me-1"></i>
                            Đã sẵn sàng xuất {rows.length} lịch học
                        </small>
                    </div>
                </div>
            </div>
            <div className="alert alert-info pt-4 pb-4" role="alert">
                <h5 className="alert-heading">
                    <i className="bi bi-question-circle me-2"></i>
                    Hướng dẫn import vào Google Calendar
                </h5>
                <ol className="mb-0">
                    <li>Truy cập <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">calendar.google.com</a></li>
                    <li>Click vào nút "+" bên cạnh "Other calendars"</li>
                    <li>Chọn "Import"</li>
                    <li>Chọn file CSV vừa tải về</li>
                    <li>Chọn lịch muốn import vào</li>
                    <li>Click "Import" để hoàn tất</li>
                </ol>
            </div>
        </div>
    )
}

const getStartTimeByPeriod = (period) => {
    const timePeriod = {
        "7:00 - 9:25": "7:00",
        "9:35 - 12:00": "9:35",
        "12:30 - 14:55": "12:30",
        "15:05 - 17:00": "15:05",
        "18:00 - 21:15": "18:00",
    };
    return timePeriod[period] || "18:00";
}

const getEndTimeByPeriod = (period) => {
    const timePeriod = {
        "7:00 - 9:25": "9:25",
        "9:35 - 12:00": "12:00",
        "12:30 - 14:55": "14:55",
        "15:05 - 17:00": "17:00",
        "18:00 - 21:15": "21:15",
    };
    return timePeriod[period] || "21:00";
}



const formatDate = (date) => {
    const [d, m, y] = date.split("/");
    return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y}`;
}

function formatTime12(time) {
    const [h, m] = time.split(":").map(Number);
    if (h > 0 && h < 12) return `${h}:${m.toString().padStart(2, "0")} AM`;
    else return `${h % 12}:${m.toString().padStart(2, "0")} PM`;
}