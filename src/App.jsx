// src/App.jsx
import React from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Main from './components/Main'
import './App.css'   

export default function App(){
  return (
    <>
    <div className="app-root d-flex">
      <Sidebar />
      <div className="main-area flex-grow-1">
        <Topbar />
        <main className="p-4">
          <Main />
        </main>
      </div>
    </div>
    </>
  )
}


