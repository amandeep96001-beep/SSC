import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, User, Lock, XCircle } from 'lucide-react';

export function AuthPanel({ loginUser, registerUser }) {
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername.trim() || !authPassword) {
      setAuthError("Please fill in all required fields.");
      return;
    }

    if (authMode === 'login') {
      const res = await loginUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.message || "Login failed. Please check your credentials.");
      }
    } else {
      const res = await registerUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="auth-fullscreen-layout">
      <Helmet><title>Login | SSC Speed Engine</title></Helmet>
      <div className="auth-card">
        <div className="auth-brand">
          <GraduationCap className="brand-logo" size={36} />
          <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SSC Speed Engine</h1>
          <p>Master tables, vocab, reasoning, and mock tests</p>
        </div>

        <div className="auth-mode-selector">
          <button 
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => { setAuthMode('login'); setAuthError(''); setAuthUsername(''); setAuthPassword(''); }}
          >
            Log In
          </button>
          <button 
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => { setAuthMode('register'); setAuthError(''); setAuthUsername(''); setAuthPassword(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {authError && (
            <div className="alert-message error">
              <XCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <div className="form-group">
            <label>Candidate Username</label>
            <div className="input-with-icon">
              <User size={16} className="field-icon" />
              <input
                type="text"
                placeholder="Enter username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit">
            {authMode === 'login' ? 'Access Portal' : 'Register New Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
