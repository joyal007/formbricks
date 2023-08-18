"use client";

import FormbricksSignature from "@/components/preview/FormbricksSignature";
import Modal from "@/components/preview/Modal";
import Progress from "@/components/preview/Progress";
import QuestionConditional from "@/components/preview/QuestionConditional";
import TabOption from "@/components/preview/TabOption";
import ThankYouCard from "@/components/preview/ThankYouCard";
import type { Logic, Question } from "@formbricks/types/questions";
import { Survey } from "@formbricks/types/surveys";
import type { TEnvironment } from "@formbricks/types/v1/environment";
import type { TProduct } from "@formbricks/types/v1/product";
import { Button } from "@formbricks/ui";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
interface PreviewSurveyProps {
  setActiveQuestionId: (id: string | null) => void;
  activeQuestionId?: string | null;
  questions: Question[];
  brandColor: string;
  environmentId: string;
  surveyType: Survey["type"];
  thankYouCard: Survey["thankYouCard"];
  autoClose: Survey["autoClose"];
  previewType?: "modal" | "fullwidth" | "email";
  product: TProduct;
  environment: TEnvironment;
}

function QuestionRenderer({
  activeQuestionId,
  lastActiveQuestionId,
  questions,
  brandColor,
  thankYouCard,
  gotoNextQuestion,
  showBackButton,
  goToPreviousQuestion,
  storedResponseValue,
}) {
  return (
    <div>
      {(activeQuestionId || lastActiveQuestionId) === "thank-you-card" ? (
        <ThankYouCard
          brandColor={brandColor}
          headline={thankYouCard?.headline || "Thank you!"}
          subheader={thankYouCard?.subheader || "We appreciate your feedback."}
        />
      ) : (
        questions.map((question, idx) =>
          (activeQuestionId || lastActiveQuestionId) === question.id ? (
            <QuestionConditional
              key={question.id}
              question={question}
              brandColor={brandColor}
              lastQuestion={idx === questions.length - 1}
              onSubmit={gotoNextQuestion}
              storedResponseValue={storedResponseValue}
              goToNextQuestion={gotoNextQuestion}
              goToPreviousQuestion={showBackButton ? goToPreviousQuestion : undefined}
              autoFocus={false}
            />
          ) : null
        )
      )}
    </div>
  );
}

function PreviewModalContent({
  activeQuestionId,
  lastActiveQuestionId,
  questions,
  brandColor,
  thankYouCard,
  gotoNextQuestion,
  showBackButton,
  goToPreviousQuestion,
  storedResponseValue,
  showFormbricksSignature,
}) {
  return (
    <div className="px-4 py-6 sm:p-6">
      <QuestionRenderer
        activeQuestionId={activeQuestionId}
        lastActiveQuestionId={lastActiveQuestionId}
        questions={questions}
        brandColor={brandColor}
        thankYouCard={thankYouCard}
        gotoNextQuestion={gotoNextQuestion}
        showBackButton={showBackButton}
        goToPreviousQuestion={goToPreviousQuestion}
        storedResponseValue={storedResponseValue}
      />

      {showFormbricksSignature && <FormbricksSignature />}
    </div>
  );
}

