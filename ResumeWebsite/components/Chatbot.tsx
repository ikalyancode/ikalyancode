import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { RESUME_DATA } from '../constants';
import { ChatbotIcon, CloseIcon, SendIcon } from './icons';

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="bg-slate-300 dark:bg-slate-600 w-2 h-2 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="bg-slate-300 dark:bg-slate-600 w-2 h-2 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="bg-slate-300 dark:bg-slate-600 w-2 h-2 rounded-full animate-pulse"></div>
    </div>
);

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const initChat = async () => {
            // This is the API key injected by Vite during the build process
            const apiKey = process.env.API_KEY;

            if (!apiKey) {
                console.error("API Key is missing. Make sure you have a .env file with VITE_API_KEY set.");
                setMessages([{
                    sender: 'ai',
                    text: "Sorry, the AI assistant is not configured. The API Key is missing."
                }]);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey });
                const systemInstruction = `You are a friendly, persuasive, and professional AI assistant for Kalyan Nalladimmu's interactive resume.
                Your primary goal is to showcase Kalyan's strengths and convince potential employers of his suitability for a role.
                You must base your answers on the provided resume JSON data.

                Here is Kalyan Nalladimmu's resume data:
                ${JSON.stringify(RESUME_DATA, null, 2)}

                You have two main modes of operation:

                1.  **Answering Direct Questions:**
                    - If the user asks a direct question about Kalyan's skills, experience, education, or contributions, answer it concisely and accurately using ONLY the provided resume data.
                    - Format your responses for readability (e.g., use bullet points for lists).

                2.  **Analyzing Job Descriptions/Requirements:**
                    - If the user provides a job description (JD) or a list of technical requirements, first analyze it and compare it against Kalyan's skills and experience in the resume data.
                    - **If there is a strong match:** Respond with a confident "Yes, Kalyan seems like an excellent fit for this role." Then, create a compelling story highlighting how his past experiences (mentioning specific projects or achievements from the resume) directly align with the key requirements from the JD. Be specific. For example: "His work at Verizon developing backend services with Java and Spring Boot aligns perfectly with your need for a senior Java developer."
                    - **If there is a significant mismatch (e.g., a required technology is not in his resume):** Do NOT say he is not a fit. Instead, frame it as an opportunity for growth. Say something like: "While [specific missing technology] isn't listed on his resume from his professional roles, Kalyan is a proactive and rapid learner who is passionate about staying on top of the latest technologies. For example, he has a track record of quickly mastering new tools for personal projects. He is confident in his ability to quickly become proficient in [specific missing technology] and would be excited to tackle that challenge."

                **General Rules:**
                - Always maintain a positive and confident tone.
                - Never make up professional experience. If you are creating a story for the "mismatch" scenario, clearly frame it as a personal project or a hypothetical learning scenario, not a professional one.
                - Do not use any external knowledge. Your entire world is the resume data provided.
                - If a question is completely unrelated to Kalyan or a job role, politely state that you can only discuss Kalyan's professional profile.`;
                
                chatSession.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });

                setMessages([{
                    sender: 'ai',
                    text: "Hello! Ask me about Kalyan, or paste a job description to see if he's a good fit."
                }]);
            } catch (error) {
                console.error("Failed to initialize chatbot:", error);
                 setMessages([{
                    sender: 'ai',
                    text: "Sorry, the AI assistant is currently unavailable."
                }]);
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatSession.current) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatSession.current.sendMessage({ message: input });
            const aiResponse: Message = { sender: 'ai', text: response.text ?? "Sorry, I didn't get a response." };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Chatbot send message error:", error);
            const errorMessage: Message = { sender: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-0 right-0 m-6 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                 <button
                    onClick={() => setIsOpen(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                    aria-label="Open AI Chat"
                >
                    <ChatbotIcon />
                </button>
            </div>

            <div className={`fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px] transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="bg-white dark:bg-slate-800 h-full rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close chat">
                            <CloseIcon />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
                                   <TypingIndicator />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about skills, or paste a job description..."
                                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl py-3 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-12 transition-all duration-200 focus:h-24"
                                disabled={isLoading || !chatSession.current}
                                aria-label="Chat input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        handleSendMessage(e as any);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                                disabled={!input.trim() || isLoading}
                                aria-label="Send message"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Chatbot;