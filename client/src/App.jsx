import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import { Image, ShieldAlert } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Sticky Navigation Bar */}
          <nav className="navbar">
            <NavLink to="/" className="nav-brand">
              Aura Gallery
            </NavLink>
            <div className="nav-links">
              <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                <Image size={16} />
                <span>Gallery</span>
              </NavLink>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <ShieldAlert size={16} />
                <span>Admin Panel</span>
              </NavLink>
            </div>
          </nav>

          {/* Pages Workspace */}
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Exhibition space not found.</p>
                  <NavLink to="/" className="btn btn-primary">Return to Gallery</NavLink>
                </div>
              } />
            </Routes>
          </main>

          {/* Footer */}
          <footer style={{ 
            borderTop: '1px solid var(--border-color)', 
            padding: '2rem 1.5rem', 
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            backgroundColor: 'rgba(8, 12, 20, 0.5)'
          }}>
            <p>© {new Date().getFullYear()} Aura Gallery. Core Stack: React, Express, MongoDB. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
