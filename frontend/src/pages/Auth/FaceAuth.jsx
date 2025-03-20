import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FaceAuth = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [step, setStep] = useState("blink"); // "blink", "mouth", "complete"
  const [isBlinking, setIsBlinking] = useState(false);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [faceEncoding, setFaceEncoding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectionActive, setDetectionActive] = useState(false); // New state for feedback
  const navigate = useNavigate();

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      try {
        setLoading(true);
        const modelPath = "/models";
        console.log("Loading models from:", modelPath);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath).catch(err => {
            throw new Error(`Failed to load tinyFaceDetector: ${err.message}`);
          }),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath).catch(err => {
            throw new Error(`Failed to load faceLandmark68Net: ${err.message}`);
          }),
          faceapi.nets.faceExpressionNet.loadFromUri(modelPath).catch(err => {
            throw new Error(`Failed to load faceExpressionNet: ${err.message}`);
          }),
        ]);
        console.log("Models loaded successfully");
        startVideo();
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error("Failed to load face detection models. Check console.");
      } finally {
        setLoading(false);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log("Video stream started");
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
          toast.error("Please allow webcam access");
        });
    };

    loadModelsAndStartVideo();
  }, []);

  useEffect(() => {
    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    };

    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const runDetection = async () => {
        console.log("Detection loop started for step:", step);
        setDetectionActive(true);
        if (step === "blink") speak("Please blink your eyes");
        else if (step === "mouth") speak("Please open your mouth");

        const interval = setInterval(async () => {
          const detections = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

          if (detections) {
            console.log("Face detected:", detections);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const landmarks = resizedDetections.landmarks;

            // Eye blink detection
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const eyeAspectRatio = (eyePoints) => {
              const v1 = Math.sqrt(
                Math.pow(eyePoints[1].x - eyePoints[5].x, 2) +
                Math.pow(eyePoints[1].y - eyePoints[5].y, 2)
              );
              const v2 = Math.sqrt(
                Math.pow(eyePoints[2].x - eyePoints[4].x, 2) +
                Math.pow(eyePoints[2].y - eyePoints[4].y, 2)
              );
              const h = Math.sqrt(
                Math.pow(eyePoints[0].x - eyePoints[3].x, 2) +
                Math.pow(eyePoints[0].y - eyePoints[3].y, 2)
              );
              return (v1 + v2) / (2.0 * h);
            };
            const leftEAR = eyeAspectRatio(leftEye);
            const rightEAR = eyeAspectRatio(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;
            console.log("Avg EAR:", avgEAR); // Debug EAR value
            const blinkDetected = avgEAR < 0.3; // Relaxed threshold
            setIsBlinking(blinkDetected);

            // Mouth open detection
            const mouth = landmarks.getMouth();
            const mouthHeight = Math.sqrt(
              Math.pow(mouth[13].x - mouth[19].x, 2) +
              Math.pow(mouth[13].y - mouth[19].y, 2)
            );
            const mouthWidth = Math.sqrt(
              Math.pow(mouth[0].x - mouth[6].x, 2) +
              Math.pow(mouth[0].y - mouth[6].y, 2)
            );
            const mouthRatio = mouthHeight / mouthWidth;
            console.log("Mouth Ratio:", mouthRatio); // Debug mouth ratio
            const mouthOpenDetected = mouthRatio > 0.4; // Relaxed threshold
            setIsMouthOpen(mouthOpenDetected);

            // Draw on canvas
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Step logic
            if (step === "blink" && blinkDetected) {
              toast.success("Blink detected!");
              setStep("mouth");
            } else if (step === "mouth" && mouthOpenDetected) {
              toast.success("Mouth open detected!");
              const encoding = detections.landmarks.positions.map(p => [p.x, p.y]).flat();
              setFaceEncoding(encoding);
              saveFaceData(encoding);
            }
          } else {
            console.log("No face detected in frame");
            setDetectionActive(false);
          }
        }, 100);

        return () => {
          clearInterval(interval);
          setDetectionActive(false);
        };
      };

      if (video.readyState >= 2) {
        // Video is ready (HAVE_CURRENT_DATA or higher)
        runDetection();
      } else {
        video.addEventListener("loadeddata", runDetection, { once: true });
      }
    };

    if (videoRef.current) detectFace();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const saveFaceData = async (encoding) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("No user ID found");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/save-face`,
        { userId, faceEncoding: encoding },
        { withCredentials: true }
      );
      console.log("Response:", response.data);
      setIsAuthenticated(true);
      setStep("complete");
      toast.success("Face authenticated and saved!");
    } catch (error) {
      console.error("Error saving face:", error.response ? error.response.data : error.message);
      toast.error("Failed to save face data");
    }
  };

  const handleNext = () => {
    navigate("/client-dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-lg border-t-4 border-[#BE24AA]">
        <h2 className="text-3xl font-bold text-center text-[#BE24AA] mb-6">
          E_RIDE Face Authentication
        </h2>
        {loading ? (
          <p className="text-center text-gray-600 text-lg">Loading models...</p>
        ) : (
          <>
            <div className="relative mb-6">
              <video
                ref={videoRef}
                width="100%"
                height="auto"
                autoPlay
                muted
                className="rounded-lg border-2 border-[#BE24AA] shadow-md"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="flex justify-between text-lg">
                <span>Blink Detected:</span>
                <span className={isBlinking ? "text-[#BE24AA]" : "text-gray-500"}>
                  {isBlinking ? "Yes" : "No"}
                </span>
              </p>
              <p className="flex justify-between text-lg">
                <span>Mouth Open:</span>
                <span className={isMouthOpen ? "text-[#BE24AA]" : "text-gray-500"}>
                  {isMouthOpen ? "Yes" : "No"}
                </span>
              </p>
              <p className="flex justify-between text-lg">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? "text-[#BE24AA]" : "text-gray-500"}>
                  {isAuthenticated ? "Yes" : "No"}
                </span>
              </p>
              <p className="flex justify-between text-lg">
                <span>Detection Active:</span>
                <span className={detectionActive ? "text-[#BE24AA]" : "text-gray-500"}>
                  {detectionActive ? "Yes" : "No"}
                </span>
              </p>
            </div>
            <p className="mt-6 text-center text-md text-gray-600">
              {step === "blink" && "Please blink your eyes to proceed."}
              {step === "mouth" && "Please open your mouth to continue."}
              {step === "complete" && "Authentication complete!"}
            </p>
            {step === "complete" && (
              <button
                onClick={handleNext}
                className="mt-6 w-full bg-[#BE24AA] text-white py-3 rounded-lg hover:bg-[#A11F94] transition-colors"
              >
                Next
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FaceAuth;