
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SendIcon } from '../Icons';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: 'You are a helpful and friendly chatbot integrated into a cryptography application called Quantum Solutions. Be concise and helpful.',
                    thinkingConfig: { thinkingBudget: 32768 },
                },
            });
            setChat(chatSession);
        } catch(e) {
            console.error(e);
            setError("Failed to initialize the AI. Please check the API key configuration.");
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const stream = await chat.sendMessageStream({ message: userInput });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
            setMessages(prev => prev.slice(0, -1)); // Remove the empty model message
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(80vh-2rem)]">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Chatbot</h2>
            <div className="flex-grow bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] px-4 py-2 rounded-xl text-white ${
                                msg.role === 'user' ? 'bg-purple-600' : 'bg-neutral-600'
                            }`}
                        >
                           <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-[85%] px-4 py-2 rounded-xl text-white bg-neutral-600">
                           <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                               <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                               <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask something..."
                    className="flex-grow bg-neutral-700 border-neutral-600 rounded-lg p-3 text-white outline-none transition focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading || !chat}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !userInput.trim() || !chat}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};