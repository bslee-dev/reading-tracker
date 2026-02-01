import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReadingGoal.css';

function ReadingGoal({ monthlyData, onGoalUpdated }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const [goal, setGoal] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const completedThisMonth = monthlyData.find(m => m.month === monthKey)?.count ?? 0;
  const targetCount = goal?.target_count ?? 0;
  const progress = targetCount > 0 ? Math.min(100, (completedThisMonth / targetCount) * 100) : 0;

  useEffect(() => {
    const fetchGoal = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/goals?year=${currentYear}&month=${currentMonth}`);
        setGoal(res.data);
        const t = res.data.target_count;
        setInputCount(t != null && t > 0 ? String(t) : '');
      } catch (err) {
        console.error('목표 조회 오류:', err);
        setInputCount('');
      } finally {
        setLoading(false);
      }
    };
    fetchGoal();
  }, [currentYear, currentMonth, onGoalUpdated]);

  const handleSave = async (e) => {
    e.preventDefault();
    const num = parseInt(inputCount, 10);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      await axios.put('/api/goals', { year: currentYear, month: currentMonth, target_count: num });
      setGoal({ year: currentYear, month: currentMonth, target_count: num });
      onGoalUpdated?.();
    } catch (err) {
      console.error('목표 저장 오류:', err);
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = `${currentYear}년 ${currentMonth}월`;

  if (loading) {
    return (
      <div className="reading-goal">
        <p>목표 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="reading-goal">
      <h3>이번 달 독서 목표</h3>
      <p className="goal-period">{monthLabel}</p>
      <div className="goal-progress-row">
        <div className="goal-progress-bar-wrap">
          <div className="goal-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="goal-count">
          {completedThisMonth} / {targetCount || '—'}권
        </span>
      </div>
      <form className="goal-form" onSubmit={handleSave}>
        <label htmlFor="goal-target">목표 권수</label>
        <div className="goal-input-row">
          <input
            id="goal-target"
            type="number"
            min="0"
            max="999"
            value={inputCount}
            onChange={(e) => setInputCount(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="예: 5"
          />
          <button type="submit" disabled={saving}>
            {saving ? '저장 중...' : '설정'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReadingGoal;
