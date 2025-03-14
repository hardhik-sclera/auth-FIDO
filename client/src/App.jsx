import React from 'react'
import {BrowserRouter as Router, Routes,Route} from 'react-router-dom'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import { AuthProvider } from "./context/TokenProvider.jsx";
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

const App = () => {
  return (
  <Router>
    <Toaster position='top-right' toastOptions={{duration:1000}}/>
    <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/home' element={
            <AuthProvider>
              <Home />
            </AuthProvider>
          }
        />
    </Routes>
  </Router>
  )
}

export default App