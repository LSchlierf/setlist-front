import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import EditRepertoire from './EditRepertoire';
import EditSetlist from './EditSetlist';
import { PDFViewer } from '@react-pdf/renderer';
import SetlistSimplePDF from './SetlistSimplePDF';
import SetlistDetailedPDF from './SetlistDetailedPDF';
import storage from './storage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='editRepertoire' element={<EditRepertoire />} />
      <Route path='editSetlist' element={<EditSetlist />} />
      {/* <Route path='test' element={
        <PDFViewer width={'100%'} height={'939'}>
          <SetlistSimplePDF setlist={await storage.getSetlist(Object.values(await storage.getSetlists())[0].id)} repertoire={storage.getRepertoire()} />
        </PDFViewer>
      } /> */}
    </Routes>
  </BrowserRouter>
);
