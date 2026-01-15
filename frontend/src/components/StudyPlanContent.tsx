import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import type { WeakTopic } from '../utils/scoring';
import grammarResourcesRaw from '../data/grammar_resources.json';

// Type assertion for the imported JSON
// Type assertion for the imported JSON
const grammarResources = grammarResourcesRaw as Record<string, {
    bookDetails: string;
    videos: Array<{
        title: string;
        url: string;
        level: number;
    }>;
}>;

interface VideoResource {
    title: string;
    url: string;
    level: number;
}

interface WeakTopicExtended {
    topicName: string;
    studyReference: string;
    videos: VideoResource[];
}

interface StudyPlanContentProps {
    weakTopics?: WeakTopic[];
    userLevel?: number;
}

export const StudyPlanContent: React.FC<StudyPlanContentProps> = ({ weakTopics, userLevel = 3 }) => {
    const { t } = useTranslation();

    // Convert WeakTopic[] to WeakTopicExtended[] with real study references
    const topicsToDisplay = (weakTopics && weakTopics.length > 0)
        ? weakTopics
        : [
            { topicName: 'Present tenses', correct: 0, total: 0, accuracy: 0 },
            { topicName: 'Past tenses 1', correct: 0, total: 0, accuracy: 0 },
            { topicName: 'Future 1', correct: 0, total: 0, accuracy: 0 }
        ];

    const displayTopics: WeakTopicExtended[] = topicsToDisplay.map((topic) => {
        const resource = grammarResources[topic.topicName];

        let relevantVideos: VideoResource[] = [];

        if (resource?.videos) {
            // Filter videos: Same level (i) or i+1
            // If userLevel is provided, use it. Otherwise default to showing all or a subset?
            // Prompt says: "make sure those video lessons are at the same or higher level i+1 level"
            // We interpret this as [userLevel, userLevel + 1]

            relevantVideos = resource.videos.filter(v => {
                // Keep videos that are >= userLevel AND <= userLevel + 1
                // Also be lenient if no videos match?
                return v.level >= userLevel && v.level <= userLevel + 1;
            });

            // Fallback: If no videos in range, maybe show the closest ones or just the first few?
            // Let's stick to the requirement strictness first. If empty, maybe show all >= userLevel?
            if (relevantVideos.length === 0) {
                // Try relaxing to just >= userLevel
                relevantVideos = resource.videos.filter(v => v.level >= userLevel).slice(0, 3);
            }
            if (relevantVideos.length === 0) {
                // If still empty, just take the first few
                relevantVideos = resource.videos.slice(0, 3);
            }
        }

        return {
            topicName: topic.topicName,
            studyReference: resource?.bookDetails || t('studyPlan.studyReferenceDefault', { topic: topic.topicName }),
            videos: relevantVideos
        };
    });


    // Helper to map numeric level to CEFR
    const getLevelLabel = (level: number): string => {
        if (level <= 1) return 'A1';
        if (level === 2) return 'A2';
        if (level === 3) return 'B1';
        if (level === 4) return 'B2';
        if (level === 5) return 'C1';
        if (level >= 6) return 'C2';
        return 'A1'; // Default
    };

    return (
        <main className="study-plan-main">
            {/* Title Section */}
            <div className="study-plan-hero">
                <h1 className="plan-headline">
                    {t('studyPlan.personalizedTitle')}
                </h1>
                <p className="plan-subtitle">
                    {t('studyPlan.subtitle')}
                </p>
            </div>

            {/* Recommendation Cards */}
            <div className="recommendation-cards">
                {/* Book Card */}
                <a
                    href="https://books.google.com.vn/books?id=cFGKilTxYNEC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="recommendation-card recommendation-card--book"
                >
                    <img
                        src={`${import.meta.env.BASE_URL}grammar-ielts-cover.jpg`}
                        alt="Grammar for IELTS Book Cover"
                        className="recommendation-card__image"
                    />
                    <div className="recommendation-card__overlay"></div>
                    <div className="recommendation-card__content">
                        <div className="recommendation-card__icon-badge">
                            <span className="material-symbols-outlined">menu_book</span>
                        </div>
                        <div>
                            <p className="recommendation-card__label">{t('studyPlan.ieltsLabel')}</p>
                            <h4 className="recommendation-card__title">{t('studyPlan.ieltsTitle')}</h4>
                        </div>
                    </div>
                </a>

                {/* eJOY Card */}
                <a
                    href="https://ejoy-english.com/epic/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="recommendation-card recommendation-card--ejoy"
                >
                    <img
                        src={`${import.meta.env.BASE_URL}epic-ejoy.svg`}
                        alt="eJOY Web Interface"
                        className="recommendation-card__image"
                    />
                    <div className="recommendation-card__overlay"></div>
                    <div className="recommendation-card__content">
                        <div className="recommendation-card__icon-badge">
                            <span className="material-symbols-outlined">smart_display</span>
                        </div>
                        <div>
                            <p className="recommendation-card__label">{t('studyPlan.ejoyLabel')}</p>
                            <h4 className="recommendation-card__title">{t('studyPlan.ejoyTitle')}</h4>
                        </div>
                    </div>
                </a>
            </div>

            {/* Section Header */}
            <h3 className="section-header">{t('studyPlan.weakTopics')}</h3>

            {/* Topic Cards */}
            <div className="topic-cards">
                {displayTopics.map((topic, index) => (
                    <div key={index} className="topic-card">
                        <div className="topic-card__header">
                            <h4 className="topic-card__name">{topic.topicName}</h4>
                        </div>

                        {/* Study Reference */}
                        <div className="topic-card__resource">
                            <div className="topic-card__icon-badge topic-card__icon-badge--book">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu_book</span>
                            </div>
                            <div className="topic-card__resource-content">
                                <span className="topic-card__resource-label">{t('studyPlan.studyReference')}</span>
                                <p className="topic-card__resource-title">{topic.studyReference}</p>
                            </div>
                        </div>

                        {/* Practice - List of Videos */}
                        <div className="topic-card__resource" style={{ alignItems: 'flex-start' }}>
                            <div className="topic-card__icon-badge topic-card__icon-badge--video">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_display</span>
                            </div>
                            <div className="topic-card__resource-content" style={{ width: '100%' }}>
                                <span className="topic-card__resource-label">{t('studyPlan.practiceOnEjoy')}</span>
                                {topic.videos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                        {topic.videos.map((video, vIndex) => (
                                            <div key={vIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="topic-card__resource-link"
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'left' }}
                                                >
                                                    <span style={{ textDecoration: 'inherit' }}>{video.title}</span>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                                                </a>
                                                <span
                                                    className="badge-level"
                                                    style={{
                                                        fontSize: '10px',
                                                        padding: '2px 8px',
                                                        borderRadius: '999px', /* Pill shape */
                                                        backgroundColor: '#dbeafe', /* Blue-100 */
                                                        color: '#1e40af', /* Blue-800 */
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {getLevelLabel(video.level)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#9aaebc' }}>
                                        No suitable videos found for your level.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};
