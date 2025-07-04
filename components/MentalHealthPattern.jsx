import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect, Path, Circle, Ellipse } from 'react-native-svg';

const MentalHealthPattern = ({
    patternType = 'calm-waves',
    width = '100%',
    height = 200,
    opacity = 1,
    style
}) => {
    const patterns = {
        'calm-waves': {
            patternWidth: 100,
            patternHeight: 60,
            backgroundColor: '#F5F3FF',
            elements: [
                { type: 'path', d: 'M0 30 Q 25 10, 50 30 T 100 30 V60 H0Z', fill: '#A78BFA', opacity: 0.3 },
                { type: 'path', d: 'M0 40 Q 25 20, 50 40 T 100 40 V60 H0Z', fill: '#7C3AED', opacity: 0.2 },
                { type: 'path', d: 'M0 50 Q 25 30, 50 50 T 100 50 V60 H0Z', fill: '#5B21B6', opacity: 0.1 }
            ]
        },
        'growing-leaves': {
            patternWidth: 80,
            patternHeight: 80,
            backgroundColor: '#ECFEFF',
            elements: [
                { type: 'ellipse', cx: 40, cy: 70, rx: 2, ry: 15, fill: '#38BDF8', opacity: 1 },
                { type: 'ellipse', cx: 40, cy: 55, rx: 12, ry: 5, fill: '#22D3EE', opacity: 0.7 },
                { type: 'ellipse', cx: 50, cy: 50, rx: 8, ry: 3, fill: '#06B6D4', opacity: 0.6 },
                { type: 'ellipse', cx: 30, cy: 50, rx: 8, ry: 3, fill: '#06B6D4', opacity: 0.6 },
                { type: 'ellipse', cx: 55, cy: 45, rx: 5, ry: 2, fill: '#0891B2', opacity: 0.4 },
                { type: 'ellipse', cx: 25, cy: 45, rx: 5, ry: 2, fill: '#0891B2', opacity: 0.4 }
            ]
        },
        'radiating-circles': {
            patternWidth: 60,
            patternHeight: 60,
            backgroundColor: '#FDF2F8',
            elements: [
                { type: 'circle', cx: 30, cy: 30, r: 25, fill: '#F472B6', opacity: 0.15 },
                { type: 'circle', cx: 30, cy: 30, r: 18, fill: '#F472B6', opacity: 0.25 },
                { type: 'circle', cx: 30, cy: 30, r: 12, fill: '#F472B6', opacity: 0.35 },
                { type: 'circle', cx: 30, cy: 30, r: 6, fill: '#F472B6', opacity: 0.5 }
            ]
        },
        'interconnected-hearts': {
            patternWidth: 100,
            patternHeight: 60,
            backgroundColor: '#F0FDF4',
            elements: [
                { type: 'path', d: 'M25 30 Q 30 20, 40 30 Q 50 20, 55 30 Q 60 40, 40 50 Q 20 40, 25 30Z', fill: '#34D399', opacity: 0.6 },
                { type: 'path', d: 'M45 30 Q 50 20, 60 30 Q 70 20, 75 30 Q 80 40, 60 50 Q 40 40, 45 30Z', fill: '#10B981', opacity: 0.4 },
                { type: 'path', d: 'M55 35 L 45 35', stroke: '#059669', strokeWidth: 1, opacity: 0.3, fill: 'none' }
            ]
        },
        'mindfulness-dots': {
            patternWidth: 50,
            patternHeight: 50,
            backgroundColor: '#FEF3C7',
            elements: [
                { type: 'circle', cx: 25, cy: 25, r: 3, fill: '#F59E0B', opacity: 0.7 },
                { type: 'circle', cx: 15, cy: 15, r: 2, fill: '#F59E0B', opacity: 0.4 },
                { type: 'circle', cx: 35, cy: 15, r: 2, fill: '#F59E0B', opacity: 0.4 },
                { type: 'circle', cx: 15, cy: 35, r: 2, fill: '#F59E0B', opacity: 0.4 },
                { type: 'circle', cx: 35, cy: 35, r: 2, fill: '#F59E0B', opacity: 0.4 }
            ]
        },
        'healing-spiral': {
            patternWidth: 80,
            patternHeight: 80,
            backgroundColor: '#F3E8FF',
            elements: [
                { type: 'path', d: 'M40 40 Q 50 30, 40 20 Q 30 30, 40 40 Q 50 50, 40 60 Q 30 50, 40 40', fill: 'none', stroke: '#8B5CF6', strokeWidth: 2, opacity: 0.3 },
                { type: 'path', d: 'M40 40 Q 45 35, 40 30 Q 35 35, 40 40 Q 45 45, 40 50 Q 35 45, 40 40', fill: 'none', stroke: '#A78BFA', strokeWidth: 1.5, opacity: 0.5 }
            ]
        }
    };

    const selectedPattern = patterns[patternType] || patterns['calm-waves'];

    const renderElement = (element, index) => {
        const props = { ...element, key: index };

        switch (element.type) {
            case 'path':
                return <Path {...props} />;
            case 'circle':
                return <Circle {...props} />;
            case 'ellipse':
                return <Ellipse {...props} />;
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { width, height, opacity }, style]}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${selectedPattern.patternWidth} ${selectedPattern.patternHeight}`}>
                <Defs>
                    <Pattern
                        id={`pattern-${patternType}`}
                        patternUnits="userSpaceOnUse"
                        width={selectedPattern.patternWidth}
                        height={selectedPattern.patternHeight}
                    >
                        <Rect
                            width={selectedPattern.patternWidth}
                            height={selectedPattern.patternHeight}
                            fill={selectedPattern.backgroundColor}
                        />
                        {selectedPattern.elements.map(renderElement)}
                    </Pattern>
                </Defs>
                <Rect
                    width="100%"
                    height="100%"
                    fill={`url(#pattern-${patternType})`}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -1,
    },
});

export default MentalHealthPattern; 