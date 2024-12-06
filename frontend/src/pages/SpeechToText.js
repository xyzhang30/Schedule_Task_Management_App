import React, { useState, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import './SpeechToText.css';
import StartSpeechIcon from './images/microphone-solid.svg';
import StopSpeechIcon from './images/microphone-slash-solid.svg';

const SpeechToText = ({ onTranscriptChange }) => {
    const [recognizer, setRecognizer] = useState(null);  
    const [transcript, setTranscript] = useState('');  
    const [isRecognizing, setIsRecognizing] = useState(false);  

    // Azure Speech-to-Text setup
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        process.env.REACT_APP_316_SPEECH_KEY, 
        process.env.REACT_APP_316_SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = 'en-US';

    // silence timeouts
    speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "3000"
    );
    speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "2000"
    );

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    useEffect(() => {
        // initialize new Recognizer
        const speechRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
        setRecognizer(speechRecognizer);

        // event handler "recognizing" to update transcript as speech is recognized
        speechRecognizer.recognizing = (s, e) => {
            onTranscriptChange(e.result.text);
            setTranscript(e.result.text);
        };

        // clean up Recognizer when/after component updates
        return () => {
            if (speechRecognizer && !isRecognizing) {
                speechRecognizer.close();
                console.log('Recognizer closed');
                setRecognizer(null);
            }
        };
    }, []);


    const recognizeOnce = () => {
        if (recognizer) { // If Recognizer object exists
            setIsRecognizing(true);
            console.log('Recognition started');
            recognizer.recognizeOnceAsync(
                (result) => {
                    setIsRecognizing(false);
                    setTranscript(result.text);
                    onTranscriptChange(result.text);
                    console.log('Recognition result:', result.text);
                },
                (err) => {
                    setIsRecognizing(false);
                    console.error('Recognition failed:', err);
                }
            );
        }
    };


    return (
        <div className="speech-to-text-container">
            <div className="recognition-buttons">
                <img
                    src={isRecognizing ? StopSpeechIcon : StartSpeechIcon}
                    alt={isRecognizing ? "Start Voice Recognition" : "Stop Voice Recognition"}
                    className="recognition-button-icon"
                    onClick={recognizeOnce}
                />
            </div>
        </div>
    );
};

export default SpeechToText;

