import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function AdminPanel({ user, token, showToast }) {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      // Fetch users list
      const usersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      if (statsRes.ok && usersRes.ok) {
        setStats(statsData);
        setUsersList(usersData);
      } else {
        showToast(statsData.error || usersData.error || 'Failed to fetch admin data.', 'error');
      }
    } catch (err) {
      showToast('Network error loading administrative panels.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleDeleteUser = async (id, fullName) => {
    if (id === user.id) {
      showToast('Self-deletion is not permitted.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${fullName}"? This will erase all their resumes, PDF files, and ATS analysis histories.`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Account "${fullName}" removed.`, 'success');
        setUsersList(prev => prev.filter(u => u.id !== id));
        // Refresh aggregate metrics
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to delete user.', 'error');
      }
    } catch (err) {
      showToast('Network error deleting user.', 'error');
    }
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h1>Administrative Control Center</h1>
          <p>Monitor system usage metrics, templates, and registered accounts</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAdminData}>
          <i className="fa-solid fa-arrows-rotate"></i> Refresh Database Stats
        </button>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '4rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Accessing secure MySQL admin registers...</p>
        </div>
      ) : (
        <>
          {/* Aggregates Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon icon-blue">
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="stat-details">
                <h3>Total Accounts</h3>
                <span className="stat-number">{stats?.totalUsers || 0}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-purple">
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <div className="stat-details">
                <h3>Total Resumes</h3>
                <span className="stat-number">{stats?.totalResumes || 0}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-cyan">
                <i className="fa-solid fa-compass"></i>
              </div>
              <div className="stat-details">
                <h3>Web Profiles</h3>
                <span className="stat-number">{stats?.generatedResumes || 0}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-green">
                <i className="fa-solid fa-gauge-high"></i>
              </div>
              <div className="stat-details">
                <h3>Systems Average ATS</h3>
                <span className="stat-number">{stats?.averageAtsScore || 0}%</span>
              </div>
            </div>
          </div>

          {/* User management and Templates lists */}
          <div className="admin-subgrid">
            
            {/* Left panel - User list */}
            <div className="grid-card">
              <div className="card-header">
                <h2>Registered Member Accounts</h2>
                <p className="card-subtitle">Manage user records and database access control settings</p>
              </div>

              <div className="table-container">
                <table className="ats-table">
                  <thead>
                    <tr>
                      <th>Account Member</th>
                      <th>Account Role</th>
                      <th>Joined Date</th>
                      <th>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.email}
                          </span>
                        </td>
                        <td>
                          {u.role === 'ADMIN' ? (
                            <span className="badge badge-green">ADMINISTRATOR</span>
                          ) : (
                            <span className="badge badge-blue">MEMBER</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td>
                          {u.id !== user.id ? (
                            <button 
                              className="btn-icon delete" 
                              title="Delete Account permanently"
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Active Self</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right panel - Template Trackers */}
            <div className="grid-card" style={{ height: 'fit-content' }}>
              <div className="card-header">
                <h2>Active Resume Stylesheets</h2>
                <p className="card-subtitle">Operational status of layout rendering systems</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="admin-template-item">
                  <div className="template-meta">
                    <h4>Modern Tech Style</h4>
                    <span>Single-column, neon cyan borders, Outfit fonts</span>
                  </div>
                  <span className="badge badge-blue">ONLINE</span>
                </div>

                <div className="admin-template-item">
                  <div className="template-meta">
                    <h4>Corporate Classic</h4>
                    <span>Elegant Georgia serif margins, centered profiles</span>
                  </div>
                  <span className="badge badge-blue">ONLINE</span>
                </div>

                <div className="admin-template-item">
                  <div className="template-meta">
                    <h4>Creative Cyan</h4>
                    <span>Dynamic cyber bars, Outlined tech tags</span>
                  </div>
                  <span className="badge badge-blue">ONLINE</span>
                </div>

                <div className="admin-template-item">
                  <div className="template-meta">
                    <h4>Direct PDF Parser</h4>
                    <span>Multer memory uploads, pdf-parse text extraction</span>
                  </div>
                  <span className="badge badge-green">ONLINE</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel;
