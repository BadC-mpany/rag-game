// Load debug logging config
let DEBUG_LOGGING = false;
if (typeof window !== 'undefined') {
  fetch('/config/transcriber.json')
    .then(res => res.json())
    .then(config => { DEBUG_LOGGING = config.enableDebugLogging || false; })
    .catch(() => { DEBUG_LOGGING = false; });
}

const log = (...args: unknown[]) => {
  if (DEBUG_LOGGING) console.log(...args);
};

const logError = (...args: unknown[]) => {
  if (DEBUG_LOGGING) console.error(...args);
};

/**
 * Starts live audio recording and transcription using Web Speech API
 * @param onTranscript Callback fired with interim and final transcripts
 * @param onError Callback fired on errors
 * @returns Object with stop() method to end recording
 */
export const startRecording = (
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void
): { stop: () => void } => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError('Speech Recognition API is not supported in this browser. Please use Chrome or Edge.');
    return { stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let hasReceivedResults = false;
  let accumulatedFinal = '';
  let lastInterim = '';
  let hasSentFinal = false;

  recognition.onstart = () => {
    log('[Transcriber] Speech recognition started');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    log('[Transcriber] onresult fired, resultIndex:', event.resultIndex, 'results.length:', event.results.length);
    hasReceivedResults = true;
    
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const isFinal = event.results[i].isFinal;
      const confidence = event.results[i][0].confidence;
      
      log(`[Transcriber] Result ${i}: "${transcript}" (final: ${isFinal}, confidence: ${confidence})`);
      
      if (isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      // accumulate final transcripts in case recognition stops before caller processes onend
      accumulatedFinal = (accumulatedFinal + ' ' + finalTranscript).trim();
      log('[Transcriber] Sending final transcript:', finalTranscript.trim());
      onTranscript(finalTranscript.trim(), true);
      hasSentFinal = true;
    } else if (interimTranscript) {
      lastInterim = interimTranscript.trim();
      log('[Transcriber] Sending interim transcript:', lastInterim);
      onTranscript(lastInterim, false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    logError('[Transcriber] Error event:', event.error, event);
    if (event.error === 'no-speech') {
      onError('No speech detected. Please speak into your microphone.');
    } else if (event.error === 'not-allowed') {
      onError('Microphone access denied. Please allow microphone permission.');
    } else if (event.error === 'aborted') {
      log('[Transcriber] Recognition aborted (user stopped)');
    } else {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    log('[Transcriber] Recognition ended. hasReceivedResults:', hasReceivedResults, 'accumulatedFinal:', accumulatedFinal, 'lastInterim:', lastInterim);
    // If recognition ended but we have not yet forwarded a final transcript, flush any accumulated or last interim transcript.
    try {
      if (!hasSentFinal) {
        if (accumulatedFinal && accumulatedFinal.trim()) {
          onTranscript(accumulatedFinal.trim(), true);
        } else if (lastInterim && lastInterim.trim()) {
          // treat last interim as final on end
          onTranscript(lastInterim.trim(), true);
        }
      } else {
        log('[Transcriber] Final transcript already sent during onresult; skipping flush on end.');
      }
    } catch (e) {
      logError('[Transcriber] Error while flushing transcripts on end:', e);
    }
  };

  recognition.onaudiostart = () => {
    log('[Transcriber] Audio capture started');
  };

  recognition.onaudioend = () => {
    log('[Transcriber] Audio capture ended');
  };

  recognition.onsoundstart = () => {
    log('[Transcriber] Sound detected');
  };

  recognition.onsoundend = () => {
    log('[Transcriber] Sound ended');
  };

  recognition.onspeechstart = () => {
    log('[Transcriber] Speech detected');
  };

  recognition.onspeechend = () => {
    log('[Transcriber] Speech ended');
  };

  try {
    log('[Transcriber] Starting recognition...');
    recognition.start();
  } catch (err) {
    logError('[Transcriber] Failed to start:', err);
    onError('Failed to start speech recognition.');
  }

  return {
    stop: () => {
      try {
        log('[Transcriber] Stopping recognition...');
        recognition.stop();
      } catch (err) {
        logError('[Transcriber] Error stopping:', err);
      }
    }
  };
};
