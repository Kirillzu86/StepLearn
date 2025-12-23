import { useState, type ChangeEvent, type FormEvent, type SVGProps, type FC } from "react";
import "./StyleRegPage.css";

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

interface RegPageProps {
    theme: "dark" | "light";
    toggleTheme: () => void;
}

import { API_URL } from "../../api/api";

function RegPage({ theme, toggleTheme }: RegPageProps) {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [errors, setErrors] = useState({ username: false, email: false, password: false, confirmPassword: false });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const isDarkTheme = theme === "dark";

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: false }));
        setMessage({ text: '', type: '' });
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { username, email, password, confirmPassword } = formData;
        if (!username || !email || !password || !confirmPassword) {
            setMessage({ text: 'Заполните все поля', type: 'error' });
            return;
        }
        if (password.length < 6) {
            setMessage({ text: 'Пароль должен быть не менее 6 символов', type: 'error' });
            return;
        }
        if (password !== confirmPassword) {
            setMessage({ text: 'Пароли не совпадают', type: 'error' });
            return;
        }
        try {
            const base = API_URL ? API_URL.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
            const res = await fetch(`${base}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            if (!res.ok) {
                // Try to parse JSON error body, otherwise fall back to text for debugging
                let data: any = {};
                try {
                    data = await res.json();
                } catch (e) {
                    data.detail = await res.text().catch(() => `HTTP ${res.status}`);
                }
                console.error('Registration failed', res.status, data);
                throw new Error(data.detail || "Не удалось создать аккаунт");
            }

            const user = await res.json();
            // сохраняем текущего пользователя в localStorage
            window.localStorage.setItem("currentUser", JSON.stringify(user));
            setMessage({ text: `Аккаунт успешно создан для ${user.username}!`, type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Ошибка при регистрации', type: 'error' });
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
                <h1 className="brand-title">Регистрация</h1>
                <p className="form-subtitle">Создать новый аккаунт</p>

                {message.text && (
                    <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <span className="icon-msg">{message.type === 'success' ? <Icons.Check /> : <Icons.XCircle />}</span>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleFormSubmit}>
                    {renderInputField('Имя пользователя', 'text', 'username', Icons.User)}
                    {renderInputField('Email', 'email', 'email', Icons.Mail)}
                    {renderInputField('Пароль', 'password', 'password', Icons.Lock, true, isPasswordVisible, () => setIsPasswordVisible(!isPasswordVisible))}
                    {renderInputField('Повтор пароля', 'password', 'confirmPassword', Icons.Lock, true, isConfirmPasswordVisible, () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible))}
                    <button type="submit" className="submit-btn" style={{ backgroundColor: isDarkTheme ? 'white' : '#111827', color: isDarkTheme ? '#111827' : 'white' }}>Зарегистрироваться</button>
                </form>
            </div>
        </div>
    );
}

export default RegPage;