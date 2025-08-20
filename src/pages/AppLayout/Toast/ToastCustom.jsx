import React from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'

function ToastCustom({ showSuccessToast, setShowSuccessToast, toastMessage }) {
  return (
    <>
      <ToastContainer position="top-end" className="p-3 mt-3 position-fixed" style={{ zIndex: 1060 }}>
        <Toast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          delay={2000}
          autohide
          bg="light"
        >
          <Toast.Header style={{ borderBottom: '5px solid rgba(4, 195, 26, 1)' }}>
            <strong className="mt-2 me-auto"> <i className="bi bi-check"></i>Thành công</strong>
          </Toast.Header>
          <Toast.Body style={{ color: 'dark' }}>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer >
    </>
  )
}

export default ToastCustom