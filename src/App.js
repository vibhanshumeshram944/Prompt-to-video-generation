import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { planScenes } from './agent/scenePlanner';
import { Img } from 'remotion';
import axios from 'axios';
const SCENE_COLORS = {
    hook: '#6366f1',
    problem: '#ef4444',
    feature: '#22d3ee',
    climax: '#f59e0b',
    cta: '#10b981',
};
const SCENE_LABELS = {
    title: 'TITLE',
    product: 'PRODUCT',
    feature: 'FEATURE',
    infographic: 'CHART',
    cta: 'CTA',
};
const App = () => {
    const [prompt, setPrompt] = useState('');
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const [rendering, setRendering] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const fileInputRef = useRef(null);
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result;
            setImagePreview(dataUrl);
            setImageBase64(dataUrl);
        };
        reader.readAsDataURL(file);
    };
    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const handleGenerate = async () => {
        if (!prompt.trim())
            return;
        setLoading(true);
        setError('');
        setPlan(null);
        try {
            setLoadingStep('Running AI Agent (Writing, Voicing, Rendering)...');
            const result = await planScenes(prompt, imageBase64 ?? undefined);
            setPlan(result);
            setLoadingStep('');
        }
        catch {
            setError('Could not connect. Make sure backend is running: npm run server');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRender = async () => {
        setRendering(true);
        setError('');
        try {
            if (plan?.videoUrl) {
                const link = document.createElement('a');
                link.href = `http://localhost:3002${plan.videoUrl}`;
                link.download = `video-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setRendering(false);
                return;
            }
            const res = await axios.post('http://localhost:3002/api/render');
            if (res.data.url) {
                const link = document.createElement('a');
                link.href = `http://localhost:3002${res.data.url}`;
                link.download = `video-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        catch {
            setError('Failed to render video. Check terminal logs.');
        }
        finally {
            setRendering(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
            handleGenerate();
    };
    return (_jsxs("div", { style: s.page, children: [_jsxs("header", { style: s.header, children: [_jsxs("span", { style: s.logo, children: [_jsx("span", { style: s.logoIcon, children: "\u25C8" }), " ANTIGRAVITY"] }), _jsx("span", { style: s.logoSub, children: "AI VIDEO AGENT" })] }), _jsxs("main", { style: s.main, children: [_jsxs("div", { style: s.hero, children: [_jsxs("h1", { style: s.title, children: ["Turn words into", _jsx("br", {}), _jsx("span", { style: s.titleGradient, children: "15-second ads." })] }), _jsxs("p", { style: s.subtitle, children: ["Describe your product. Upload an image if you have one.", _jsx("br", {}), "AI writes, directs, and voices your video \u2014 instantly."] })] }), _jsxs("div", { style: s.card, children: [_jsxs("div", { style: s.fieldGroup, children: [_jsx("label", { style: s.label, children: "PROMPT" }), _jsx("textarea", { value: prompt, onChange: (e) => setPrompt(e.target.value), onKeyDown: handleKeyDown, placeholder: "e.g. High-energy ad for a soda can that tastes like lightning...", style: s.textarea, rows: 3 })] }), _jsxs("div", { style: s.fieldGroup, children: [_jsxs("label", { style: s.label, children: ["IMAGE ", _jsx("span", { style: s.optional, children: "(OPTIONAL)" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/png,image/jpeg,image/webp", style: { display: 'none' }, onChange: handleImageUpload }), !imagePreview ? (_jsxs("button", { style: s.uploadBtn, onClick: () => fileInputRef.current?.click(), children: [_jsx("span", { style: s.uploadIcon, children: "\u2191" }), " Upload Product Image"] })) : (_jsxs("div", { style: s.imagePreviewWrap, children: [_jsx(Img, { src: imagePreview, style: s.imagePreview, alt: "preview" }), _jsx("button", { style: s.removeImg, onClick: removeImage, children: "\u2715" })] }))] }), _jsx("button", { onClick: handleGenerate, disabled: loading || !prompt.trim(), style: { ...s.generateBtn, ...(loading || !prompt.trim() ? s.generateBtnDisabled : {}) }, children: loading ? (_jsxs("span", { style: s.loadingInner, children: [_jsx("span", { style: s.spinner }), " ", loadingStep || 'Generating Video natively...'] })) : ('⚡ Generate Video') }), _jsx("p", { style: s.hint, children: "\u2318 + Enter to generate" }), error && _jsx("div", { style: s.errorBox, children: error })] }), plan && (_jsxs("div", { style: s.results, children: [_jsxs("div", { style: s.resultsHeader, children: [_jsxs("div", { children: [_jsx("span", { style: s.resultsLabel, children: "SCENE PLAN" }), plan.imageProvided && (_jsx("span", { style: s.imageBadge, children: "\uD83D\uDCF7 Image included" }))] }), _jsx("span", { style: s.duration, children: "15 sec \u00B7 450 frames \u00B7 30fps" })] }), _jsx("div", { style: s.sceneGrid, children: plan.scenes.map((scene, i) => (_jsxs("div", { style: s.sceneCard, children: [_jsxs("div", { style: s.sceneTop, children: [_jsx("span", { style: {
                                                        ...s.sceneTag,
                                                        backgroundColor: `${SCENE_COLORS[scene.type] || '#fff'}20`,
                                                        color: SCENE_COLORS[scene.type] || '#fff',
                                                        borderColor: `${SCENE_COLORS[scene.type] || '#fff'}40`,
                                                    }, children: SCENE_LABELS[scene.type] || scene.type.toUpperCase() }), _jsxs("span", { style: s.frameCount, children: [scene.durationSec, "s \u00B7 ", scene.durationSec * 30, "f"] })] }), _jsx("p", { style: s.sceneTitle, children: scene.type }), _jsx("p", { style: s.sceneSubtitle, children: scene.content }), _jsxs("div", { style: s.narrationBox, children: [_jsx("span", { style: s.narrationIcon, children: "\uD83C\uDF99" }), _jsxs("p", { style: s.narration, children: ["\"", scene.narration, "\""] })] })] }, i))) }), _jsxs("div", { style: s.actions, children: [_jsx("button", { onClick: handleRender, disabled: rendering, style: s.downloadBtn, children: rendering ? 'Rendering...' : '↓ Download Video' }), _jsx("button", { onClick: () => window.open('http://localhost:3000', '_blank'), style: s.openStudioBtn, children: "Open Remotion Studio \u2192" }), _jsx("button", { onClick: () => { setPlan(null); setPrompt(''); removeImage(); }, style: s.newPromptBtn, children: "New Prompt" })] })] }))] }), _jsx("footer", { style: s.footer, children: "Groq Vision \u00B7 ElevenLabs \u00B7 Remotion \u00B7 Built by Antigravity" })] }));
};
const s = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#070709',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '0 24px',
    },
    header: {
        width: '100%',
        maxWidth: '720px',
        padding: '28px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: '13px',
        fontWeight: 800,
        letterSpacing: '0.12em',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    logoIcon: {
        fontSize: '16px',
        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    logoSub: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.15em',
    },
    main: {
        width: '100%',
        maxWidth: '720px',
        flex: 1,
        paddingTop: '64px',
        paddingBottom: '64px',
    },
    hero: {
        marginBottom: '48px',
    },
    title: {
        fontSize: '56px',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        lineHeight: 1.1,
        margin: '0 0 16px',
    },
    titleGradient: {
        background: 'linear-gradient(90deg, #6366f1, #22d3ee, #f59e0b)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '17px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.4)',
        margin: 0,
    },
    card: {
        background: '#0f0f13',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    label: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.3)',
    },
    optional: {
        color: 'rgba(255,255,255,0.15)',
        marginLeft: '6px',
    },
    textarea: {
        width: '100%',
        backgroundColor: '#1a1a22',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '15px',
        lineHeight: 1.6,
        padding: '16px',
        resize: 'none',
        outline: 'none',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    uploadBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#1a1a22',
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: '12px',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        fontWeight: 500,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
    },
    uploadIcon: {
        fontSize: '18px',
        lineHeight: 1,
    },
    imagePreviewWrap: {
        position: 'relative',
        display: 'inline-block',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    imagePreview: {
        display: 'block',
        maxHeight: '160px',
        maxWidth: '100%',
        objectFit: 'cover',
        borderRadius: '12px',
    },
    removeImg: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateBtn: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '18px 28px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '-0.01em',
        transition: 'transform 0.1s, opacity 0.2s',
        boxShadow: '0 0 30px rgba(99,102,241,0.3)',
    },
    generateBtnDisabled: {
        opacity: 0.35,
        cursor: 'not-allowed',
        boxShadow: 'none',
    },
    loadingInner: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    spinner: {
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    },
    hint: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.18)',
        margin: '-12px 0 0',
    },
    errorBox: {
        fontSize: '13px',
        color: '#f87171',
        padding: '12px 16px',
        backgroundColor: 'rgba(248,113,113,0.08)',
        borderRadius: '8px',
        border: '1px solid rgba(248,113,113,0.2)',
    },
    results: {
        marginTop: '40px',
    },
    resultsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    resultsLabel: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.3)',
    },
    imageBadge: {
        marginLeft: '12px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.06)',
        padding: '2px 8px',
        borderRadius: '20px',
    },
    duration: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.2)',
        fontFamily: 'monospace',
    },
    sceneGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
    },
    sceneCard: {
        background: '#0f0f13',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    sceneTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sceneTag: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        padding: '3px 8px',
        borderRadius: '4px',
        border: '1px solid',
    },
    frameCount: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        fontFamily: 'monospace',
    },
    sceneTitle: {
        margin: '4px 0 0',
        fontSize: '14px',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.3,
    },
    sceneSubtitle: {
        margin: 0,
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.5,
    },
    narrationBox: {
        display: 'flex',
        gap: '8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: '10px',
        marginTop: '4px',
        alignItems: 'flex-start',
    },
    narrationIcon: {
        fontSize: '12px',
        flexShrink: 0,
        marginTop: '1px',
    },
    narration: {
        margin: 0,
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        lineHeight: 1.5,
        fontStyle: 'italic',
    },
    actions: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
    openStudioBtn: {
        background: 'transparent',
        color: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '10px',
        padding: '14px 22px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    downloadBtn: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '14px 22px',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(99,102,241,0.3)',
    },
    newPromptBtn: {
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '14px 22px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    footer: {
        padding: '32px 0 24px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.12)',
        letterSpacing: '0.08em',
        textAlign: 'center',
    },
};
export default App;
