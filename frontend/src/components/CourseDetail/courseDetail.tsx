import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../api/api";
import { useParams, Link } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/sidebar";
import "../HomePage/StyleHomePage.css"; // Используем общие стили макета
import "../Sidebar/StyleSidebar.css";
import "./StyleCourseDetail.css"; // Специфичные стили для этой страницы

// Интерфейсы данных (соответствуют ответу бэкенда)
interface Answer {
    id: number;
    text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    text: string;
    answers: Answer[];
}

interface CourseDetailData {
    id: number;
    title: string;
    description: string;
    price?: number;
    questions: Question[];
}

// Навигация (как в каталоге)
const navItems = [
    { title: 'Мой кабинет', icon: '👤', path: '/' },
    { title: 'Курсы', icon: '📚', path: '/catalog', special: true }
];

interface CourseDetailProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

function CourseDetail({ theme, toggleTheme }: CourseDetailProps) {
    const { id } = useParams<{ id: string }>(); // Получаем ID из URL
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isDarkTheme = theme === "dark";

    // Состояния для прохождения теста
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
    const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [lastResult, setLastResult] = useState<{ correct: number; total: number } | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const base = API_URL.replace(/\/$/, '');
                const response = await axios.get<CourseDetailData>(`${base}/api/v1/course/${id}`);
                const courseData = response.data;
                setCourse(courseData);
                // Если пользователь уже начинал этот курс — восстановим позицию из localStorage
                const userStr = localStorage.getItem("currentUser");
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        // Проверяем, записан ли пользователь на курс (через API)
                        axios.get(`${base}/api/v1/users/${user.id}/courses`)
                            .then(res => {
                                if (Array.isArray(res.data) && res.data.some((c: any) => c.id === courseData.id)) {
                                    setIsEnrolled(true);
                                }
                            })
                            .catch(() => {});

                        const progMap = user.enrolledProgress || {};
                        const saved = progMap[String(courseData.id)];
                        if (saved && typeof saved.currentIndex === 'number') {
                            // Если курс завершен, показываем результат
                            if (saved.currentIndex >= courseData.questions.length && typeof saved.correctAnswers === 'number') {
                                setLastResult({ correct: saved.correctAnswers, total: courseData.questions.length });
                            } else if (saved.currentIndex < courseData.questions.length) {
                                setActiveQuestionIndex(saved.currentIndex);
                            }
                            if (typeof saved.correctAnswers === 'number') {
                                setCorrectAnswersCount(saved.correctAnswers);
                            }
                        }
                    } catch (e) {
                        console.warn('Не удалось восстановить прогресс из localStorage', e);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Не удалось загрузить курс. Возможно, он не существует.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourse();
    }, [id]);

    // Обработчики теста
    const startLearning = async () => {
        if (course && course.questions.length > 0) {
            // Если пользователь авторизован, сохраняем информацию, что он начал этот курс
            const userStr = localStorage.getItem("currentUser");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const base = API_URL.replace(/\/$/, '');
                    await axios.post(`${base}/api/v1/enroll`, {
                        user_id: user.id,
                        course_id: course.id
                    });

                    // Обновим локально информацию о записях пользователя и прогрессе
                    try {
                        const resp = await axios.get(`${base}/api/v1/users/${user.id}/courses`);
                        const enrolledIds = Array.isArray(resp.data) ? resp.data.map((c: any) => c.id) : [];
                        const progMap = user.enrolledProgress || {};
                        progMap[String(course.id)] = { currentIndex: 0, progress_percentage: 0 };
                        const updatedUser = { ...user, enrolledCourseIds: enrolledIds, enrolledProgress: progMap };
                        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                        setIsEnrolled(true);
                    } catch (e2) {
                        // Если не можем вбить с бэкенда — всё равно сохраним локально
                        const progMap = (JSON.parse(userStr).enrolledProgress || {});
                        progMap[String(course.id)] = { currentIndex: 0, progress_percentage: 0 };
                        const updatedUser = { ...JSON.parse(userStr), enrolledProgress: progMap };
                        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                    }
                } catch (e) {
                    console.error("Не удалось записаться на курс:", e);
                }
            }

            setCorrectAnswersCount(0);
            setActiveQuestionIndex(0);
            setIsAnswerChecked(false);
            setSelectedAnswerId(null);
            setLastResult(null); // Сбрасываем предыдущий результат
        } else {
            alert("В этом курсе пока нет вопросов.");
        }
    };

    const handleStartClick = () => {
        if (!course) return;
        if (course.questions.length === 0) {
            alert("В этом курсе пока нет вопросов.");
            return;
        }
        // Если курс бесплатный, пользователь уже записан или уже проходил его — начинаем сразу
        if (isEnrolled || !course.price || course.price === 0 || lastResult) {
            startLearning();
        } else {
            // Иначе показываем окно оплаты
            setShowPayment(true);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentProcessing(true);
        // Имитация задержки обработки платежа
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPaymentProcessing(false);
        setShowPayment(false);
        startLearning();
    };

    const checkAnswer = () => {
        if (selectedAnswerId !== null) {
            setIsAnswerChecked(true);
            if (course && activeQuestionIndex !== null) {
                const question = course.questions[activeQuestionIndex];
                const answer = question.answers.find(a => a.id === selectedAnswerId);
                if (answer?.is_correct) {
                    setCorrectAnswersCount(prev => prev + 1);
                }
            }
        }
    };

    const nextQuestion = () => {
        if (course && activeQuestionIndex !== null) {
            const base = API_URL.replace(/\/$/, '');
            if (activeQuestionIndex < course.questions.length - 1) {
                const nextIndex = activeQuestionIndex + 1;
                setActiveQuestionIndex(nextIndex);
                // Сохраняем прогресс в localStorage и (опционально) на бэкенде
                const userStr = localStorage.getItem('currentUser');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        const progMap = user.enrolledProgress || {};
                        const percent = Math.round(((nextIndex) / course.questions.length) * 100);
                        progMap[String(course.id)] = { currentIndex: nextIndex, progress_percentage: percent, correctAnswers: correctAnswersCount };
                        const updatedUser = { ...user, enrolledProgress: progMap };
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                        // Попробуем уведомить бэкенд, если есть конечная точка прогресса
                        axios.post(`${base}/api/v1/users/${user.id}/courses/${course.id}/progress`, {
                            currentIndex: nextIndex,
                            progress_percentage: percent
                        }).catch(() => {});
                    } catch (e) {
                        console.warn('Не удалось сохранить прогресс в localStorage', e);
                    }
                }
                setIsAnswerChecked(false);
                setSelectedAnswerId(null);
            } else {
                const finalCorrect = correctAnswersCount;
                const totalQuestions = course.questions.length;
                setLastResult({ correct: finalCorrect, total: totalQuestions });

                // Отметим курс как завершённый (100%)
                const userStr = localStorage.getItem('currentUser');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        const progMap = user.enrolledProgress || {};
                        progMap[String(course.id)] = { currentIndex: course.questions.length, progress_percentage: 100, correctAnswers: correctAnswersCount };
                        const updatedUser = { ...user, enrolledProgress: progMap };
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        axios.post(`${base}/api/v1/users/${user.id}/courses/${course.id}/progress`, {
                            currentIndex: course.questions.length,
                            progress_percentage: 100
                        }).catch(() => {});
                    } catch (e) {
                        console.warn('Не удалось сохранить итоговый прогресс', e);
                    }
                }
                setActiveQuestionIndex(null); // Возврат к описанию
            }
        }
    };

    const backgroundStyle: React.CSSProperties = {
        minHeight: "100vh",
        backgroundColor: isDarkTheme ? "#030712" : "#f8fafc",
        backgroundImage: isDarkTheme
          ? "radial-gradient(circle at 50% 0%, #3b82f640, #030712 35%)"
          : "radial-gradient(circle at 50% 0%, #e2e8f040, #f8fafc 35%)",
    };

    if (loading) return <div style={backgroundStyle}><div className="loading-state">Загрузка курса...</div></div>;
    if (error || !course) return <div style={backgroundStyle}><div className="error-state">{error || "Курс не найден"}</div></div>;

    return (
        <div style={backgroundStyle}>
            <div className="app-main-view">
                <Header />
                <div className="app-layout">
                    <Sidebar />
                    {/* Основной контент */}
                    <div className="content-area">
                        <div className="content-header">
                            <Link to="/catalog" className="back-link">← Назад в каталог</Link>
                            <button className="theme-toggle-btn" onClick={toggleTheme} />
                        </div>

                        <div className="course-detail-container">
                            {activeQuestionIndex === null ? (
                                // --- РЕЖИМ ОПИСАНИЯ КУРСА ---
                                <>
                                    <div className="course-header-block">
                                        <h1 className="course-title-large">{course.title}</h1>
                                        <p className="course-description-large">{course.description}</p>
                                        {course.price !== undefined && (
                                            <p className="course-description-large" style={{ fontWeight: 'bold' }}>
                                                {course.price > 0 ? `Цена: ${course.price} ₽` : 'Бесплатно'}
                                            </p>
                                        )}
                                        
                                        {lastResult && (
                                            <div className="course-result-block">
                                                <h2 className="result-title">Ваш последний результат</h2>
                                                <div className="result-stats">
                                                    <p>✅ Правильных ответов: {lastResult.correct} из {lastResult.total}</p>
                                                    <p>❌ Неправильных ответов: {lastResult.total - lastResult.correct}</p>
                                                </div>
                                            </div>
                                        )}

                                        <button className="start-course-btn" onClick={handleStartClick}>
                                            {lastResult ? 'Пройти еще раз' : 'Начать обучение'}
                                        </button>
                                    </div>

                                    <div className="lessons-list-section">
                                        <h2>Программа курса ({course.questions.length} уроков)</h2>
                                        <div className="lessons-list">
                                            {course.questions.length === 0 ? (
                                                <p className="empty-lessons">В этом курсе пока нет уроков.</p>
                                            ) : (
                                                course.questions.map((q, index) => (
                                                    <div key={q.id} className="lesson-item">
                                                        <span className="lesson-number">{index + 1}</span>
                                                        <span className="lesson-text">{q.text}</span>
                                                        <span className="lesson-status">🔒</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // --- РЕЖИМ ПРОХОЖДЕНИЯ ТЕСТА ---
                                <div className="course-header-block">
                                    <div style={{ marginBottom: '20px', color: '#666' }}>
                                        Вопрос {activeQuestionIndex + 1} из {course.questions.length}
                                    </div>
                                    <h2 className="course-title-large" style={{ fontSize: '1.8rem' }}>
                                        {course.questions[activeQuestionIndex].text}
                                    </h2>
                                    
                                    <div className="lessons-list" style={{ marginTop: '20px' }}>
                                        {course.questions[activeQuestionIndex].answers.map((answer) => {
                                            // Логика подсветки ответов
                                            let itemStyle = {};
                                            if (isAnswerChecked) {
                                                if (answer.is_correct) itemStyle = { border: '2px solid #22c55e', background: '#f0fdf4' }; // Зеленый
                                                else if (selectedAnswerId === answer.id) itemStyle = { border: '2px solid #ef4444', background: '#fef2f2' }; // Красный
                                            } else if (selectedAnswerId === answer.id) {
                                                itemStyle = { border: '2px solid #3b82f6', background: '#eff6ff' }; // Синий (выбран)
                                            }

                                            return (
                                                <div 
                                                    key={answer.id} 
                                                    className="lesson-item" 
                                                    style={{ cursor: 'pointer', ...itemStyle }}
                                                    onClick={() => !isAnswerChecked && setSelectedAnswerId(answer.id)}
                                                >
                                                    <span className="lesson-text">{answer.text}</span>
                                                    {isAnswerChecked && answer.is_correct && <span>✅</span>}
                                                    {isAnswerChecked && !answer.is_correct && selectedAnswerId === answer.id && <span>❌</span>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginTop: '30px' }}>
                                        {!isAnswerChecked ? (
                                            <button className="start-course-btn" onClick={checkAnswer} disabled={selectedAnswerId === null}>Проверить</button>
                                        ) : (
                                            <button className="start-course-btn" onClick={nextQuestion}>Следующий вопрос →</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно оплаты */}
            {showPayment && course && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{marginTop: 0}}>Оплата курса</h2>
                        <p style={{marginBottom: '1rem', color: isDarkTheme ? '#9ca3af' : '#666'}}>
                            Вы покупаете курс <strong>«{course.title}»</strong>
                        </p>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>
                            {course.price} ₽
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="payment-form">
                            <input className="payment-input" placeholder="Номер карты (0000 0000 0000 0000)" required pattern="\d*" minLength={16} />
                            <div className="payment-row">
                                <input className="payment-input" placeholder="MM/YY" required style={{width: '50%'}} />
                                <input className="payment-input" placeholder="CVC" required maxLength={3} style={{width: '50%'}} />
                            </div>
                            <button type="submit" className="pay-confirm-btn" disabled={paymentProcessing}>
                                {paymentProcessing ? 'Обработка...' : `Оплатить ${course.price} ₽`}
                            </button>
                            <button type="button" className="pay-cancel-btn" onClick={() => setShowPayment(false)}>Отмена</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CourseDetail;