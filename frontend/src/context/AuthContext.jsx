import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('user');
    if (!saved || saved === 'undefined' || saved === 'null') {
      return null;
    }
    return JSON.parse(saved);
  } catch (err) {
    console.warn('Invalid user stored in localStorage, cleaning up:', err);
    try {
      localStorage.removeItem('user');
    } catch (_) {}
    return null;
  }
};

const getInitialToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token;
  } catch (_) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(getInitialToken);
  const [team, setTeam] = useState(null);
  const [guideProfile, setGuideProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const currentToken = getInitialToken();
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        setTeam(res.data.team || null);
        setGuideProfile(res.data.guide_profile || null);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    await fetchProfile();
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTeam(null);
    setGuideProfile(null);
  };

  const isStudent = user?.role === 'student';
  const isGuide = user?.role === 'guide';
  const isCoordinator = user?.role === 'coordinator';
  const isPanel = user?.role === 'panel';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        team,
        guideProfile,
        loading,
        login,
        logout,
        refreshProfile: fetchProfile,
        isStudent,
        isGuide,
        isCoordinator,
        isPanel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
