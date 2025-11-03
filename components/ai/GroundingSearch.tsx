import React, { useState } from 'react';
import { runGroundingSearch } from '../../services/gemini';
import { SparklesIcon } from '../Icons';

type GroundingTool = 'googleSearch' | 'googleMaps';
type GroundingChunk = { web?: { uri: string, title: string }, maps?: { uri: string, title: string } };

export const GroundingSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [tool, setTool] = useState<GroundingTool>('googleSearch');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Please enter a query.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const searchResult = await runGroundingSearch(query, tool);
            setResult(searchResult);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to perform search: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Web & Map Search</h2>
            <p className="text-neutral-400">Ask questions about recent events, or find information about places to get up-to-date answers grounded in Google Search and Maps.</p>
            
            <div>
                 <label className="block text-sm font-medium text-neutral-300 mb-2">Search With</label>
                 <div className="flex flex-wrap gap-2">
                     <button
                        onClick={() => setTool('googleSearch')}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            tool === 'googleSearch'
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                     >
                        Google Search
                     </button>
                      <button
                        onClick={() => setTool('googleMaps')}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            tool === 'googleMaps'
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                     >
                        Google Maps
                     </button>
                 </div>
            </div>

            <div>
                <label htmlFor="search-query" className="block text-sm font-medium text-neutral-300 mb-1">Query</label>
                <textarea
                    id="search-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tool === 'googleSearch' ? "e.g., Who won the latest F1 race?" : "e.g., What are some good cafes near me?"}
                    className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Searching...' : 'Search'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            {isLoading && (
                 <div className="text-center text-neutral-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="mt-4">Searching the web...</p>
                </div>
            )}

            {result && (
                <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                        <h3 className="font-semibold text-lg text-violet-300 mb-2">Response</h3>
                        <p className="text-neutral-200 whitespace-pre-wrap">{result.text}</p>
                    </div>
                     {result.sources.length > 0 && (
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                             <h3 className="font-semibold text-lg text-violet-300 mb-2">Sources</h3>
                             <ul className="space-y-2">
                                {result.sources.map((chunk, index) => {
                                    const source = chunk.web || chunk.maps;
                                    return source ? (
                                        <li key={index}>
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:underline">
                                                {source.title || source.uri}
                                            </a>
                                        </li>
                                    ) : null;
                                })}
                             </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
