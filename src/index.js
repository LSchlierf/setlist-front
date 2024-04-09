import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import EditRepertoire from './EditRepertoire';
import EditSetlist from './EditSetlist';
import { PDFViewer } from '@react-pdf/renderer';
import SetlistDetailedPDF from './SetlistDetailedPDF';
import storage from './storage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='editRepertoire' element={<EditRepertoire />} />
      <Route path='editSetlist' element={<EditSetlist />} />
      <Route path='test' element={
        <PDFViewer width={'100%'} height={'939'}>
          <SetlistDetailedPDF setlist={Object.values(storage.getSetlists())[0]} repertoire={storage.getRepertoire()} />
        </PDFViewer>
      } />
    </Routes>
  </BrowserRouter>
);

// Roadmap
