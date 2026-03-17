import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { loadFont } from '@remotion/google-fonts/Inter';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
const { fontFamily } = loadFont();
const COLOR_BAR = '#D4AF37';
const COLOR_TEXT = '#ffffff';
const COLOR_MUTED = '#888888';
const COLOR_BG = '#0a0a0a';
const COLOR_AXIS = '#333333';
// Ideal composition size: 1280x720
const Title = ({ children }) => (_jsx("div", { style: { textAlign: 'center', marginBottom: 40 }, children: _jsx("div", { style: { color: COLOR_TEXT, fontSize: 48, fontWeight: 600 }, children: children }) }));
const YAxis = ({ steps, height, }) => (_jsx("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height,
        paddingRight: 16,
    }, children: steps
        .slice()
        .reverse()
        .map((step) => (_jsx("div", { style: {
            color: COLOR_MUTED,
            fontSize: 20,
            textAlign: 'right',
        }, children: step.toLocaleString() }, step))) }));
const Bar = ({ height, progress }) => (_jsx("div", { style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    }, children: _jsx("div", { style: {
            width: '100%',
            height,
            backgroundColor: COLOR_BAR,
            borderRadius: '8px 8px 0 0',
            opacity: progress,
        } }) }));
const XAxis = ({ children, labels, height }) => (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsx("div", { style: {
                display: 'flex',
                alignItems: 'flex-end',
                gap: 16,
                height,
                borderLeft: `2px solid ${COLOR_AXIS}`,
                borderBottom: `2px solid ${COLOR_AXIS}`,
                paddingLeft: 16,
            }, children: children }), _jsx("div", { style: {
                display: 'flex',
                gap: 16,
                paddingLeft: 16,
                marginTop: 12,
            }, children: labels.map((label) => (_jsx("div", { style: {
                    flex: 1,
                    textAlign: 'center',
                    color: COLOR_MUTED,
                    fontSize: 20,
                }, children: label }, label))) })] }));
export const MyAnimation = () => {
    const frame = useCurrentFrame();
    const { fps, height } = useVideoConfig();
    const data = [
        { month: 'Jan', price: 2039 },
        { month: 'Mar', price: 2160 },
        { month: 'May', price: 2327 },
        { month: 'Jul', price: 2426 },
        { month: 'Sep', price: 2634 },
        { month: 'Nov', price: 2672 },
    ];
    const minPrice = 2000;
    const maxPrice = 2800;
    const priceRange = maxPrice - minPrice;
    const chartHeight = height - 280;
    const yAxisSteps = [2000, 2400, 2800];
    return (_jsxs(AbsoluteFill, { style: {
            backgroundColor: COLOR_BG,
            padding: 60,
            display: 'flex',
            flexDirection: 'column',
            fontFamily,
        }, children: [_jsx(Title, { children: "Gold Price 2024" }), _jsxs("div", { style: { display: 'flex', flex: 1 }, children: [_jsx(YAxis, { steps: yAxisSteps, height: chartHeight }), _jsx(XAxis, { height: chartHeight, labels: data.map((d) => d.month), children: data.map((item, i) => {
                            const progress = spring({
                                frame: frame - i * 5 - 10,
                                fps,
                                config: { damping: 18, stiffness: 80 },
                            });
                            const barHeight = ((item.price - minPrice) / priceRange) * chartHeight * progress;
                            return (_jsx(Bar, { height: barHeight, progress: progress }, item.month));
                        }) })] })] }));
};
