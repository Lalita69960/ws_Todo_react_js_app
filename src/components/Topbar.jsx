import React from 'react'

const Topbar = () => {
  return (
 <header className="topbar bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <i className="bi bi-list fs-4 clickable"></i>
        <h5 className="mb-0 text-muted">Tasks</h5>
      </div>
      <div className="d-flex align-items-center gap-2">
        <input className="form-control form-control-sm" style={{width: 220}} placeholder="Search Task...." />
        <i className="bi bi-person-circle fs-4"></i>
      </div>
    </header>

    
  )
}

export default Topbar
