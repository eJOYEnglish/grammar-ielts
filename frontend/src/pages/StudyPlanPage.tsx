import React from 'react';

import type { WeakTopic } from '../utils/scoring';
import { useTranslation } from '../hooks/useTranslation';
import { StudyPlanContent } from '../components/StudyPlanContent';
// ...
interface StudyPlanPageProps {
    weakTopics?: WeakTopic[];
    userLevel?: number;
    onContinue?: () => void;
}

export const StudyPlanPage: React.FC<StudyPlanPageProps> = ({ weakTopics, userLevel, onContinue }) => {
    // ...
    const { t } = useTranslation();

    React.useEffect(() => {
        document.title = "Grammar Study Plan";
    }, []);

    return (
        <div className="study-plan-container">
            {/* Sticky Header */}
            <header className="study-plan-header">
                <button className="header-btn" onClick={() => window.history.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="header-title">{t('studyPlan.title')}</h2>

            </header>

            <StudyPlanContent weakTopics={weakTopics} userLevel={userLevel} />

            {/* Fixed Footer */}
            <div className="study-plan-footer">
                <button className="primary-btn" onClick={onContinue}>
                    {t('studyPlan.continueButton')}
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};
