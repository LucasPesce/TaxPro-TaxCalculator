import { useState } from 'react';
import { Outlet } from 'react-router-dom'; 
import Sidebar from './components/layout/Sidebar/Sidebar';
import './App.css';


function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prevState => !prevState);
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>      
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;