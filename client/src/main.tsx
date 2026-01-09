import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    "Root element not found. Make sure there is an element with id 'root' in the HTML."
  );
}

createRoot(rootElement).render(<App />);
