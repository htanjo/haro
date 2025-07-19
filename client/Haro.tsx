import { useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./Haro.css";

const SILENCE_TIMEOUT = 3000; // 3 seconds

function Haro() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const [messages, setMessages] = useState<string[]>([]);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTranscript = useRef<string>("");

  useEffect(() => {
    if (transcript === "") return;
    // If the transcript has changed, reset the silence timer.
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }
    silenceTimer.current = setTimeout(() => {
      const newMessage = transcript.trim();
      if (newMessage && newMessage !== lastTranscript.current) {
        lastTranscript.current = newMessage;
        console.log("New message:", newMessage);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        resetTranscript(); // Clear the transcript after processing
      }
    }, SILENCE_TIMEOUT);
  }, [transcript, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="haro">
        音声認識がこのブラウザでサポートされていません。
      </div>
    );
  }

  return (
    <div className="haro">
      <h1>Haro</h1>
      <div>
        {!listening ? (
          <button
            onClick={() =>
              SpeechRecognition.startListening({
                continuous: true,
                language: "ja-JP",
              })
            }
          >
            Haroと会話する
          </button>
        ) : (
          <button onClick={SpeechRecognition.stopListening}>
            Haroとの会話を終了する
          </button>
        )}
      </div>
      <div>
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </div>
  );
}

export default Haro;
