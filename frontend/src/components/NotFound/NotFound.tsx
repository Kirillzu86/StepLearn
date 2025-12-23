import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    // Используем инлайн-стили для быстрого решения, чтобы не вводить новый CSS-файл
    const styles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        color: '#333'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '4em',
        marginBottom: '10px',
        color: '#000'
    };

    const messageStyle: React.CSSProperties = {
        fontSize: '1.5em',
        marginBottom: '30px'
    };

    const linkStyle: React.CSSProperties = {
        color: '#333',
        textDecoration: 'underline',
        fontWeight: 'bold'
    };

    return (
        <div style={styles}>
            <h1 style={titleStyle}>404</h1>
            <p style={messageStyle}>Страница не найдена</p>
            <p>
                Кажется, вы заблудились. Вернитесь на {' '}
                <Link to="/" style={linkStyle}>
                    главную страницу
                </Link>
                .
            </p>
        </div>
    );
};

export default NotFound;