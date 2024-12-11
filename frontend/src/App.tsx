import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Test from './pages/Test';
import ProtectedRoute from './components/ProtectedRoute';
import { useAppDispatch } from "./lib/hooks";
import { loadTheme } from "./lib/slices/themeSlice";
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';

function Logout() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  return <Navigate to="/login"/>
}

function RegisterAndLogout() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  return <Register/>
}

function App() {
  const dispatch = useAppDispatch();
  useEffect(()=> {
    dispatch(loadTheme());
  }, [dispatch]);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        }/>
        <Route path='/login' element={
          <Login/>
        }/>
        <Route path='/logout' element={
          <Logout/>
        }/>
        <Route path='/register' element={
          <RegisterAndLogout/>
        }/>
        <Route path='*' element={
          <NotFound/>
        }/>
        <Route path='/test' element={
          <Test/>
        }/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
