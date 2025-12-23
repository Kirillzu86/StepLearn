// frontend/src/components/Header/Header.tsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './StyleHeader.css';

const Header: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Вешаем клавиатурное сокращение Shift+S для прокрутки вниз
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Обновляем `currentUser` при смене маршрута (вход/выход делает navigate)
    useEffect(() => {
        const raw = localStorage.getItem('currentUser');
        try {
            setCurrentUser(raw ? JSON.parse(raw) : null);
        } catch (e) {
            setCurrentUser(null);
        }
    }, [location]);

    // Слушаем события storage для обновления в других вкладках
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'currentUser') {
                try {
                    setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
                } catch {
                    setCurrentUser(null);
                }
            }
        };
        window.addEventListener('storage', onStorage);
        // Слушаем кастомное событие для обновления в той же вкладке
        const onCurrentUserChanged = (ev: Event) => {
            try {
                const ce = ev as CustomEvent;
                if (ce && ce.detail) {
                    setCurrentUser(ce.detail);
                    return;
                }
            } catch {}
            // fallback: прочитаем из localStorage
            const raw = localStorage.getItem('currentUser');
            try {
                setCurrentUser(raw ? JSON.parse(raw) : null);
            } catch {
                setCurrentUser(null);
            }
        };
        window.addEventListener('currentUserChanged', onCurrentUserChanged as EventListener);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('currentUserChanged', onCurrentUserChanged as EventListener);
        };
    }, []);

    const path = location.pathname || '/';

    const isActive = (p: string) => {
        if (p === '/') return path === '/';
        return path.startsWith(p);
    };

    return (
        <header className="main-header-area">
            
            {/* Навигация (имитация верхнего меню Stepik) */}
            <nav className="header-nav">
                <span className="nav-logo">StepLearn</span>
                <Link to="/catalog" className={`nav-link ${isActive('/catalog') ? 'nav-link-active' : ''}`}>Каталог</Link>
                <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>Моё обучение</Link>
                <Link to="/create-course" className={`nav-link ${isActive('/create-course') ? 'nav-link-active' : ''}`}>Преподавание</Link>
            </nav>

            {/* Поисковая строка и Аватар */}
            <div className="header-controls">
                

                {/* 4. Аватарка пользователя */}
                <div className="user-avatar-container">
                    <button
                        className="user-avatar-button"
                        onClick={() => navigate('/profile')}
                        aria-label="Открыть профиль"
                        title="Профиль"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                        {currentUser && currentUser.avatar_url ? (
                            <img src={currentUser.avatar_url} alt="avatar" className="user-avatar-image" />
                        ) : (
                            <span className="user-avatar">
                                {(() => {
                                    if (!currentUser) return 'H';
                                    const name = (currentUser.username || currentUser.name || currentUser.email || '') + '';
                                    return name.trim() ? name.trim()[0].toUpperCase() : 'H';
                                })()}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );

};

export default Header;