import React from 'react'
import ScheduleCustomNotification from '~/pages/AppLayout/Setting/ScheduleCustomNotification/ScheduleCustomNotification'
import { Container, Button } from 'react-bootstrap'
import { showAllScheduledNotifications, clearNotification, countScheduledNotification } from '~/utils/manageNotification'

function Setting({ setScheduleData, setActiveSection }) {
  return (
    <>
      <Container className="py-4 pt-5 mt-5">
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
                        style={{ fontSize: '0.7rem' }}
                        variant='danger'
                        size="sm"
                        onClick={countScheduledNotification}
                      >
                        Test số thông báo
                      </Button>
                      <Button
                        style={{ fontSize: '0.7rem' }}
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
                    <ScheduleCustomNotification />
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1 mt-2">🗑️ Xóa dữ liệu</h5>
                      <p className="mb-1 text-muted" style={{ fontSize: '0.9rem', marginLeft: '30px' }}>Xóa toàn bộ dữ liệu</p>
                    </div>
                    <Button
                      variant="outline-danger"
                      onClick={() => {
                        localStorage.clear()
                        setScheduleData(null)
                        clearNotification()
                        setActiveSection('home')
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
                      <small className="text-muted" style={{ fontSize: '0.9rem', marginLeft: '30px' }}>Ứng dụng quản lý thời khóa biểu sinh viên</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}

export default Setting