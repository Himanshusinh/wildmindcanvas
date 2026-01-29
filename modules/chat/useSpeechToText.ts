import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechToTextOptions {
    onTranscriptChange?: (transcript: string) => void;
    onFinalTranscript?: (transcript: string) => void;
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
    const {
        onTranscriptChange,
        onFinalTranscript,
        language = 'en-US',
        continuous = true,
        interimResults = true,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);   
    const lastTranscriptRef = useRef<string>('');

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            setTranscript(currentTranscript);
            lastTranscriptRef.current = currentTranscript;
            if (onTranscriptChange) {
                onTranscriptChange(currentTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            const finalText = (lastTranscriptRef.current || '').trim();
            if (finalText && onFinalTranscript) {
                onFinalTranscript(finalText);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, continuous, interimResults, onTranscriptChange, onFinalTranscript]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        toggleListening,
        isSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    };
}
