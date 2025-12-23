import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchCourses, API_URL } from "../../api/api";
import { Link, useLocation } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/sidebar";
import "../HomePage/StyleHomePage.css";
import "../Sidebar/StyleSidebar.css";

interface Course {
  id: number;
  title: string;
  description: string;
  rating?: number;
  students_count?: number;
  price_status?: string;
  total_lessons?: number;
  completed_lessons?: number;
  progress_percentage?: number;
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link to={`/course/${course.id}`} className="course-card">
      <h3 className="card-title">{course.title}</h3>
      <p className="card-description">{course.description}</p>
      <div className="card-meta">
        <span>⭐ {Number(course.rating || 0).toFixed(1)}</span>
        <span>👤 {(course.students_count || 0).toLocaleString()}</span>
        <span className={`price-status ${String((course.price_status || "")).toLowerCase()}`}>{course.price_status}</span>
      </div>
      {typeof course.progress_percentage === "number" && (
        <>
          <div className="card-progress">
            <div style={{ width: `${course.progress_percentage}%` }} className="progress-bar" />
          </div>
          <div className="progress-text">{course.progress_percentage.toFixed(0)}% пройдено</div>
        </>
      )}
    </Link>
  );
}

// Sidebar provides navigation

export default function Catalog({ theme, toggleTheme }: { theme: "dark" | "light"; toggleTheme: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [myCourseIds, setMyCourseIds] = useState<Set<number>>(new Set());

  const isDark = theme === "dark";
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const ts = Date.now();
        const base = API_URL.replace(/\/$/, "");
        const all = await fetchCourses(undefined, ts).catch(() => axios.get(`${base}/api/v1/courses?_t=${ts}`, { timeout: 8000 }).then(r => r.data));

        const userRaw = localStorage.getItem("currentUser");
        const user = userRaw ? JSON.parse(userRaw) : null;
        let myIds = new Set<number>();
        if (user && user.id) {
          const resp = await axios.get(`${base}/api/v1/users/${user.id}/courses?_t=${ts}`, { timeout: 8000 }).catch(() => ({ data: [] }));
          myIds = new Set((resp.data || []).map((c: any) => c.id));
        }

        setMyCourseIds(myIds);
        const withStatus = (all as Course[]).map(c => ({ ...c, price_status: myIds.has(c.id) ? "Enrolled" : c.price_status }));
        setCourses(withStatus);
        setDisplayedCourses(withStatus);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location]);

  useEffect(() => { const t = setTimeout(() => setDebouncedTerm(searchTerm), 300); return () => clearTimeout(t); }, [searchTerm]);

  useEffect(() => {
    if (debouncedTerm == null) return;
    const doSearch = async () => {
      const term = debouncedTerm.trim();
      if (!term) { setDisplayedCourses(courses); setSearchLoading(false); return; }

      const client = courses.filter(c => (c.title + " " + (c.description || "")).toLowerCase().includes(term.toLowerCase()) || String(c.id).includes(term));
      setDisplayedCourses(client);
      setSearchLoading(true);

      try {
        const ts = Date.now();
        const base = API_URL.replace(/\/$/, "");
        const server = await fetchCourses(term, ts).catch(() => axios.get(`${base}/api/v1/courses?q=${encodeURIComponent(term)}&_t=${ts}`, { timeout: 8000 }).then(r => r.data));
        const seen = new Set<number>();
        const unique: Course[] = [];
        for (const it of (server as Course[])) {
          if (!seen.has(it.id)) { seen.add(it.id); unique.push(it); }
        }
        setDisplayedCourses(unique);
      } catch (e) {
        console.warn('Server search failed, using client results', e);
      } finally {
        setSearchLoading(false);
      }
    };
    doSearch();
  }, [debouncedTerm, courses]);

  const bg: React.CSSProperties = { minHeight: '100vh', backgroundColor: isDark ? '#030712' : '#f8fafc' };

  return (
    <div style={bg}>
      <div className="app-main-view">
        <Header />
        <div className="app-layout">
          <Sidebar />
          <div className="content-area">
            <div className="content-header">
              <h1 className="main-title">Каталог курсов</h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Поиск курсов по названию или описанию" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
                <button className="theme-toggle-btn" onClick={toggleTheme} />
              </div>
            </div>

            {loading && <div className="loading-state">Загрузка каталога...</div>}
            {error && <div className="error-state">{error}</div>}

            {!loading && !error && (
              <>
                {searchLoading && <div className="loading-state">Поиск...</div>}
                <div className="course-list">{displayedCourses.map(c => <CourseCard key={c.id} course={c} />)}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
