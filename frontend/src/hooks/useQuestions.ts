import { useState, useEffect } from 'react';
import type { Question } from '../types';
import allQuestionsData from '../data/questions.json';

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

export const useQuestions = (language: string) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadQuestions = async () => {
            // Simulate network delay for UX (optional, can be removed)
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                // Cast imported data to Question[] to ensure type compatibility
                // questions.json structure aligns well with Question interface
                const allQuestions = allQuestionsData as unknown as Question[];

                // Group questions by topicNumber
                const questionsByTopic = new Map<number, Question[]>();
                allQuestions.forEach(q => {
                    // Start topic numbering from 1 if 0, or ensure it exists
                    // Assuming topicNumber is reliable in json. If missing, might need fallback.
                    // Based on previous file view, topicNumber exists.
                    const topic = q.topicNumber;
                    if (!questionsByTopic.has(topic)) {
                        questionsByTopic.set(topic, []);
                    }
                    questionsByTopic.get(topic)?.push(q);
                });

                const selectedQuestions: Question[] = [];

                // We expect 25 topics (1-25). 
                // Iterate through expected topics to ensure coverage, or iterate keys map.
                // Iterating 1 to 25 ensures we get exactly what we want if available.
                const TOTAL_TOPICS = 25;
                const QUESTIONS_PER_TOPIC = 2;

                for (let i = 1; i <= TOTAL_TOPICS; i++) {
                    const topicQuestions = questionsByTopic.get(i);
                    if (topicQuestions && topicQuestions.length > 0) {
                        const shuffled = shuffle(topicQuestions);
                        selectedQuestions.push(...shuffled.slice(0, QUESTIONS_PER_TOPIC));
                    }
                }

                // If for some reason we missed topics (e.g. json data issue), 
                // we might have fewer than 50. 
                // But blindly taking what we found is safer than erroring out.

                // Shuffle the final list so topics are mixed
                const finalQuizQuestions = shuffle(selectedQuestions);

                setQuestions(finalQuizQuestions);
                setSessionId(crypto.randomUUID());
                setLoading(false);
            } catch (err: unknown) {
                console.error(err);
                setError('Failed to load questions');
                setLoading(false);
            }
        };

        loadQuestions();
    }, [language]); // eslint-disable-next-line react-hooks/exhaustive-deps

    return { questions, sessionId, loading, error };
};
