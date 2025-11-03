import React from 'react';
import { AITool } from '../AIToolkit';

interface SidebarProps {
    activeTool: AITool;
    onToolSelect: (tool: AITool) => void;
}

const tools: { id: AITool; name: string; group: string }[] = [
    { id: 'chatbot', name: 'Chatbot', group: 'Conversation' },
    { id: 'live-conversation', name: 'Live Conversation', group: 'Conversation' },
    { id: 'live-transcription', name: 'Live Transcription', group: 'Conversation' },
    { id: 'tts', name: 'Text-to-Speech', group: 'Conversation' },
    { id: 'image-generator', name: 'Image Generation', group: 'Media' },
    { id: 'image-editor', name: 'Image Editor', group: 'Media' },
    { id: 'image-analysis', name: 'Image Analysis', group: 'Media' },
    { id: 'video-generator', name: 'Video Generation', group: 'Media' },
    { id: 'video-analysis', name: 'Video Analysis', group: 'Media' },
    { id: 'code-assistant', name: 'Code Assistant', group: 'Development' },
    { id: 'grounding-search', name: 'Web & Map Search', group: 'Knowledge' },
];

const toolGroups = tools.reduce((acc, tool) => {
    if (!acc[tool.group]) {
        acc[tool.group] = [];
    }
    acc[tool.group].push(tool);
    return acc;
}, {} as Record<string, { id: AITool; name: string }[]>);

export const AIToolkitSidebar: React.FC<SidebarProps> = ({ activeTool, onToolSelect }) => {
    return (
        <nav className="w-full md:w-64 bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 flex-shrink-0">
            <ul className="space-y-4">
                {Object.entries(toolGroups).map(([groupName, toolsInGroup]) => (
                    <li key={groupName}>
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">{groupName}</h3>
                        <ul className="space-y-1">
                            {toolsInGroup.map(tool => (
                                <li key={tool.id}>
                                    <button
                                        onClick={() => onToolSelect(tool.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-base ${
                                            activeTool === tool.id
                                                ? 'bg-purple-600 text-white font-semibold'
                                                : 'text-neutral-300 hover:bg-neutral-700'
                                        }`}
                                    >
                                        {tool.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
