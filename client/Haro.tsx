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
  const haroActiveRef = useRef(haroActive);
  const voices = useVoices();

  const speak = useCallback(
    (content: string) => {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = "ja-JP"; // Set language to Japanese
      utterance.voice =
        voices.find(
          (voice) => voice.lang === "ja-JP" && voice.name.includes("Google")
        ) ||
        voices.find((voice) => voice.lang === "ja-JP") ||
        voices[0]; // Fallback to the first available voice
      utterance.pitch = 1;
      utterance.rate = 1.2;
      utterance.onstart = async () => {
        setSpeaking(true);
        try {
          await SpeechRecognition.stopListening(); // Stop listening while speaking.
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      };
      utterance.onend = async () => {
        setSpeaking(false);
        if (haroActiveRef.current) {
          try {
            await SpeechRecognition.startListening({ continuous: true }); // Restart listening after speaking.
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
          }
        }
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

  const triggerEvent = useCallback(async () => {
    try {
      const response = await axios.post("/api/event");
      const data = response.data;
      if (data && data.content) {
        speak(data.content);
      }
    } catch (error) {
      console.error("Error triggering event:", error);
    }
  }, [speak]);

  // Schedule a random message event when Haro is active.
  const scheduleEvent = useCallback(async () => {
    const scheduleNext = () => {
      const min = 15000; // 15 seconds
      const max = 60000; // 60 seconds
      const delay = Math.floor(Math.random() * (max - min)) + min;
      const id = setTimeout(async () => {
        if (!speaking) {
          await triggerEvent();
        }
        scheduleNext();
      }, delay);
      setRandomSpeakTimer(id);
    };
    scheduleNext();
  }, [speaking, triggerEvent]);

  // Cleanup the random message event timer when Haro is not active or speaking.
  const cleanupEvent = useCallback(() => {
    if (randomSpeakTimer) {
      clearTimeout(randomSpeakTimer);
      setRandomSpeakTimer(null);
    }
  }, [randomSpeakTimer]);

  const rescheduleEvent = useCallback(() => {
    cleanupEvent();
    scheduleEvent();
  }, [cleanupEvent, scheduleEvent]);

  const powerOn = useCallback(async () => {
    setHaroActive(true);
    haroActiveRef.current = true;
    sendMessage("起動時の挨拶を言ってください。");
    scheduleEvent();
    try {
      await SpeechRecognition.startListening({
        continuous: true,
        language: "ja-JP",
      });
      console.log("Haro is now active and listening.");
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  }, [sendMessage, scheduleEvent]);

  const powerOff = useCallback(async () => {
    setHaroActive(false);
    haroActiveRef.current = false;
    sendMessage("お休みの挨拶を言ってください。");
    cleanupEvent();
    try {
      await SpeechRecognition.stopListening();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  }, [sendMessage, cleanupEvent]);

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
        sendMessage(newMessage);
        rescheduleEvent();
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        resetTranscript(); // Clear the transcript after processing
      }
    }, SILENCE_TIMEOUT);
  }, [transcript, sendMessage, rescheduleEvent, resetTranscript]);

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
          <button onClick={powerOn} className="powerButton inactive">
            <IoMdPower className="powerIcon" />
          </button>
        ) : (
          <button onClick={powerOff} className="powerButton active">
            <IoMdPower className="powerIcon" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Haro;
