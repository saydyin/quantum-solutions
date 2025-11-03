
import React, { useMemo } from 'react';

interface EnigmaVisualizerProps {
    params: Record<string, any>;
}

const VisualizerSegment: React.FC<{ label: string; value: string; error?: boolean }> = ({ label, value, error }) => (
    <div className="text-center">
        <div className="text-xs text-neutral-400">{label}</div>
        <div className={`mt-1 font-mono text-lg ${error ? 'text-red-400' : 'text-violet-300'}`}>{value || '-'}</div>
    </div>
);


export const EnigmaVisualizer: React.FC<EnigmaVisualizerProps> = ({ params }) => {
    const { rotors = 'I II III', reflector = 'B', ringSettings = '1 1 1', initialPositions = 'A A A', plugboard = '' } = params;
    
    const parsedState = useMemo(() => {
        const rotorNames = rotors.toUpperCase().split(' ').filter(Boolean);
        const ringValues = ringSettings.split(' ').filter(Boolean);
        const positionValues = initialPositions.toUpperCase().split(' ').filter(Boolean);
        const plugPairs = plugboard.toUpperCase().split(' ').filter(p => p.length === 2);
        
        return {
            rotors: rotorNames,
            reflector: reflector.toUpperCase(),
            rings: ringValues,
            positions: positionValues,
            plugs: plugPairs,
            hasError: rotorNames.length !== 3 || ringValues.length !== 3 || positionValues.length !== 3,
        }
    }, [rotors, reflector, ringSettings, initialPositions, plugboard]);

    return (
        <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 w-full">
             <h3 className="text-lg font-bold text-violet-400 mb-4 text-center">Enigma State</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                <div className="col-span-1 md:col-span-2 space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-300 text-center">Rotors</h4>
                     <div className="flex justify-around bg-neutral-800 p-2 rounded-lg">
                        <VisualizerSegment label="Left" value={parsedState.rotors[0]} error={parsedState.hasError} />
                        <VisualizerSegment label="Middle" value={parsedState.rotors[1]} error={parsedState.hasError} />
                        <VisualizerSegment label="Right" value={parsedState.rotors[2]} error={parsedState.hasError} />
                    </div>
                </div>
                 <div className="col-span-1 md:col-span-2 space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-300 text-center">Settings</h4>
                     <div className="flex justify-around bg-neutral-800 p-2 rounded-lg">
                        <VisualizerSegment label="Rings" value={parsedState.rings.join(' ')} error={parsedState.hasError} />
                        <VisualizerSegment label="Positions" value={parsedState.positions.join(' ')} error={parsedState.hasError} />
                     </div>
                </div>
                 <div className="col-span-1 space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-300 text-center">Reflector</h4>
                    <div className="flex justify-around bg-neutral-800 p-2 rounded-lg">
                        <VisualizerSegment label="Type" value={parsedState.reflector} />
                    </div>
                </div>
                 <div className="col-span-2 md:col-span-3 space-y-3">
                     <h4 className="text-sm font-semibold text-neutral-300 text-center">Plugboard</h4>
                     <div className="bg-neutral-800 p-2 rounded-lg h-16 overflow-y-auto text-center">
                        {parsedState.plugs.length > 0 ? (
                            <div className="font-mono text-violet-300 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                                {parsedState.plugs.map((p, i) => <span key={i}>{p}</span>)}
                            </div>
                        ) : (
                            <span className="text-neutral-500 italic text-sm">No pairs</span>
                        )}
                     </div>
                </div>
             </div>
        </div>
    );
};
