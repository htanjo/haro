import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import clsx from "clsx";
import "./Haro.css";
import axios from "axios";
import useVoices from "./use-voices";
import { IoMdPower } from "react-icons/io";

const SILENCE_TIMEOUT = 1000; // 2 seconds

function Haro() {
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [messages, setMessages] = useState<string[]>([]);
  const [haroActive, setHaroActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [randomSpeakTimer, setRandomSpeakTimer] =
    useState<NodeJS.Timeout | null>(null);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTranscript = useRef<string>("");
  const voices = useVoices();

  const speak = useCallback(
    (content: string) => {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = "ja-JP"; // Set language to Japanese
      utterance.voice =
        voices.find((voice) => voice.name.includes("Microsoft Sayaka")) ||
        voices.find((voice) => voice.lang === "ja-JP") ||
        voices[0]; // Fallback to the first available voice
      utterance.pitch = 2;
      utterance.rate = 1.7;
      utterance.onstart = () => {
        setSpeaking(true);
        SpeechRecognition.stopListening(); // Stop listening while speaking.
      };
      utterance.onend = () => {
        setSpeaking(false);
        SpeechRecognition.startListening({ continuous: true }); // Restart listening after speaking.
      };
      utterance.onerror = () => {
        setSpeaking(false);
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
          speak(data.content);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [speak]
  );

  const powerOn = useCallback(() => {
    setHaroActive(true);
    SpeechRecognition.startListening({
      continuous: true,
      language: "ja-JP",
    });
    sendMessage("起動時の挨拶を言ってください。");
  }, [sendMessage]);

  const powerOff = useCallback(() => {
    sendMessage("お休みの挨拶を言ってください。");
    setHaroActive(false);
    SpeechRecognition.stopListening();
  }, [sendMessage]);

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

  // Trigger a message event randomly.
  useEffect(() => {
    const scheduleNext = () => {
      const min = 5000; // 5 seconds
      const max = 30000; // 30 seconds
      const delay = Math.floor(Math.random() * (max - min)) + min;
      const id = setTimeout(() => {
        if (haroActive && !speaking) {
          const eventContent =
            "おや？センサーに反応があったよ？\n【指示】今回は少し長目でも構いません。50文字以内で話してください。";
          console.log("Random message event triggered:", eventContent);
          sendMessage(eventContent);
        }
        scheduleNext();
      }, delay);
      setRandomSpeakTimer(id);
    };
    // Schedule the first random message event.
    if (haroActive && !speaking) {
      scheduleNext();
    }
    // Cleanup the timer when Haro is not active.
    if (!haroActive && randomSpeakTimer) {
      clearTimeout(randomSpeakTimer);
      setRandomSpeakTimer(null);
    }
    // Cleanup the timer on unmount.
    return () => {
      if (randomSpeakTimer) {
        clearTimeout(randomSpeakTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [haroActive, speaking, sendMessage]);

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
      <div className="haroBody">
        <div
          className={clsx(
            "haroEye",
            haroActive && "active",
            speaking && "speaking"
          )}
        />
      </div>
      <div className="navigation">
        {!haroActive ? (
          <button onClick={powerOn} className="powerButton">
            <IoMdPower />
          </button>
        ) : (
          <button onClick={powerOff} className="powerButton">
            <IoMdPower />
          </button>
        )}
      </div>
    </div>
  );
}

export default Haro;
