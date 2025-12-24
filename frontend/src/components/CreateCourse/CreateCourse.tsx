import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../api/api";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/sidebar";
import "../HomePage/StyleHomePage.css";
import "../Sidebar/StyleSidebar.css";

interface CreateCourseProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

function CreateCourse({ theme, toggleTheme }: CreateCourseProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalLessons, setTotalLessons] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [priceStatus, setPriceStatus] = useState("Free");
  const [questions, setQuestions] = useState<Array<{ text: string; answers: Array<{ text: string; is_correct: boolean }> }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Название курса обязательно");
      return;
    }
    // Валидация вопросов
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        setError(`Текст вопроса ${i + 1} обязателен`);
        return;
      }
      if (!q.answers || q.answers.length === 0) {
        setError(`Вопрос ${i + 1} должен содержать хотя бы один ответ`);
        return;
      }
      const hasCorrect = q.answers.some(a => a.is_correct);
      if (!hasCorrect) {
        setError(`У вопроса ${i + 1} должен быть отмечен правильный ответ`);
        return;
      }
    }
    setLoading(true);
    try {
      const userStr = localStorage.getItem("currentUser");
      const user = userStr ? JSON.parse(userStr) : null;

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        total_lessons: totalLessons || questions.length || 0,
        price: price,
        price_status: priceStatus,
        questions: questions.map(q => ({
          text: q.text,
          answers: q.answers.map(a => ({ text: a.text, is_correct: !!a.is_correct }))
        }))
      };

      // Если авторизован — укажем автора (если API поддерживает)
      if (user && user.id) payload.author_id = user.id;

      const base = API_URL.replace(/\/$/, '');
      const resp = await axios.post(`${base}/api/v1/courses`, payload);
      const created = resp.data;

      // Перейти на страницу курса или каталог
      if (created && created.id) {
        navigate(`/course/${created.id}`);
      } else {
        navigate("/catalog");
      }
    } catch (err: any) {
      console.error("Не удалось создать курс:", err);
      // Универсальная обработка ошибок от бэкенда
      const resp = err?.response?.data;
      if (resp) {
        if (typeof resp.detail === 'string') setError(resp.detail);
        else if (Array.isArray(resp.detail)) setError(resp.detail.map((d: any) => (d.msg || JSON.stringify(d))).join('; '));
        else setError(JSON.stringify(resp));
      } else {
        setError(err.message || "Ошибка при создании курса");
      }
    } finally {
      setLoading(false);
    }
  };

  // Управление вопросами/ответами
  const addQuestion = () => setQuestions(prev => [...prev, { text: '', answers: [{ text: '', is_correct: false }] }]);
  const removeQuestion = (index: number) => setQuestions(prev => prev.filter((_, i) => i !== index));
  const updateQuestionText = (index: number, text: string) => setQuestions(prev => prev.map((q, i) => i === index ? { ...q, text } : q));
  const addAnswer = (qIndex: number) => setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, answers: [...q.answers, { text: '', is_correct: false }] } : q));
  const removeAnswer = (qIndex: number, aIndex: number) => setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, answers: q.answers.filter((_, ai) => ai !== aIndex) } : q));
  const updateAnswerText = (qIndex: number, aIndex: number, text: string) => setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, answers: q.answers.map((a, ai) => ai === aIndex ? { ...a, text } : a) } : q));
  // Отметить правильный ответ (радио — только один правильный на вопрос)
  const markCorrect = (qIndex: number, aIndex: number) => setQuestions(prev => prev.map((q, i) => {
    if (i !== qIndex) return q;
    return { ...q, answers: q.answers.map((a, ai) => ({ ...a, is_correct: ai === aIndex })) };
  }));

  const backgroundStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: theme === "dark" ? "#030712" : "#f8fafc",
    backgroundImage: theme === "dark"
      ? "radial-gradient(circle at 50% 0%, #3b82f640, #030712 35%)"
      : "radial-gradient(circle at 50% 0%, #e2e8f040, #f8fafc 35%)",
  };

  return (
    <div style={backgroundStyle}>
      <div className="app-main-view">
        <Header />
        <div className="app-layout">
          <Sidebar />
          <div className="content-area">
            <div className="content-header">
              <h1 className="main-title">Создать курс</h1>
              <button className="theme-toggle-btn" onClick={toggleTheme} />
            </div>

            <div style={{ padding: 20 }}>
                {error && <div className="error-state">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
                <form onSubmit={handleSubmit} className="course-create-form">
                <div className="input-group">
                  <label>Название</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" />
                </div>

                <div className="input-group">
                  <label>Описание</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input" rows={6} />
                </div>

                <div className="input-group">
                  <label>Цена (руб.)</label>
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="form-input" />
                </div>

                <div className="input-group">
                  <label>Всего уроков</label>
                  <input type="number" value={totalLessons} onChange={e => setTotalLessons(Number(e.target.value))} className="form-input" />
                </div>

                <div className="input-group">
                  <label>Статус цены</label>
                  <select value={priceStatus} onChange={e => setPriceStatus(e.target.value)} className="form-input">
                    <option>Free</option>
                    <option>Paid</option>
                    <option>Enrolled</option>
                  </select>
                </div>

                <div style={{ marginTop: 20 }}>
                  <h3>Вопросы</h3>
                  <button type="button" className="start-course-btn" onClick={addQuestion} style={{ marginBottom: 10 }}>Добавить вопрос</button>
                  {questions.length === 0 && <div className="welcome-banner">Вопросы не добавлены. Вы можете добавить их, нажав кнопку.</div>}
                  {questions.map((q, qi) => (
                    <div key={qi} style={{ border: '1px solid #e5e7eb', padding: 12, marginBottom: 12, borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Вопрос {qi + 1}</strong>
                        <div>
                          <button type="button" className="auth-link-button" onClick={() => removeQuestion(qi)} style={{ marginLeft: 8 }}>Удалить вопрос</button>
                        </div>
                      </div>
                      <div className="input-group" style={{ marginTop: 8 }}>
                        <label>Текст вопроса</label>
                        <textarea value={q.text} onChange={e => updateQuestionText(qi, e.target.value)} className="form-input" rows={2} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong>Ответы</strong>
                        <div style={{ marginTop: 8 }}>
                          {q.answers.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                              <input type="radio" name={`correct-${qi}`} checked={!!a.is_correct} onChange={() => markCorrect(qi, ai)} />
                              <input value={a.text} onChange={e => updateAnswerText(qi, ai, e.target.value)} placeholder={`Ответ ${ai + 1}`} className="form-input" />
                              <button type="button" className="auth-link-button" onClick={() => removeAnswer(qi, ai)}>Удалить</button>
                            </div>
                          ))}
                          <div>
                            <button type="button" className="start-course-btn" onClick={() => addAnswer(qi)}>Добавить ответ</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="submit" className="start-course-btn" disabled={loading}>
                  {loading ? "Сохранение..." : "Создать курс"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCourse;
