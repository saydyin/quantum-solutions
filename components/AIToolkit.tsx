import React, { useState } from 'react';
import { AIToolkitSidebar } from './ai/AIToolkitSidebar';
import { Chatbot } from './ai/Chatbot';
import { ImageGenerator } from './ai/ImageGenerator';
import { ImageEditor } from './ai/ImageEditor';
import { ImageAnalysis } from './ai/ImageAnalysis';
import { VideoGenerator } from './ai/VideoGenerator';
import { VideoAnalysis } from './ai/VideoAnalysis';
import { GroundingSearch } from './ai/GroundingSearch';
import { TextToSpeech } from './ai/TextToSpeech';
import { LiveConversation } from './ai/LiveConversation';
import { LiveTranscription } from './LiveTranscription';
import { CodeTool } from './ai/CodeTool';


export type AITool = 'chatbot' | 'image-generator' | 'image-editor' | 'image-analysis' | 'video-generator' | 'video-analysis' | 'grounding-search' | 'tts' | 'live-conversation' | 'live-transcription' | 'code-assistant';

const toolComponents: Record<AITool, React.FC> = {
    'chatbot': Chatbot,
    'image-generator': ImageGenerator,
    'image-editor': ImageEditor,
    'image-analysis': ImageAnalysis,
    'video-generator': VideoGenerator,
    'video-analysis': VideoAnalysis,
    'grounding-search': GroundingSearch,
    'tts': TextToSpeech,
    'live-conversation': LiveConversation,
    'live-transcription': LiveTranscription,
    'code-assistant': CodeTool,
};

export const AIToolkit: React.FC = () => {
    const [activeTool, setActiveTool] = useState<AITool>('chatbot');

    const ActiveToolComponent = toolComponents[activeTool];

    return (
        <div className="flex flex-col md:flex-row gap-4 items-start">
            <AIToolkitSidebar activeTool={activeTool} onToolSelect={setActiveTool} />
            <div className="flex-grow w-full bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 min-h-[80vh]">
                {ActiveToolComponent && <ActiveToolComponent />}
            </div>
        </div>
    );
};