export default function PreviewSurvey({
  setActiveQuestionId,
  activeQuestionId,
  questions,
  brandColor,
  surveyType,
  thankYouCard,
  autoClose,
  previewType,
  product,
  environment,
}: PreviewSurveyProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [progress, setProgress] = useState(0); // [0, 1]
  const [widgetSetupCompleted, setWidgetSetupCompleted] = useState(false);
  const [lastActiveQuestionId, setLastActiveQuestionId] = useState("");
  const [showFormbricksSignature, setShowFormbricksSignature] = useState(false);
  const [finished, setFinished] = useState(false);
  const [storedResponseValue, setStoredResponseValue] = useState<any>();
  const [storedResponse, setStoredResponse] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState("desktop");
  const showBackButton = progress !== 0 && !finished;
  const ContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (product) {
      setShowFormbricksSignature(product.formbricksSignature);
    }
  }, [product]);

  const [countdownProgress, setCountdownProgress] = useState(1);
  const startRef = useRef(performance.now());
  const frameRef = useRef<number | null>(null);
  const [countdownStop, setCountdownStop] = useState(false);

  const handleStopCountdown = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      setCountdownStop(true);
    }
  };

  useEffect(() => {
    if (!autoClose) return;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const frame = () => {
      if (!autoClose || !startRef.current) return;

      const timeout = autoClose * 1000;
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, timeout - elapsed);

      setCountdownProgress(remaining / timeout);

      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(frame);
      } else {
        handleStopCountdown();
        setIsModalOpen(false);
        // reopen the modal after 1 second
        setTimeout(() => {
          setIsModalOpen(true);
          setActiveQuestionId(questions[0]?.id || ""); // set first question as active
        }, 1500);
      }
    };

    setCountdownStop(false);
    setCountdownProgress(1);
    startRef.current = performance.now();
    frameRef.current = requestAnimationFrame(frame);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [autoClose]);

  useEffect(() => {
    if (ContentRef.current) {
      // scroll to top whenever question changes
      ContentRef.current.scrollTop = 0;
    }
    if (activeQuestionId !== "end") {
      setFinished(false);
    }
    if (activeQuestionId) {
      setLastActiveQuestionId(activeQuestionId);
      setProgress(calculateProgress(questions, activeQuestionId));
    } else if (lastActiveQuestionId) {
      setProgress(calculateProgress(questions, lastActiveQuestionId));
    }

    function calculateProgress(questions, activeQuestionId) {
      if (activeQuestionId === "thank-you-card") return 1;

      const elementIdx = questions.findIndex((e) => e.id === activeQuestionId);
      return elementIdx / questions.length;
    }
  }, [activeQuestionId, lastActiveQuestionId, questions]);

  useEffect(() => {
    // close modal if there are no questions left
    if (surveyType === "web" && !thankYouCard.enabled) {
      if (activeQuestionId === "thank-you-card") {
        setIsModalOpen(false);
        setTimeout(() => {
          setActiveQuestionId(questions[0].id);
          setIsModalOpen(true);
        }, 500);
      }
    }
  }, [activeQuestionId, surveyType, questions, setActiveQuestionId, thankYouCard]);

  function evaluateCondition(logic: Logic, responseValue: any): boolean {
    switch (logic.condition) {
      case "equals":
        return (
          (Array.isArray(responseValue) &&
            responseValue.length === 1 &&
            responseValue.includes(logic.value)) ||
          responseValue.toString() === logic.value
        );
      case "notEquals":
        return responseValue !== logic.value;
      case "lessThan":
        return logic.value !== undefined && responseValue < logic.value;
      case "lessEqual":
        return logic.value !== undefined && responseValue <= logic.value;
      case "greaterThan":
        return logic.value !== undefined && responseValue > logic.value;
      case "greaterEqual":
        return logic.value !== undefined && responseValue >= logic.value;
      case "includesAll":
        return (
          Array.isArray(responseValue) &&
          Array.isArray(logic.value) &&
          logic.value.every((v) => responseValue.includes(v))
        );
      case "includesOne":
        return (
          Array.isArray(responseValue) &&
          Array.isArray(logic.value) &&
          logic.value.some((v) => responseValue.includes(v))
        );
      case "accepted":
        return responseValue === "accepted";
      case "clicked":
        return responseValue === "clicked";
      case "submitted":
        if (typeof responseValue === "string") {
          return responseValue !== "dismissed" && responseValue !== "" && responseValue !== null;
        } else if (Array.isArray(responseValue)) {
          return responseValue.length > 0;
        } else if (typeof responseValue === "number") {
          return responseValue !== null;
        }
        return false;
      case "skipped":
        return (
          (Array.isArray(responseValue) && responseValue.length === 0) ||
          responseValue === "" ||
          responseValue === null ||
          responseValue === "dismissed"
        );
      default:
        return false;
    }
  }

  function getNextQuestion(answer: any): string {
    // extract activeQuestionId from answer to make it work when form is collapsed.
    const activeQuestionId = Object.keys(answer)[0];
    if (!activeQuestionId) return "";

    const currentQuestionIndex = questions.findIndex((q) => q.id === activeQuestionId);
    if (currentQuestionIndex === -1) throw new Error("Question not found");

    const responseValue = answer[activeQuestionId];
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.logic && currentQuestion.logic.length > 0) {
      for (let logic of currentQuestion.logic) {
        if (!logic.destination) continue;

        if (evaluateCondition(logic, responseValue)) {
          return logic.destination;
        }
      }
    }
    return questions[currentQuestionIndex + 1]?.id || "end";
  }

  const gotoNextQuestion = (data) => {
    setStoredResponse({ ...storedResponse, ...data });
    const nextQuestionId = getNextQuestion(data);
    setStoredResponseValue(storedResponse[nextQuestionId]);
    if (nextQuestionId !== "end") {
      setActiveQuestionId(nextQuestionId);
    } else {
      setFinished(true);
      if (thankYouCard?.enabled) {
        setActiveQuestionId("thank-you-card");
        setProgress(1);
      } else {
        setIsModalOpen(false);
        setTimeout(() => {
          setActiveQuestionId(questions[0].id);
          setIsModalOpen(true);
        }, 500);
      }
    }
  };

  function goToPreviousQuestion(data: any) {
    setStoredResponse({ ...storedResponse, ...data });
    const currentQuestionIndex = questions.findIndex((q) => q.id === activeQuestionId);
    if (currentQuestionIndex === -1) throw new Error("Question not found");
    const previousQuestionId = questions[currentQuestionIndex - 1].id;
    setStoredResponseValue(storedResponse[previousQuestionId]);
    setActiveQuestionId(previousQuestionId);
  }

  function resetQuestionProgress() {
    setProgress(0);
    setActiveQuestionId(questions[0].id);
    setStoredResponse({});
  }

  useEffect(() => {
    if (environment && environment.widgetSetupCompleted) {
      setWidgetSetupCompleted(true);
    } else {
      setWidgetSetupCompleted(false);
    }
  }, [environment]);

  if (!previewType) {
    previewType = widgetSetupCompleted ? "modal" : "fullwidth";

    if (!activeQuestionId) {
      return <></>;
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-items-center">
      <div className="relative flex h-[95%] max-h-[95%] w-5/6 items-center justify-center rounded-lg border border-slate-300 bg-slate-200">
        {previewMode === "mobile" && (
          <>
            <div className="absolute right-0 top-0 m-2">
              <ResetProgressButton resetQuestionProgress={resetQuestionProgress} />
            </div>
            <div className="relative h-[90%] max-h-[40rem] w-80 overflow-hidden rounded-[3rem] border-8 border-slate-500 bg-slate-400">
              {/* below element is use to create notch for the mobile device mockup   */}
              <div className="absolute left-1/2 right-1/2 top-0 z-20 h-4 w-1/2 -translate-x-1/2 transform rounded-b-md bg-slate-500"></div>
              {previewType === "modal" ? (
                <Modal
                  isOpen={isModalOpen}
                  placement={product.placement}
                  highlightBorderColor={product.highlightBorderColor}
                  previewMode="mobile">
                  {!countdownStop && autoClose !== null && autoClose > 0 && (
                    <Progress progress={countdownProgress} brandColor={brandColor} />
                  )}
                  <PreviewModalContent
                    activeQuestionId={activeQuestionId}
                    lastActiveQuestionId={lastActiveQuestionId}
                    questions={questions}
                    brandColor={brandColor}
                    thankYouCard={thankYouCard}
                    gotoNextQuestion={gotoNextQuestion}
                    showBackButton={showBackButton}
                    goToPreviousQuestion={goToPreviousQuestion}
                    storedResponseValue={storedResponseValue}
                    showFormbricksSignature={showFormbricksSignature}
                  />
                  <Progress progress={progress} brandColor={brandColor} />
                </Modal>
              ) : (
                <div
                  className="absolute top-0 z-10 flex h-full w-full flex-grow flex-col overflow-y-auto"
                  ref={ContentRef}>
                  <div className="flex w-full flex-grow flex-col items-center justify-center bg-white py-6">
                    <div className="w-full max-w-md px-4">
                      <QuestionRenderer
                        activeQuestionId={activeQuestionId}
                        lastActiveQuestionId={lastActiveQuestionId}
                        questions={questions}
                        brandColor={brandColor}
                        thankYouCard={thankYouCard}
                        gotoNextQuestion={gotoNextQuestion}
                        showBackButton={showBackButton}
                        goToPreviousQuestion={goToPreviousQuestion}
                        storedResponseValue={storedResponseValue}
                      />
                    </div>
                  </div>
                  <div className="z-10 w-full rounded-b-lg bg-white">
                    <div className="mx-auto max-w-md space-y-6 p-6 pt-4">
                      <Progress progress={progress} brandColor={brandColor} />
                      {showFormbricksSignature && <FormbricksSignature />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {previewMode === "desktop" && (
          <div className="flex h-full w-5/6 flex-1 flex-col">
            <div className="flex h-8 w-full items-center rounded-t-lg bg-slate-100">
              <div className="ml-6 flex space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              </div>
              <p className="ml-4 flex w-full justify-between font-mono text-sm text-slate-400">
                {previewType === "modal" ? "Your web app" : "Preview"}
                <ResetProgressButton resetQuestionProgress={resetQuestionProgress} />
              </p>
            </div>

            {previewType === "modal" ? (
              <Modal
                isOpen={isModalOpen}
                placement={product.placement}
                highlightBorderColor={product.highlightBorderColor}
                previewMode="desktop">
                {!countdownStop && autoClose !== null && autoClose > 0 && (
                  <Progress progress={countdownProgress} brandColor={brandColor} />
                )}
                <PreviewModalContent
                  activeQuestionId={activeQuestionId}
                  lastActiveQuestionId={lastActiveQuestionId}
                  questions={questions}
                  brandColor={brandColor}
                  thankYouCard={thankYouCard}
                  gotoNextQuestion={gotoNextQuestion}
                  showBackButton={showBackButton}
                  goToPreviousQuestion={goToPreviousQuestion}
                  storedResponseValue={storedResponseValue}
                  showFormbricksSignature={showFormbricksSignature}
                />
                <Progress progress={progress} brandColor={brandColor} />
              </Modal>
            ) : (
              <div className="flex flex-grow flex-col overflow-y-auto" ref={ContentRef}>
                <div className="flex w-full flex-grow p-4 flex-col items-center justify-center bg-white py-6">
                  <div className="w-full max-w-md">
                    <QuestionRenderer
                      activeQuestionId={activeQuestionId}
                      lastActiveQuestionId={lastActiveQuestionId}
                      questions={questions}
                      brandColor={brandColor}
                      thankYouCard={thankYouCard}
                      gotoNextQuestion={gotoNextQuestion}
                      showBackButton={showBackButton}
                      goToPreviousQuestion={goToPreviousQuestion}
                      storedResponseValue={storedResponseValue}
                    />
                  </div>
                </div>
                <div className="z-10 w-full rounded-b-lg bg-white">
                  <div className="mx-auto max-w-md space-y-6 p-6 pt-4">
                    <Progress progress={progress} brandColor={brandColor} />
                    {showFormbricksSignature && <FormbricksSignature />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* for toggling between mobile and desktop mode  */}
      <div className="mt-2 flex rounded-full border-2 border-slate-300 p-1">
        <TabOption
          active={previewMode === "mobile"}
          icon={<DevicePhoneMobileIcon className="mx-4 my-2 h-4 w-4 text-slate-700" />}
          onClick={() => setPreviewMode("mobile")}
        />
        <TabOption
          active={previewMode === "desktop"}
          icon={<ComputerDesktopIcon className="mx-4 my-2 h-4 w-4 text-slate-700" />}
          onClick={() => setPreviewMode("desktop")}
        />
      </div>
    </div>
  );
}

function ResetProgressButton({ resetQuestionProgress }) {
  return (
    <Button
      variant="minimal"
      className="py-0.2 bg-white mr-2 px-2 text-sm text-slate-500 font-sans"
      onClick={resetQuestionProgress}>
      Restart
      <ArrowPathRoundedSquareIcon className="ml-2 h-4 w-4" />
    </Button>
  );
}
