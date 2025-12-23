import os
import time
import psycopg2
from contextlib import contextmanager

# Получаем данные для подключения к БД из переменных окружения
DB_NAME = os.getenv("POSTGRES_DB", "Stepik")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "1234")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost") # 'db' - это имя сервиса PostgreSQL в Docker Compose
DB_PORT = os.getenv("POSTGRES_PORT", "5432")

def get_connection():
    """Устанавливает и возвращает соединение с базой данных PostgreSQL."""
    # Попытки подключения с экспоненциальной/фиксированной паузой.
    retries = int(os.getenv("DB_CONN_RETRIES", "10"))
    wait_seconds = float(os.getenv("DB_CONN_WAIT", "1"))

    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            return psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT,
            )
        except psycopg2.OperationalError as e:
            last_exc = e
            if attempt == retries:
                # Все попытки исчерпаны — пробрасываем исключение
                raise
            # Ждем перед следующей попыткой
            time.sleep(wait_seconds)
    # На всякий случай пробрасываем последнее исключение
    if last_exc:
        raise last_exc

@contextmanager
def get_cursor():
    """Контекстный менеджер для получения курсора базы данных."""
    conn = get_connection()
    try:
        yield conn.cursor()
    finally:
        conn.close()