import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import TradingJournalApp from './TradingJournalApp';

const analyticsMode = import.meta.env.PROD ? 'production' : 'development';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TradingJournalApp />
    <Analytics mode={analyticsMode} />
  </React.StrictMode>
);
