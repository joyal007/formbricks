import { useEffect, useState, useRef } from "react";
import Headline from "./Headline";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
// import Subheader from "./Subheader";
import SubmitButton from "@/components/preview/SubmitButton";
import { Response } from "@formbricks/types/js";
import { BackButton } from "@/components/preview/BackButton";
import { TSurveyBookWithCalcomQuestion } from "@formbricks/types/v1/surveys";
import Cal, { getCalApi } from "@calcom/embed-react";

interface BookWithCalcomQuestion {
  question: TSurveyBookWithCalcomQuestion;
  onSubmit: (data: { [x: string]: any }) => void;
  lastQuestion: boolean;
  brandColor: string;
  storedResponseValue: string | null;
  goToNextQuestion: (answer: Response["data"]) => void;
  goToPreviousQuestion?: (answer: Response["data"]) => void;
  autoFocus?: boolean;
}

export default function BookingWithCalcomQuestion({
  question,
  onSubmit,
  lastQuestion,
  brandColor,
  storedResponseValue,
  goToNextQuestion,
  goToPreviousQuestion
}: BookWithCalcomQuestion) {
  const [value, setValue] = useState<string>("");
  const [isLoaded,setIsLoaded] = useState(false)
  useEffect(() => {
    setValue(storedResponseValue ?? "");
  }, [storedResponseValue, question.id,]);

  const handleSubmit = (value: string) => {
    const data = {
      [question.id]: value,
    };
    if (storedResponseValue === value) {
      goToNextQuestion(data);
      return;
    }
    onSubmit(data);
    // setValue(""); // reset value
  };

  useEffect(() => {
    (function (C, A, L) {
      let p = function (a, ar) {
        a.q.push(ar);
      };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            typeof namespace === "string"
              ? (cal.ns[namespace] = api) && p(api, ar)
              : p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://cal.com/embed.js", "init");

    window.Cal("init");
    setIsLoaded(true)
   
  }, []);

  useEffect(()=>{
    if(isLoaded){
      const myCalEmbed = document.querySelector("#my-cal-embed");
      if(myCalEmbed)
        myCalEmbed.innerHTML = ""
      window.Cal("inline", {
      elementOrSelector: "#my-cal-embed",
      calLink: question.username,
      config:{
        theme:"light"
      }
      });
    }
  },[question.username,isLoaded])



  if (!isLoaded ) {
    return <LoadingSpinner />;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(value);
      }}>
      <div id="my-cal-embed"></div>
      <div className="mt-4 flex w-full justify-between">
        {goToPreviousQuestion && (
          <BackButton
            onClick={() => {
              goToPreviousQuestion({
                [question.id]: value,
              });
            }}
          />
        )}
        <div></div>
        <SubmitButton {...{ question, lastQuestion, brandColor, storedResponseValue, goToNextQuestion }} />
      </div>
    </form>
  );
}
