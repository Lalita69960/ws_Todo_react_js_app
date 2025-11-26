


// src/App.jsx
import React from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Main from './components/Main'
import  Main1 from './components/Main.jsx'
 import './App.css'

export default function App(){
    return (
        <div className="app-root">   {/* <-- your root flex container */}

            {/* Left sidebar */}
            <Sidebar />

            {/* Right main area */}
            <div className="main-area">  {/* <-- flex column for topbar + main */}
                <Topbar />                 {/* <-- spans full width */}
                <div className="main-content">  {/* <-- scrollable main content */}
                    <Main />
                </div>
            </div>

        </div>



    )
}










