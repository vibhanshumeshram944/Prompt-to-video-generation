import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { loadFont } from '@remotion/google-fonts/Inter';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
/*
 * Highlight a word in a sentence with a spring-animated wipe effect.
 */
// Ideal composition size: 1280x720
const COLOR_BG = '#ffffff';
const COLOR_TEXT = '#000000';
const COLOR_HIGHLIGHT = '#A7C7E7';
const FULL_TEXT = 'This is Remotion.';
const HIGHLIGHT_WORD = 'Remotion';
const FONT_SIZE = 72;
const FONT_WEIGHT = 700;
const HIGHLIGHT_START_FRAME = 30;
const HIGHLIGHT_WIPE_DURATION = 18;
const { fontFamily } = loadFont();
const Highlight = ({ word, color, delay, durationInFrames }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const highlightProgress = spring({
        fps,
        frame,
        config: { damping: 200 },
        delay,
        durationInFrames,
    });
    const scaleX = Math.max(0, Math.min(1, highlightProgress));
    return (_jsxs("span", { style: { position: 'relative', display: 'inline-block' }, children: [_jsx("span", { style: {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: '1.05em',
                    transform: `translateY(-50%) scaleX(${scaleX})`,
                    transformOrigin: 'left center',
                    backgroundColor: color,
                    borderRadius: '0.18em',
                    zIndex: 0,
                } }), _jsx("span", { style: { position: 'relative', zIndex: 1 }, children: word })] }));
};
export const MyAnimation = () => {
    const highlightIndex = FULL_TEXT.indexOf(HIGHLIGHT_WORD);
    const hasHighlight = highlightIndex >= 0;
    const preText = hasHighlight ? FULL_TEXT.slice(0, highlightIndex) : FULL_TEXT;
    const postText = hasHighlight
        ? FULL_TEXT.slice(highlightIndex + HIGHLIGHT_WORD.length)
        : '';
    return (_jsx(AbsoluteFill, { style: {
            backgroundColor: COLOR_BG,
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily,
        }, children: _jsx("div", { style: {
                color: COLOR_TEXT,
                fontSize: FONT_SIZE,
                fontWeight: FONT_WEIGHT,
            }, children: hasHighlight ? (_jsxs(_Fragment, { children: [_jsx("span", { children: preText }), _jsx(Highlight, { word: HIGHLIGHT_WORD, color: COLOR_HIGHLIGHT, delay: HIGHLIGHT_START_FRAME, durationInFrames: HIGHLIGHT_WIPE_DURATION }), _jsx("span", { children: postText })] })) : (_jsx("span", { children: FULL_TEXT })) }) }));
};
