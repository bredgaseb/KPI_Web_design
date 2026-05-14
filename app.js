// --- MODEL ---
class TimerModel {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('timeTrackerSessions')) || [];
        this.intervalId = null;
        this.seconds = 0;
        this.startTime = null;
        this.isRunning = false;
    }

    start(onTick) {
        if (this.isRunning) return;
        this.isRunning = true;
        if (!this.startTime) this.startTime = new Date();
        
        this.intervalId = setInterval(() => {
            this.seconds++;
            onTick(this.seconds);
        }, 1000);
        return this.startTime;
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.intervalId);
    }

    stop(taskName) {
        if (!this.startTime && this.seconds === 0) return null; // Не зберігати порожній таймер
        
        this.pause();
        const endTime = new Date();
        const session = {
            id: Date.now(),
            name: taskName || 'Завдання без назви',
            start: this.startTime,
            end: endTime,
            duration: this.seconds
        };
        
        this.sessions.push(session);
        localStorage.setItem('timeTrackerSessions', JSON.stringify(this.sessions));
        
        // Скидання стану
        this.seconds = 0;
        this.startTime = null;
        
        return endTime;
    }

    getSessions() {
        return this.sessions;
    }
}

// --- VIEW ---
class TimerView {
    constructor() {
        this.taskInput = document.getElementById('taskName');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startTimeDisplay = document.getElementById('startTimeDisplay');
        this.endTimeDisplay = document.getElementById('endTimeDisplay');
        
        this.btnStart = document.getElementById('btnStart');
        this.btnPause = document.getElementById('btnPause');
        this.btnStop = document.getElementById('btnStop');
        this.sessionsList = document.getElementById('sessionsList');
    }

    formatTime(totalSeconds) {
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }

    formatClock(dateObj) {
        if (!dateObj) return '--:--';
        const d = new Date(dateObj);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    updateTimer(seconds) {
        this.timerDisplay.textContent = this.formatTime(seconds);
    }

    updateStartTime(time) {
        this.startTimeDisplay.textContent = this.formatClock(time);
        this.endTimeDisplay.textContent = '--:--'; // Очищуємо час завершення при новому запуску
    }

    updateEndTime(time) {
        this.endTimeDisplay.textContent = this.formatClock(time);
    }

    resetInputs() {
        this.taskInput.value = '';
        this.updateTimer(0);
    }

    renderSessions(sessions) {
        this.sessionsList.innerHTML = '';
        sessions.forEach(session => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
            tr.innerHTML = `
                <td class="py-3 px-4 text-slate-800 font-medium">${session.name}</td>
                <td class="py-3 px-4 text-slate-600">${this.formatClock(session.start)}</td>
                <td class="py-3 px-4 text-slate-600">${this.formatClock(session.end)}</td>
                <td class="py-3 px-4 text-slate-600">${this.formatTime(session.duration)}</td>
            `;
            this.sessionsList.appendChild(tr);
        });
    }

    bindStart(handler) {
        this.btnStart.addEventListener('click', handler);
    }

    bindPause(handler) {
        this.btnPause.addEventListener('click', handler);
    }

    bindStop(handler) {
        this.btnStop.addEventListener('click', () => {
            handler(this.taskInput.value);
        });
    }
}

// --- CONTROLLER ---
class TimerController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Початкове відмальовування збережених сеансів
        this.view.renderSessions(this.model.getSessions());

        // Прив'язка подій
        this.view.bindStart(this.handleStart.bind(this));
        this.view.bindPause(this.handlePause.bind(this));
        this.view.bindStop(this.handleStop.bind(this));
    }

    handleStart() {
        const startTime = this.model.start((seconds) => {
            this.view.updateTimer(seconds);
        });
        if (startTime) {
            this.view.updateStartTime(startTime);
        }
    }

    handlePause() {
        this.model.pause();
    }

    handleStop(taskName) {
        const endTime = this.model.stop(taskName);
        if (endTime) {
            this.view.updateEndTime(endTime);
            this.view.resetInputs();
            this.view.renderSessions(this.model.getSessions());
        }
    }
}

// Ініціалізація додатку при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    const app = new TimerController(new TimerModel(), new TimerView());
});