"use client";

import { useEffect, useMemo, useState } from "react";

type QuizOption =
  | string
  | {
    id?: string;
    value?: string;
    label?: string;
    text?: string;
  };

type QuizQuestion = {
  id: number | string;
  date?: string;
  question: string;
  options: QuizOption[];
  correct_answer?: string;
  correctAnswer?: string;
  explanation?: string;
};

type QuizResponse = {
  title?: string;
  country?: string;
  period?: {
    from?: string;
    to?: string;
  };
  quiz: QuizQuestion[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getOptionValue(option: QuizOption, index: number) {
  if (typeof option === "string") {
    const match = option.match(/^([A-D])\.\s*/);

    return match ? match[1] : String.fromCharCode(65 + index);
  }

  return (
    option.value ??
    option.id ??
    String.fromCharCode(65 + index)
  ).toString();
}

function getOptionLabel(option: QuizOption) {
  if (typeof option === "string") {
    return option.replace(/^[A-D]\.\s*/, "");
  }

  return option.label ?? option.text ?? option.value ?? "";
}

export default function HomePage() {
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");
        const params = {
          start_date: "2026-09-06",
          end_date: "2026-09-14"
        }
        const queryString = new URLSearchParams(params).toString();

        const response = await fetch(`${API_URL}?${queryString}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API returned HTTP ${response.status}`);
        }

        const data: QuizResponse = await response.json();

        if (!Array.isArray(data.quiz)) {
          throw new Error("API response does not contain a valid quiz array.");
        }

        setQuizData(data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the quiz."
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, []);

  const questions = useMemo(() => {
    return quizData?.quiz || [];
  }, [quizData?.quiz]);
  const question = questions[currentQuestion];

  const correctAnswer =
    question?.correct_answer ?? question?.correctAnswer ?? "";

  const answered = selectedAnswer !== null;

  const isCorrect =
    selectedAnswer !== null && selectedAnswer === correctAnswer;

  const progress = questions.length
    ? ((currentQuestion + 1) / questions.length) * 100
    : 0;

  const score = useMemo(() => {
    return questions.reduce((total, q) => {
      const expected = q.correct_answer ?? q.correctAnswer;

      return answers[String(q.id)] === expected
        ? total + 1
        : total;
    }, 0);
  }, [answers, questions]);

  function selectAnswer(answer: string) {
    if (answered || !question) return;

    setSelectedAnswer(answer);

    setAnswers((previous) => ({
      ...previous,
      [String(question.id)]: answer,
    }));
  }

  function goNext() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
      setSelectedAnswer(null);
    } else {
      setFinished(true);
    }
  }

  function restartQuiz() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setFinished(false);
  }

  if (loading) {
    return (
      <main className="page centered">
        <div className="loaderCard">
          <div className="loader" />
          <h2>{"Loading today's challenge"}</h2>
          <p>Fetching the latest Australian news quiz…</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page centered">
        <div className="errorCard">
          <div className="errorIcon">!</div>

          <p className="eyebrow">CONNECTION ERROR</p>
          <h1>{"Couldn't load the quiz"}</h1>

          <p className="errorMessage">{error}</p>

          <div className="apiHint">
            Make sure your API is running at
            <code> http://localhost:8080</code>
          </div>

          <button
            className="primaryButton"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!quizData || !questions.length) {
    return (
      <main className="page centered">
        <div className="errorCard">
          <h1>No quiz available</h1>
          <p>The API returned an empty quiz.</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <main className="page centered">
        <section className="resultCard">
          <div className="resultEmoji">
            {percentage >= 80 ? "🏆" : percentage >= 50 ? "👏" : "📰"}
          </div>

          <p className="eyebrow">QUIZ COMPLETE</p>

          <h1>
            {percentage >= 80
              ? "News expert!"
              : percentage >= 50
                ? "Nice work!"
                : "Keep reading!"}
          </h1>

          <p className="resultDescription">
            You scored
          </p>

          <div className="score">
            <span>{score}</span>
            <small>/ {questions.length}</small>
          </div>

          <div className="percentage">{percentage}% correct</div>

          <div className="scoreBar">
            <div
              className="scoreBarFill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <button className="primaryButton" onClick={restartQuiz}>
            Play again
          </button>
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="backgroundBlob blobOne" />
      <div className="backgroundBlob blobTwo" />

      <div className="container">
        <header className="header">
          <div>
            <div className="brand">
              <div className="brandIcon">N</div>
              <span>NewsQuiz</span>
            </div>
          </div>

          <div className="headerBadge">
            🇦🇺 {quizData.country ?? "Australia"}
          </div>
        </header>

        <section className="hero">
          <p className="eyebrow">WEEKLY NEWS CHALLENGE</p>

          <h1>{quizData.title ?? "Australian News Quiz"}</h1>

          <p>
            {"How closely have you been following the news? Test your knowledge of Australia's biggest stories."}
          </p>

          {quizData.period?.from && quizData.period?.to && (
            <div className="period">
              {quizData.period.from} → {quizData.period.to}
            </div>
          )}
        </section>

        <section className="quizCard">
          <div className="quizTop">
            <div>
              <span className="questionLabel">
                Question {currentQuestion + 1}
              </span>
              <span className="questionTotal">
                {" "}
                of {questions.length}
              </span>
            </div>

            <div className="questionDate">
              {question.date ?? "Australian News"}
            </div>
          </div>

          <div className="progressTrack">
            <div
              className="progressFill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="questionBody">
            <h2>{question.question}</h2>

            <div className="options">
              {question.options.map((option, index) => {
                const value = getOptionValue(option, index);
                const label = getOptionLabel(option);

                const selected = selectedAnswer === value;
                const optionCorrect = value === correctAnswer;

                let className = "option";

                if (answered && optionCorrect) {
                  className += " correct";
                } else if (answered && selected && !optionCorrect) {
                  className += " incorrect";
                } else if (selected) {
                  className += " selected";
                }

                return (
                  <button
                    key={`${value}-${index}`}
                    className={className}
                    disabled={answered}
                    onClick={() => selectAnswer(value)}
                  >
                    <span className="letter">{value}</span>

                    <span className="optionText">
                      {label}
                    </span>

                    {answered && optionCorrect && (
                      <span className="answerIcon">✓</span>
                    )}

                    {answered && selected && !optionCorrect && (
                      <span className="answerIcon">×</span>
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div
                className={`feedback ${isCorrect ? "successFeedback" : "wrongFeedback"
                  }`}
              >
                <div className="feedbackHeading">
                  {isCorrect ? "✓ Correct!" : "Not quite"}
                </div>

                <p>
                  {question.explanation ??
                    (isCorrect
                      ? "Great job — you got it right."
                      : `The correct answer is ${correctAnswer}.`)}
                </p>
              </div>
            )}

            <div className="actions">
              <div className="answerStatus">
                {!answered
                  ? "Select an answer to continue"
                  : isCorrect
                    ? "Great work!"
                    : "You'll get the next one."}
              </div>

              <button
                className="nextButton"
                disabled={!answered}
                onClick={goNext}
              >
                {currentQuestion === questions.length - 1
                  ? "See results"
                  : "Next question"}

                <span>→</span>
              </button>
            </div>
          </div>
        </section>

        <footer>
          <span>
            {score} correct so far
          </span>

          <span>•</span>

          <span>
            {questions.length - currentQuestion - 1} questions remaining
          </span>
        </footer>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #fff7fb;
    color: #34263c;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  button {
    font: inherit;
  }

  .page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 10% 10%, rgba(255, 182, 213, 0.35), transparent 28%),
      radial-gradient(circle at 90% 20%, rgba(200, 182, 255, 0.32), transparent 30%),
      radial-gradient(circle at 50% 100%, rgba(255, 218, 185, 0.3), transparent 35%),
      linear-gradient(180deg, #fff9fc 0%, #f9f4ff 100%);
  }

  .centered {
    display: grid;
    place-items: center;
    padding: 24px;
  }

  .container {
    position: relative;
    z-index: 2;
    width: min(100% - 32px, 960px);
    margin: 0 auto;
    padding-bottom: 48px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 850;
    color: #432d4d;
  }

  .brandIcon {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    border-radius: 15px;
    background: linear-gradient(135deg, #ff87b7, #b68cff);
    color: #fff;
    box-shadow: 0 12px 30px rgba(203, 122, 190, 0.28);
  }

  .headerBadge,
  .period {
    border: 1px solid rgba(168, 113, 181, 0.15);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(14px);
    border-radius: 999px;
    box-shadow: 0 8px 25px rgba(102, 75, 115, 0.06);
  }

  .headerBadge {
    padding: 10px 15px;
    color: #7f608a;
    font-size: 13px;
    font-weight: 700;
  }

  .hero {
    max-width: 720px;
    margin: 50px auto 40px;
    text-align: center;
  }

  .eyebrow {
    margin: 0 0 12px;
    color: #d75f9d;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.16em;
  }

  .hero h1,
  .resultCard h1,
  .errorCard h1 {
    margin: 0;
    line-height: 1.08;
  }

  .hero h1 {
    font-size: clamp(40px, 6vw, 68px);
    letter-spacing: -0.045em;
    background: linear-gradient(
      100deg,
      #5f3f70 10%,
      #d75f9d 50%,
      #9a77dc 90%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero > p:not(.eyebrow) {
    max-width: 590px;
    margin: 20px auto;
    color: #8d7895;
    font-size: 17px;
    line-height: 1.7;
  }

  .period {
    display: inline-flex;
    padding: 9px 14px;
    color: #947ca0;
    font-size: 12px;
  }

  .quizCard {
    overflow: hidden;
    border: 1px solid rgba(196, 139, 192, 0.18);
    background: rgba(255, 255, 255, 0.8);
    box-shadow:
      0 30px 70px rgba(101, 64, 112, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(18px);
    border-radius: 30px;
  }

  .quizTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 28px 18px;
  }

  .questionLabel {
    font-weight: 800;
    color: #5e4168;
  }

  .questionTotal {
    color: #b09bb7;
  }

  .questionDate {
    color: #a08ca7;
    font-size: 13px;
  }

  .progressTrack {
    width: 100%;
    height: 6px;
    background: #f3e8f2;
  }

  .progressFill,
  .scoreBarFill {
    height: 100%;
    background: linear-gradient(90deg, #ff82b7, #b48cff);
    transition: width 0.35s ease;
  }

  .questionBody {
    padding: 38px 40px 34px;
  }

  .questionBody h2 {
    max-width: 780px;
    margin: 0 0 30px;
    color: #432d4d;
    font-size: clamp(22px, 3.5vw, 32px);
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  .options {
    display: grid;
    gap: 14px;
  }

  .option {
    display: flex;
    width: 100%;
    min-height: 70px;
    align-items: center;
    gap: 15px;
    padding: 14px 16px;
    border: 1px solid #eadcea;
    background: #fffafd;
    color: #5e4b65;
    border-radius: 18px;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 8px 22px rgba(104, 73, 112, 0.04);
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;
  }

  .option:not(:disabled):hover {
    transform: translateY(-3px);
    border-color: #e79bc0;
    background: #fff2f8;
    box-shadow: 0 12px 28px rgba(203, 111, 165, 0.11);
  }

  .option:disabled {
    cursor: default;
  }

  .letter {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    place-items: center;
    border: 1px solid #ead6e8;
    background: linear-gradient(135deg, #fff1f7, #f4edff);
    border-radius: 14px;
    color: #bf6795;
    font-size: 13px;
    font-weight: 850;
  }

  .optionText {
    flex: 1;
    line-height: 1.45;
  }

  .selected {
    border-color: #d87eac;
    background: #fff1f8;
  }

  .correct {
    border-color: #8fd4bd;
    background: #f0fbf7;
  }

  .correct .letter {
    border-color: #9edbc7;
    background: #e3f7f0;
    color: #348f70;
  }

  .incorrect {
    border-color: #f2a6b5;
    background: #fff3f5;
  }

  .incorrect .letter {
    color: #d75b73;
    background: #ffe6eb;
  }

  .answerIcon {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    font-size: 20px;
    font-weight: 850;
  }

  .feedback {
    margin-top: 24px;
    padding: 19px 21px;
    border-radius: 17px;
    animation: fadeUp 0.22s ease;
  }

  .successFeedback {
    border: 1px solid #b9e7d7;
    background: #f0faf7;
  }

  .wrongFeedback {
    border: 1px solid #f3c1cc;
    background: #fff5f7;
  }

  .feedbackHeading {
    margin-bottom: 6px;
    font-weight: 850;
  }

  .successFeedback .feedbackHeading {
    color: #348f70;
  }

  .wrongFeedback .feedbackHeading {
    color: #d45b74;
  }

  .feedback p {
    margin: 0;
    color: #806d87;
    line-height: 1.6;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-top: 30px;
  }

  .answerStatus {
    color: #aa94b1;
    font-size: 13px;
  }

  .nextButton,
  .primaryButton {
    border: 0;
    background: linear-gradient(135deg, #ff83b7, #b98cff);
    color: white;
    font-weight: 800;
    box-shadow: 0 14px 30px rgba(198, 112, 179, 0.24);
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      opacity 0.18s ease;
  }

  .nextButton {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-radius: 14px;
  }

  .nextButton:disabled {
    opacity: 0.35;
    box-shadow: none;
    cursor: not-allowed;
  }

  .nextButton:not(:disabled):hover,
  .primaryButton:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 16px 36px rgba(198, 112, 179, 0.32);
  }

  footer {
    display: flex;
    justify-content: center;
    gap: 9px;
    margin-top: 22px;
    color: #b09bb7;
    font-size: 12px;
  }

  .loaderCard,
  .errorCard,
  .resultCard {
    width: min(100%, 520px);
    padding: 50px 38px;
    border: 1px solid rgba(196, 139, 192, 0.18);
    background: rgba(255, 255, 255, 0.88);
    border-radius: 30px;
    box-shadow: 0 28px 70px rgba(101, 64, 112, 0.13);
    text-align: center;
  }

  .loader {
    width: 44px;
    height: 44px;
    margin: 0 auto 22px;
    border: 4px solid #f1e2ef;
    border-top-color: #e575aa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loaderCard p,
  .errorCard p,
  .resultDescription {
    color: #927e99;
  }

  .errorIcon {
    display: grid;
    width: 56px;
    height: 56px;
    margin: 0 auto 22px;
    place-items: center;
    background: #ffe8ef;
    color: #d65b75;
    border-radius: 18px;
    font-size: 24px;
    font-weight: 850;
  }

  .errorMessage {
    line-height: 1.6;
  }

  .apiHint {
    margin: 25px 0;
    padding: 14px;
    background: #fbf2f8;
    color: #8a758f;
    border-radius: 12px;
    font-size: 13px;
  }

  .apiHint code {
    color: #c46094;
  }

  .primaryButton {
    padding: 14px 23px;
    border-radius: 14px;
  }

  .resultEmoji {
    margin-bottom: 12px;
    font-size: 52px;
  }

  .score {
    margin: 20px 0 4px;
  }

  .score span {
    color: #5c3d68;
    font-size: 78px;
    font-weight: 900;
    letter-spacing: -0.06em;
  }

  .score small {
    color: #b09cb5;
    font-size: 24px;
    font-weight: 700;
  }

  .percentage {
    color: #ce6aa0;
    font-weight: 800;
  }

  .scoreBar {
    height: 9px;
    margin: 28px 0;
    overflow: hidden;
    background: #f1e4f0;
    border-radius: 20px;
  }

  .scoreBarFill {
    border-radius: 20px;
  }

  .backgroundBlob {
    position: absolute;
    width: 420px;
    height: 420px;
    filter: blur(110px);
    opacity: 0.24;
    border-radius: 50%;
    pointer-events: none;
  }

  .blobOne {
    top: 80px;
    left: -220px;
    background: #f7a6cb;
  }

  .blobTwo {
    right: -180px;
    bottom: 0;
    background: #c5b0ff;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(6px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .container {
      width: min(100% - 20px, 960px);
    }

    .header {
      padding: 18px 0;
    }

    .hero {
      margin-top: 34px;
    }

    .hero h1 {
      font-size: 40px;
    }

    .questionBody {
      padding: 28px 20px 24px;
    }

    .quizTop {
      padding: 18px 20px 15px;
    }

    .questionDate {
      display: none;
    }

    .option {
      min-height: 66px;
      padding: 12px;
    }

    .actions {
      align-items: stretch;
      flex-direction: column;
    }

    .nextButton {
      justify-content: center;
      width: 100%;
    }

    .answerStatus {
      text-align: center;
    }

    footer {
      flex-wrap: wrap;
    }
  }
`;