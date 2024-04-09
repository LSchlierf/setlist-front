import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import EditRepertoire from './EditRepertoire';
import EditSetlist from './EditSetlist';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='editRepertoire' element={<EditRepertoire />} />
      <Route path='editSetlist' element={<EditSetlist />} />
    </Routes>
  </BrowserRouter>
);

// Roadmap
