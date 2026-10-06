import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [team, setTeam] = useState(null);
  const [guideProfile, setGuideProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
      setTeam(res.data.team);
      setGuideProfile(res.data.guide_profile);
      localStorage.setItem('user', JSON.stringify(res.data.user));
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
