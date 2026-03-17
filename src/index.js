import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
import App from './App';
import './index.css';
// Always register the Remotion root so the Studio can find it
registerRoot(RemotionRoot);
// Render our React App for the prompt interface
const container = document.getElementById('root');
if (container) {
    // We only render the UI if we're not inside the Remotion Studio iframe
    // or a Remotion-specific route
    const isRemotionStudio = window.location.pathname.includes('studio') || window.location.port === '3000';
    if (!isRemotionStudio) {
        const root = createRoot(container);
        root.render(_jsx(App, {}));
    }
}
