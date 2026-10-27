import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, studentLoginUser, registerUser, fetchCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('college_auth_token'));
  const [loading, setLoading] = useState(true);

  // Demo accounts map for instantaneous role switching
  const demoAccounts = {
    super_admin: { email: 'superadmin@college.edu', password: 'Admin@123', label: 'Super Admin' },
    mca_coord: { email: 'mca.coord@college.edu', password: 'Admin@123', label: 'MCA Coordinator' },
    mba_coord: { email: 'mba.coord@college.edu', password: 'Admin@123', label: 'MBA Coordinator' },
    btech_coord: { email: 'btech.coord@college.edu', password: 'Admin@123', label: 'B.Tech Coordinator' },
    mtech_coord: { email: 'mtech.coord@college.edu', password: 'Admin@123', label: 'M.Tech Coordinator' },
    faculty: { email: 'faculty.approver@college.edu', password: 'Admin@123', label: 'Faculty Reviewer' },
    student_btech: { email: 'rohit.btech@college.edu', password: 'Student@123', label: 'Student (Rohit - B.Tech)' },
    student_mtech: { email: 'sneha.mtech@college.edu', password: 'Student@123', label: 'Student (Sneha - M.Tech)' },
    student_mca: { email: 'alex.mca@college.edu', password: 'Student@123', label: 'Student (Alex - MCA)' },
    student_mba: { email: 'priya.mba@college.edu', password: 'Student@123', label: 'Student (Priya - MBA)' },
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.success && res.access_token) {
      localStorage.setItem('college_auth_token', res.access_token);
      localStorage.setItem('admin_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const studentLogin = async (email, password) => {
    const res = await studentLoginUser({ email, password });
    if (res.success && res.access_token) {
      localStorage.setItem('college_auth_token', res.access_token);
      localStorage.setItem('admin_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (payload) => {
    const res = await registerUser(payload);
    if (res.success && res.access_token) {
      localStorage.setItem('college_auth_token', res.access_token);
      localStorage.setItem('admin_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('college_auth_token');
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (roleKey) => {
    const target = demoAccounts[roleKey];
    if (target) {
      if (roleKey.startsWith('student_')) {
        return studentLogin(target.email, target.password);
      }
      return login(target.email, target.password);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isDeptCoordinator: user?.role === 'dept_coordinator',
    isFaculty: user?.role === 'faculty_coordinator',
    isStudent: user?.role === 'student',
    isOrganizer: user?.role === 'organizer',
    login,
    studentLogin,
    register,
    logout,
    quickSwitch,
    demoAccounts,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
