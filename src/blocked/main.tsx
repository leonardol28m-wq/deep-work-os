import React from 'react';
import { createRoot } from 'react-dom/client';
import BlockedPage from './BlockedPage';
import '../newtab/styles.css';

createRoot(document.getElementById('root')!).render(<BlockedPage />);
