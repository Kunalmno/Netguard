import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { initTheme } from './components/layout/theme.ts';
import './index.css';

initTheme(); // set data-theme before first paint (no flash of wrong theme)

createRoot(document.getElementById('root')!).render(<App />);
