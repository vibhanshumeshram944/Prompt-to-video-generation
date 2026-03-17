/**
 * This is the dedicated Remotion entry point.
 * It ONLY calls registerRoot() — no DOM, no React App, no window references.
 * Remotion Studio and npx remotion render both bundle from this file.
 */
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
