import React from 'react'

const Sidebar = () => {
  return (
    <aside className="sidebar bg-white border-end">
      <div className="sidebar-top p-3 text-center border-bottom">
       {/* <div className="logo-square mb-2">CG</div> */}
       <div className="logo-square mb-2 d-flex align-items-center justify-content-center">
  <i className="bi bi-grid fs-2 text-white"></i>
</div>
        <div className="app-name"></div>
      </div>

      <nav className="mt-3">
        <ul className="list-unstyled px-2">
          <li className="py-2"><i className="bi bi-grid me-2"></i> Dashboard</li>
          <li className="py-2"><i className="bi bi-people me-2"></i> Users</li>
          <li className="py-2"><i className="bi bi-list-task me-2"></i> Tasks</li>
          <li className="py-2"><i className="bi bi-gear me-2"></i> Settings</li>
        </ul>
      </nav>

      <div className="sidebar-bottom mt-auto p-3 border-top">
        <div className="small text-muted">Lalita Shahi</div>
        <div className="small clickable text-danger">Logout</div>
      </div>
    </aside>
    
  )
}

export default Sidebar




