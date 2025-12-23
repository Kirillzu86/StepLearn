import { useState, type ChangeEvent, type FormEvent, type SVGProps, type FC } from "react";
import { API_URL } from "../../api/api";
import { useNavigate } from "react-router-dom";
import "./StyleLogPage.css";

type IconProps = SVGProps<SVGSVGElement>;

const Icons = {
    User: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
    ),
    Mail: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
    ),
    Lock: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
    ),
    // Открытый глаз
    Eye: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
        </svg>
    ),
    // ЗАКРЫТЫЙ ГЛАЗ (Веко с ресничками)
    EyeOff: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7s3-7 10-7a9.12 9.12 0 0 1 4.3 1.07"/>
            <path d="m5 15-2 2M9 19l-1.5 2.5M15 19l1.5 2.5M19 15l2 2"/>
        </svg>
    ),
    Check: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
        </svg>
    ),
    XCircle: (props: IconProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
        </svg>
    )
};

interface LogPageProps {
    theme: "dark" | "light";
    toggleTheme: () => void;
}

function LogPage({ theme, toggleTheme }: LogPageProps) {
    const [formData, setFormData] = useState({ login: '', password: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [errors, setErrors] = useState({ login: false, password: false });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isDarkTheme = theme === "dark";
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: false }));
        setMessage({ text: '', type: '' });
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { login, password } = formData;
        if (!login || !password) {
            setMessage({ text: 'Заполните все поля', type: 'error' });
            return;
        }
        try {
            const base = API_URL.replace(/\/$/, '');
            const res = await fetch(`${base}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Ошибка при входе");
            }

            const user = await res.json();
            window.localStorage.setItem("currentUser", JSON.stringify(user));
            // Перенаправляем на главную страницу после успешного входа
            navigate('/');
        } catch (err: any) {
            setMessage({ text: err.message || "Ошибка при входе", type: "error" });
        }
    };

    const renderInputField = (label: string, type: string, name: keyof typeof formData, Icon: FC<IconProps>, isPass = false, visible = false, toggle = () => {}) => {
        const hasError = errors[name];
        return (
            <div className="input-group">
                <label className="input-label" style={{ color: isDarkTheme ? (hasError ? '#f87171' : '#9ca3af') : (hasError ? '#dc2626' : '#57534e') }}>{label}</label>
                <div className="input-wrapper">
                    <input
                        type={isPass ? (visible ? 'text' : 'password') : type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        className="form-input"
                        data-error={hasError}
                        style={{
                            backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
                            color: isDarkTheme ? 'white' : '#111827',
                            borderColor: hasError ? '#ef4444' : (isDarkTheme ? '#4b5563' : '#d1d5db')
                        }}
                    />
                    <span className="input-icon left-icon" style={{ color: isDarkTheme ? '#6b7280' : '#4b5563' }}><Icon /></span>
                    {isPass && (
                        <button type="button" onClick={toggle} className="input-icon right-icon" style={{ color: isDarkTheme ? '#9ca3af' : '#4b5563' }}>
                            {visible ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="log-page-container" style={{ 
            backgroundColor: isDarkTheme ? '#030712' : '#f8fafc',
            backgroundImage: isDarkTheme ? 'radial-gradient(circle at 50% 0%, #3b82f640, #030712 35%)' : 'radial-gradient(circle at 50% 0%, #e2e8f040, #f8fafc 35%)',
            animation: 'pulse-spotlight 15s infinite ease-in-out'
        }}>
            <button onClick={toggleTheme} style={{ position: 'absolute', top: '2rem', width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: isDarkTheme ? '#eee' : '#111827' }} />

            <div className="form-card" style={{ 
                backgroundColor: isDarkTheme ? '#111827' : '#ffffff', 
                color: isDarkTheme ? 'white' : '#0f172a',
                borderColor: isDarkTheme ? '#1f2937' : '#e2e8f0'
            }}>
                <h1 className="brand-title">Вход</h1>
                <p className="form-subtitle">Войти в Аккаунт</p>

                {message.text && (
                    <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <span className="icon-msg">{message.type === 'success' ? <Icons.Check /> : <Icons.XCircle />}</span>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleFormSubmit}>
                    {renderInputField('Почта или имя пользователя', 'text', 'login', Icons.Mail)}
                    {renderInputField('Пароль', 'password', 'password', Icons.Lock, true, isPasswordVisible, () => setIsPasswordVisible(!isPasswordVisible))}
                    <button type="submit" className="submit-btn" style={{ backgroundColor: isDarkTheme ? 'white' : '#111827', color: isDarkTheme ? '#111827' : 'white' }}>Войти</button>
                </form>
            </div>
        </div>
    );
}

export default LogPage;