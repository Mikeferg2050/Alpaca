"use client";

import { Form, FormButtons, InfoBox, Input, Spinner } from "@client";
import whichIndexesIncorrect from "@/lib/whichIndexesIncorrect";
import { correctConfetti } from "@/lib/correctConfetti";
import { useAlerts, useStore } from "@/store/store";
import styles from "./QuizInput.module.css";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

export function ListAnswer({ quiz, lighter, setCorrect, canClientCheck }) {
    const [answers, setAnswers] = useState(new Array(quiz.numOfAnswers).fill(""));
    const [incorrectIndexes, setIncorrectIndexes] = useState([]);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [loading, setLoading] = useState(false);
    const [failures, setFailures] = useState(0);
    const [errors, setErrors] = useState({});
    const [hints, setHints] = useState([]);

    const addAlert = useAlerts((state) => state.addAlert);
    const user = useStore((state) => state.user);
    const showConfetti = user.settings?.showConfetti ?? true;

    const isOrdered = quiz.type === "ordered-list-answer";

    useEffect(() => {
        setCorrect(isCorrect);
    }, [isCorrect]);

    async function handleSubmitAnswer(e) {
        e.preventDefault();
        if (hasAnswered || !answers.length) return;

        if (quiz.multipleAnswers) {
            if (answers.length !== quiz.numOfAnswers) {
                return setErrors({ answers: `Please select all ${quiz.numOfAnswers} answers` });
            }
        }

        setLoading(true);

        if (canClientCheck) {
            const incorrect = whichIndexesIncorrect(
                answers,
                quiz.answers,
                quiz.type !== "unordered-list-answer"
            );
            const isCorrect = quiz.answers.every((a) => answers.includes(a));

            if (!isCorrect) {
                setIncorrectIndexes(incorrect);
                setFailures((prev) => prev + 1);
                setIsCorrect(false);
                setHasAnswered(true);

                const showHints = failures >= 2;

                if (showHints) {
                    setHints(quiz.hints);
                }

                return setLoading(false);
            }

            setHints([]);
            setIsCorrect(true);
            setHasAnswered(true);

            if (showConfetti) {
                correctConfetti();
            }
        } else {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BASEPATH ?? ""}/api/quiz/${quiz.id}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ answers }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to check answer");
                } else {
                    const data = await response.json();
                    if (!data?.content) throw new Error("No data returned");

                    const { isCorrect, incorrectIndexes, hints } = data.content;

                    setIncorrectIndexes(incorrectIndexes ?? []);
                    setIsCorrect(isCorrect);
                    setHasAnswered(true);
                    setHints(hints);

                    if (!isCorrect) {
                        setFailures((prev) => prev + 1);
                    } else {
                        setHints([]);

                        if (showConfetti) {
                            correctConfetti();
                        }
                    }
                }
            } catch (error) {
                setHasAnswered(false);
                addAlert({
                    success: false,
                    message: error.message,
                });
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <Form
            gap={20}
            singleColumn
            onSubmit={handleSubmitAnswer}
        >
            {isOrdered && <InfoBox fullWidth>Order the answers correctly</InfoBox>}

            {answers.map((a, i) => {
                const hasError = incorrectIndexes.includes(i);

                return (
                    <div
                        key={`answer-${i}`}
                        draggable={isOrdered}
                        className={styles.dragContainer}
                    >
                        {isOrdered && (
                            <span className={styles.dragHandle}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    height="16"
                                    width="16"
                                >
                                    <path d="m17,6c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0,18c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0-9c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3ZM7,6c-1.654,0-3-1.346-3-3S5.346,0,7,0s3,1.346,3,3-1.346,3-3,3Zm0,18c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0-9c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Z" />
                                </svg>
                            </span>
                        )}

                        <Input
                            value={a}
                            type="text"
                            darker={lighter}
                            label={`Answer ${i + 1}`}
                            placeholder="Type your answer here"
                            disabled={hasAnswered && !hasError}
                            error={hasError && "Incorrect answer"}
                            success={hasAnswered && !hasError && "- Yay! You got it right!"}
                            onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[i] = e.target.value;
                                setAnswers(newAnswers);
                                setHasAnswered(false);

                                // Remove error for current index
                                if (hasError) {
                                    setIncorrectIndexes((prev) => prev.filter((ii) => ii !== i));
                                }
                            }}
                        />
                    </div>
                );
            })}

            {!!hints.length && (
                <InfoBox
                    fullWidth
                    asDiv
                >
                    <h4>Here are some hints to help you out</h4>
                    <ul className={styles.hints}>
                        {hints.map((hint) => (
                            <li key={nanoid()}>{hint}</li>
                        ))}
                    </ul>
                </InfoBox>
            )}

            <FormButtons>
                <button
                    type="submit"
                    disabled={(hasAnswered && !isCorrect) || !answers.length || loading}
                    className={`button small ${hasAnswered ? (isCorrect ? "success" : "danger") : "primary"}`}
                >
                    {isCorrect ? "Correct!" : hasAnswered ? "Incorrect" : "Check Answer "}{" "}
                    {loading && (
                        <Spinner
                            primary
                            size={14}
                            margin={2}
                        />
                    )}
                </button>

                {hasAnswered && isCorrect && (
                    <button
                        type="button"
                        className="button small border"
                        onClick={() => {
                            setIncorrectIndexes([]);
                            setAnswers(new Array(quiz.numOfAnswers).fill(""));
                            setIsCorrect(false);
                            setHasAnswered(false);
                        }}
                    >
                        Try Again
                    </button>
                )}
            </FormButtons>
        </Form>
    );
}
