import type { BookWithCalcomQuestion } from "@formbricks/types/questions";
import { Survey } from "@formbricks/types/surveys";
import { Input, Label } from "@formbricks/ui";
interface OpenQuestionFormProps {
  localSurvey: Survey;
  question: BookWithCalcomQuestion;
  questionIdx: number;
  updateQuestion: (questionIdx: number, updatedAttributes: any) => void;
  lastQuestion: boolean;
  isInValid: boolean;
}

export default function BookWithCalcomForm({
  question,
  questionIdx,
  updateQuestion,
  isInValid,
}: OpenQuestionFormProps): JSX.Element {
  return (
    <form>
      <div className="mt-3">
        <Label htmlFor="headline">{question.subheader}</Label>
        <div className="mt-2">
          <Input
            autoFocus
            id="headline"
            name="headline"
            placeholder={question.placeholder}
            value={question.username}
            onChange={(e) => updateQuestion(questionIdx, { username: e.target.value })}
            isInvalid={isInValid && question.headline.trim() === ""}
          />
        </div>
      </div>
    </form>
  );
}
