import React from 'react'
import { Navbar, Nav, Offcanvas, Container, Button } from 'react-bootstrap'

function NavBar({ handleShow, handleCalendarButtonClick, show, handleClose, handleSectionChange, activeSection }) {
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
          <Button
            style={{ backgroundColor: 'transparent', border: 'none', color: 'white' }}
            onClick={handleCalendarButtonClick}
            className="me-2"
          >
            <i className="bi bi-calendar"></i>
          </Button>
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
              <small className="d-block text-muted">Tải lên file Excel thời khóa biểu</small>
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
              <i className="bi bi-filetype-csv"></i>  Xuất file csv
              <small className="d-block text-muted">Tải về file csv</small>
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
    </>
  )
}

export default NavBar