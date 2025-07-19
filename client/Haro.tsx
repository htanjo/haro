import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./Haro.css";
import axios from "axios";
import useVoices from "./use-voices";

const SILENCE_TIMEOUT = 1000; // 2 seconds

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
  const voices = useVoices();

  const speakMessage = useCallback(
    (content: string) => {
      SpeechRecognition.stopListening(); // Stop listening to avoid conflicts with speech synthesis.
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = "ja-JP"; // Set language to Japanese
      utterance.voice =
        voices.find((voice) => voice.name.includes("Microsoft Sayaka")) ||
        voices.find((voice) => voice.lang === "ja-JP") ||
        voices[0]; // Fallback to the first available voice
      utterance.pitch = 2;
      utterance.rate = 1.5;
      utterance.onend = () => {
        SpeechRecognition.startListening({ continuous: true }); // Restart listening after speaking.
      };
      speechSynthesis.speak(utterance);
    },
    [voices]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const response = await axios.post("/api/haro", { content });
        const data = response.data;
        if (data && data.content) {
          speakMessage(data.content);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [speakMessage]
  );

  useEffect(() => {
    if (transcript === "") return;
    // If the transcript has changed, reset the silence timer.
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }
    silenceTimer.current = setTimeout(async () => {
      const newMessage = transcript.trim();
      if (newMessage && newMessage !== lastTranscript.current) {
        lastTranscript.current = newMessage;
        sendMessage(newMessage);
        await setMessages((prevMessages) => [...prevMessages, newMessage]);
        resetTranscript(); // Clear the transcript after processing
      }
    }, SILENCE_TIMEOUT);
  }, [transcript, sendMessage, resetTranscript]);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

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
      {/* <div>
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div> */}
    </div>
  );
}

export default Haro;
