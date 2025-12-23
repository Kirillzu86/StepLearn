import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiUser,
    FiBookOpen,
    FiEdit3,
    FiTrendingUp,
    FiBell,
    FiHelpCircle,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import './StyleSidebar.css'; 

// Данные для навигации
type NavItem = { title: string; icon: IconType; path: string; special?: boolean };
const navItems: NavItem[] = [
    { title: 'Моё обучение', icon: FiUser, path: '/', special: true },
    { title: 'Каталог', icon: FiBookOpen, path: '/catalog' },
    { title: 'Преподавание', icon: FiEdit3, path: '/create-course' },
];

const Sidebar: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();

    const readUser = () => {
        try {
            const s = localStorage.getItem('currentUser');
            setUser(s ? JSON.parse(s) : null);
        } catch (e) {
            setUser(null);
        }
    };

    useEffect(() => {
        readUser();

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'currentUser') readUser();
        };

        // custom same-tab event used elsewhere in the app
        const onCustom = () => readUser();

        window.addEventListener('storage', onStorage);
        window.addEventListener('currentUserChanged', onCustom as EventListener);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('currentUserChanged', onCustom as EventListener);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setUser(null);
        // notify same-tab listeners
        try { window.dispatchEvent(new CustomEvent('currentUserChanged')); } catch (e) {}
        navigate('/');
    };

    const location = window.location.pathname;
    const isActive = (p: string) => {
        if (p === '/') return location === '/';
        return location.startsWith(p);
    };

    return (
        <nav className="sidebar-container">
            {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                    <Link to={item.path} key={index} className={`nav-item ${item.special ? 'nav-item-special' : ''} ${isActive(item.path) ? 'nav-item-active' : ''}`}>
                        <span className="nav-icon"><Icon className="nav-icon-svg" /></span>
                        {item.title}
                    </Link>
                );
            })}

            <div className="nav-separator"></div>

            

            <div className="sidebar-auth-links">
                {user ? (
                    <>
                        <span className="auth-link-user"><FiUser className="auth-user-icon" /> {user.username || user.name || 'Пользователь'}</span>
                        <button className="auth-link-button" onClick={handleLogout}>Выход</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="auth-link">Вход</Link>
                        <Link to="/register" className="auth-link">Регистрация</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Sidebar;