// =====================================================
// НАСТРОЙКА: ВАШ URL ОТ GOOGLE APPS SCRIPT
// =====================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbyVaE_qsD6ssct4egYpEojfsbJU9voiyRYMWnDw9W11Ap8U0pHkwWyGbhpQEIs1mOY-eQ/exec';

// Глобальные переменные
let teamsList = [];
let currentTeamId = null;
let currentTeamName = null;
let saveTimeout = null;
let currentActiveStage = null;

// Данные этапов
const stagesData = {
    prep: {
        name: 'Очистим шёрстку', icon: '🧹', bananas: 100,
        tasks: ['Сформировать команду из 3–4 человек', 'Выбрать тему проекта', 'Распределить роли в команде', 'Собрать не менее 15–20 записей', 'Очистить данные от дубликатов', 'Согласовать тему с учителем'],
        description: 'Сформируй команду, выбери тему и собери чистые данные.'
    },
    stage1: {
        name: 'Строим норку данных', icon: '🗄️', bananas: 150,
        tasks: ['Открыть MS Access, создать БД', 'Спроектировать структуру таблицы', 'Создать таблицу в конструкторе', 'Заполнить таблицу данными', 'Установить ключевое поле', 'Сохранить файл БД'],
        description: 'Создай таблицу базы данных.'
    },
    stage2: {
        name: 'Тасуем бананы', icon: '🔍', bananas: 200,
        tasks: ['Выполнить сортировку по одному полю', 'Выполнить многоуровневую сортировку', 'Создать запрос на выборку', 'Создать запрос с сортировкой', 'Создать форму для ввода данных', 'Создать отчёт'],
        description: 'Освой сортировку и запросы.'
    },
    final: {
        name: 'Енот-выпускник', icon: '🎓', bananas: 250,
        tasks: ['Оформить алгоритм (5–7 шагов)', 'Подготовить презентацию', 'Проверить БД на другом ПК', 'Подготовить речь защиты', 'Выступить перед классом', 'Ответить на вопросы', 'Сдать проект'],
        description: 'Оформи итоговые материалы и защити проект!'
    }
};

const stageOrder = ['prep', 'stage1', 'stage2', 'final'];
let teamProgress = {};

// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function showLoading(show, message = '🦝 Сохраняем прогресс...') {
    const btn = document.getElementById('completeStageBtn');
    if (btn && show) {
        btn.disabled = true;
        btn.textContent = message;
    } else if (btn && !show) {
        updateCompleteButtonState();
    }
}

// =====================================================
// ЗАГРУЗКА КОМАНД (ИСПРАВЛЕНО - links как строка)
// =====================================================
async function loadTeamsFromSheets() {
    const container = document.getElementById('teams-container');
    if (container) container.innerHTML = '<div class="loading">🦝 Загрузка команд...</div>';
    try {
        const response = await fetch(`${API_URL}?action=getTeams`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        console.log('getTeams ответ:', result);

        if (result.success && result.data) {
            teamsList = result.data.map((team, index) => {
                let links = team.links || '';

                if (typeof links === 'string' && links.startsWith('[') && links.includes('url')) {
                    try {
                        const parsed = JSON.parse(links);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
                            links = parsed[0].url;
                        } else {
                            links = '';
                        }
                    } catch(e) {
                        links = '';
                    }
                }

                return {
                    id: team.id || index + 1,
                    name: team.name || '',
                    members: team.members || '',
                    achievements: team.achievements || '',
                    password: team.password || '',
                    links: links,
                    status: team.status || 'active'
                };
            }).filter(team => team.name);

            console.log('Обработанные команды:', teamsList);
            renderTeams();
            updateTeamSelectDropdown();

            // Загружаем прогресс для всех команд (для таблицы лидеров)
            await loadAllTeamsProgress();

        } else {
            throw new Error(result.error || 'Ошибка загрузки');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        if (container) container.innerHTML = '<div class="loading" style="color: #c44;">❌ Не удалось загрузить команды.</div>';
    }
}

function renderTeams() {
    const container = document.getElementById('teams-container');
    if (!container) return;
    if (teamsList.length === 0) {
        container.innerHTML = '<div class="loading">🤝 Пока нет команд. Добавь команду!</div>';
        return;
    }
    container.innerHTML = '';
    teamsList.forEach(team => {
        const progress = teamProgress[team.id] || { completedStages: [], totalBananas: 0 };
        const card = document.createElement('div');
        card.className = `team-card-full ${currentTeamId == team.id ? 'selected' : ''}`;
        card.onclick = () => {
            openTeamSelectModal(team.id);
        };

        // Формируем HTML для ссылки (простая строка URL)
        let linkHtml = '';
        if (team.links && team.links.trim() && team.links !== '#') {
            linkHtml = `
                <div class="team-link" onclick="event.stopPropagation()">
                    🔗 <a href="${escapeHtml(team.links)}" target="_blank" rel="noopener noreferrer">Сайт проекта</a>
                </div>
            `;
        } else if (team.links === '#') {
            linkHtml = `<div class="team-link" style="color: #888;">🔗 Ссылка пока не добавлена</div>`;
        }

        card.innerHTML = `
            <div class="team-header">
                <h3>👥 ${escapeHtml(team.name)}</h3>
                <span class="team-bananas">🍌 ${progress.totalBananas || 0} бананов</span>
            </div>
            <div class="team-members">👤 Участники: ${escapeHtml(team.members || 'Не указаны')}</div>
            ${linkHtml}
            ${team.achievements ? `<div class="team-achievement">🏆 ${escapeHtml(team.achievements)}</div>` : ''}
            <div class="team-hint" style="font-size: 0.8rem; color: #888; margin-top: 8px;">🔐 Нажми для входа</div>
        `;
        container.appendChild(card);
    });
}

function updateTeamSelectDropdown() {
    const dropdown = document.getElementById('teamSelectDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">-- Выбери команду --</option>';
    teamsList.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = `${team.name}`;
        dropdown.appendChild(option);
    });
}

// =====================================================
// ЗАГРУЗКА ПРОГРЕССА
// =====================================================
async function loadProgressFromSheets(teamId) {
    try {
        const response = await fetch(`${API_URL}?action=getProgress&teamId=${teamId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.success && result.data) {
            const completedStages = result.data.completedStages || [];
            const totalBananas = result.data.totalBananas || 0;
            let stageTasks = result.data.stageTasks || {};

            for (const stageId of stageOrder) {
                if (!stageTasks[stageId]) {
                    stageTasks[stageId] = stagesData[stageId].tasks.map(() => false);
                }
            }

            teamProgress[teamId] = {
                completedStages: completedStages,
                totalBananas: totalBananas,
                stageTasks: stageTasks
            };
            return true;
        } else {
            const emptyTasks = {};
            for (const stageId of stageOrder) {
                emptyTasks[stageId] = stagesData[stageId].tasks.map(() => false);
            }
            teamProgress[teamId] = {
                completedStages: [],
                totalBananas: 0,
                stageTasks: emptyTasks
            };
            return true;
        }
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        const emptyTasks = {};
        for (const stageId of stageOrder) {
            emptyTasks[stageId] = stagesData[stageId].tasks.map(() => false);
        }
        teamProgress[teamId] = {
            completedStages: [],
            totalBananas: 0,
            stageTasks: emptyTasks
        };
        return false;
    }
}

// Загрузка прогресса для всех команд (для таблицы лидеров)
async function loadAllTeamsProgress() {
    for (const team of teamsList) {
        if (!teamProgress[team.id]) {
            await loadProgressFromSheets(team.id);
        }
    }
    updateLeaderboard();
}

// =====================================================
// СОХРАНЕНИЕ ПРОГРЕССА
// =====================================================
async function saveProgressToSheets(teamId, progressData) {
    try {
        const params = new URLSearchParams({
            action: 'saveProgress',
            teamId: teamId,
            completedStages: JSON.stringify(progressData.completedStages),
            totalBananas: progressData.totalBananas,
            stageTasks: JSON.stringify(progressData.stageTasks)
        });

        const url = `${API_URL}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

async function saveCurrentTeamProgress() {
    if (!currentTeamId) return false;
    if (!teamProgress[currentTeamId]) {
        console.error('Нет прогресса для команды', currentTeamId);
        return false;
    }
    const success = await saveProgressToSheets(currentTeamId, teamProgress[currentTeamId]);
    if (success) {
        updateLeaderboard();
        updateMapStatus();
    }
    return success;
}

// =====================================================
// ВЫБОР КОМАНДЫ (С ПРОВЕРКОЙ ПАРОЛЯ)
// =====================================================
async function selectTeamWithPassword(teamId, password) {
    const team = teamsList.find(t => t.id == teamId);
    if (!team) {
        alert('Команда не найдена!');
        return false;
    }

    if (team.password && team.password !== password) {
        alert('❌ Неверный пароль! Доступ к команде запрещён.');
        return false;
    }

    currentTeamId = teamId;
    currentTeamName = team.name;
    localStorage.setItem('lastSelectedTeamId', teamId);
    localStorage.setItem('lastSelectedTeamName', team.name);
    localStorage.setItem(`team_${teamId}_password`, password);

    await loadProgressFromSheets(teamId);

    renderTeams();
    updateLeaderboard();
    updateMapStatus();
    updateActiveStageDisplay();

    const greetingSpan = document.getElementById('raccoonGreeting');
    if (greetingSpan) {
        greetingSpan.innerHTML = `🦝 Команда "${escapeHtml(team.name)}" в деле!`;
    }

    switchPage('page-game');

    return true;
}

async function loadLastSelectedTeam() {
    const lastTeamId = localStorage.getItem('lastSelectedTeamId');
    const lastTeamName = localStorage.getItem('lastSelectedTeamName');
    const lastPassword = localStorage.getItem(`team_${lastTeamId}_password`);

    if (lastTeamId && lastTeamName && lastPassword) {
        const teamExists = teamsList.some(team => team.id == lastTeamId);
        if (teamExists) {
            await selectTeamWithPassword(lastTeamId, lastPassword);
        }
    }
}

// =====================================================
// ОТОБРАЖЕНИЕ КАРТЫ И АКТИВНОГО ЭТАПА
// =====================================================
function updateMapStatus() {
    if (!currentTeamId) return;
    const progress = teamProgress[currentTeamId] || { completedStages: [] };
    const completedSet = new Set(progress.completedStages);

    for (let i = 0; i < stageOrder.length; i++) {
        const stageId = stageOrder[i];
        const statusSpan = document.getElementById(`status${stageId.charAt(0).toUpperCase() + stageId.slice(1)}`);
        if (statusSpan) {
            if (completedSet.has(stageId)) {
                statusSpan.innerHTML = '✅ Пройден';
            } else if (i === 0 || completedSet.has(stageOrder[i - 1])) {
                statusSpan.innerHTML = '🔓 Доступен';
            } else {
                statusSpan.innerHTML = '🔒 Закрыт';
            }
        }
    }
}

function updateActiveStageDisplay() {
    if (!currentTeamId) return;

    const progress = teamProgress[currentTeamId];
    if (!progress) return;

    const completedSet = new Set(progress.completedStages);
    let activeStage = stageOrder.find(id => !completedSet.has(id)) || 'final';
    currentActiveStage = activeStage;

    const stage = stagesData[activeStage];
    if (!stage) return;

    document.getElementById('activeStageTitle').innerHTML = `${stage.icon} ${stage.name}`;
    document.getElementById('activeStageBananas').innerHTML = `🍌 +${stage.bananas} бананов`;
    document.getElementById('activeStageDesc').innerHTML = stage.description;

    const tasksContainer = document.getElementById('taskChecklist');
    const savedTasks = progress.stageTasks?.[activeStage] || stage.tasks.map(() => false);

    tasksContainer.innerHTML = '';
    stage.tasks.forEach((task, idx) => {
        const div = document.createElement('div');
        div.className = `checklist-item-game ${savedTasks[idx] ? 'completed' : ''}`;
        div.innerHTML = `<input type="checkbox" data-task-idx="${idx}" ${savedTasks[idx] ? 'checked' : ''}><label>${escapeHtml(task)}</label>`;
        tasksContainer.appendChild(div);
    });

    document.querySelectorAll('#taskChecklist input').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const idx = parseInt(e.target.dataset.taskIdx);
            if (!progress.stageTasks[activeStage]) {
                progress.stageTasks[activeStage] = stage.tasks.map(() => false);
            }
            progress.stageTasks[activeStage][idx] = e.target.checked;

            const parentDiv = e.target.closest('.checklist-item-game');
            if (parentDiv) {
                if (e.target.checked) {
                    parentDiv.classList.add('completed');
                } else {
                    parentDiv.classList.remove('completed');
                }
            }

            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
                await saveCurrentTeamProgress();
                updateCompleteButtonState();
            }, 500);
        });
    });

    updateCompleteButtonState();
}

function updateCompleteButtonState() {
    if (!currentTeamId || !currentActiveStage) return;

    const progress = teamProgress[currentTeamId];
    if (!progress) return;

    const stage = stagesData[currentActiveStage];
    if (!stage) return;

    const completedSet = new Set(progress.completedStages);
    const allCompleted = stage.tasks.every((_, i) => progress.stageTasks?.[currentActiveStage]?.[i]);
    const btn = document.getElementById('completeStageBtn');

    if (!btn) return;

    if (allCompleted && !completedSet.has(currentActiveStage)) {
        btn.disabled = false;
        btn.textContent = `✅ Завершить этап и получить ${stage.bananas} бананов!`;
        btn.style.background = '#4a6f5e';
    } else if (completedSet.has(currentActiveStage)) {
        btn.disabled = true;
        btn.textContent = `✅ Этап уже пройден`;
        btn.style.background = '#ccc';
    } else {
        const done = stage.tasks.filter((_, i) => progress.stageTasks?.[currentActiveStage]?.[i]).length;
        btn.disabled = true;
        btn.textContent = `📋 Выполни задания (${done}/${stage.tasks.length})`;
        btn.style.background = '#ccc';
    }
}

async function completeStage() {
    if (!currentTeamId) { alert('Сначала выбери команду!'); return; }
    const progress = teamProgress[currentTeamId];
    if (!progress) { alert('Ошибка загрузки прогресса!'); return; }

    const stageId = currentActiveStage;

    if (progress.completedStages.includes(stageId)) {
        alert('Этот этап уже пройден!');
        return;
    }

    const stage = stagesData[stageId];
    const allCompleted = stage.tasks.every((_, idx) => progress.stageTasks?.[stageId]?.[idx]);

    if (!allCompleted) {
        alert('Выполни все задания чек-листа!');
        return;
    }

    progress.completedStages.push(stageId);
    progress.totalBananas += stage.bananas;

    showLoading(true);
    const success = await saveCurrentTeamProgress();
    showLoading(false);

    if (success) {
        const msgDiv = document.getElementById('stageMessage');
        msgDiv.innerHTML = `🎉 Этап «${stage.name}» пройден! +${stage.bananas} 🍌 бананов!`;
        msgDiv.style.background = '#e8f5e9';
        setTimeout(() => { msgDiv.innerHTML = ''; msgDiv.style.background = ''; }, 4000);

        updateActiveStageDisplay();
        updateMapStatus();
        renderTeams();
        updateLeaderboard();
    } else {
        alert('Ошибка сохранения прогресса! Попробуй ещё раз.');
    }
}

function updateLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    // Используем teamsList для отображения всех команд
    const data = teamsList.map(team => {
        // Берем прогресс команды, если он загружен, иначе пустой
        const p = teamProgress[team.id] || { completedStages: [], totalBananas: 0 };
        let stage = 'Подготовительный';
        const count = p.completedStages?.length || 0;
        if (count === 1) stage = '1 этап';
        else if (count === 2) stage = '2 этап';
        else if (count >= 3) stage = 'Завершён';

        let badge = '🌱 Новичок';
        if (p.totalBananas >= 500) badge = '🏆 Гроссмейстер';
        else if (p.totalBananas >= 300) badge = '⭐ Мастер данных';
        else if (p.totalBananas >= 100) badge = '🍌 Банановый сборщик';

        return { ...team, bananas: p.totalBananas || 0, stage, badge };
    });

    data.sort((a, b) => b.bananas - a.bananas);
    tbody.innerHTML = '';
    data.forEach((team, idx) => {
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '';
        tbody.innerHTML += `<tr>
            <td>${medal}${idx + 1}</td>
            <td><strong>${escapeHtml(team.name)}</strong></td>
            <td>${escapeHtml(team.members || '-')}</td>
            <td>🍌 ${team.bananas}</td>
            <td>${team.stage}</td>
            <td>${team.badge}</td>
        </tr>`;
    });
}

// =====================================================
// ДОБАВЛЕНИЕ КОМАНДЫ (ИСПРАВЛЕНО - links как строка)
// =====================================================
async function addTeamToSheets(teamData) {
    try {
        const params = new URLSearchParams({
            action: 'addTeam',
            name: teamData.name,
            members: teamData.members,
            password: teamData.password || '',
            achievements: teamData.achievements || '',
            links: teamData.links || ''  // Простая строка, не JSON
        });

        const response = await fetch(`${API_URL}?${params.toString()}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка:', error);
        return { success: false, error: error.message };
    }
}

function openAddModal() {
    const name = prompt('Введите название команды:');
    if (!name) return;
    const members = prompt('Введите участников (через запятую):');
    if (!members) return;
    const password = prompt('Введите пароль для команды:');
    if (!password) {
        alert('Пароль обязателен!');
        return;
    }
    const siteUrl = prompt('Введите ссылку на сайт/портфолио команды (можно оставить пустым):');

    let links = siteUrl && siteUrl.trim() ? siteUrl.trim() : '';

    addTeamToSheets({ name, members, password, achievements: '', links }).then(result => {
        if (result.success) {
            alert('✅ Команда добавлена!');
            loadTeamsFromSheets();
        } else {
            alert('❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
        }
    });
}

function openTeamSelectModal(preSelectedTeamId = null) {
    updateTeamSelectDropdown();
    if (preSelectedTeamId) {
        const dropdown = document.getElementById('teamSelectDropdown');
        if (dropdown) dropdown.value = preSelectedTeamId;
    }
    document.getElementById('teamPassword').value = '';
    document.getElementById('teamSelectModal').style.display = 'flex';
}

async function confirmTeamSelect() {
    const dropdown = document.getElementById('teamSelectDropdown');
    const selectedId = dropdown.value;
    const password = document.getElementById('teamPassword').value;

    if (!selectedId) {
        alert('Выбери команду!');
        return;
    }
    if (!password) {
        alert('Введи пароль команды!');
        return;
    }

    const success = await selectTeamWithPassword(selectedId, password);

    if (success) {
        document.getElementById('teamSelectModal').style.display = 'none';
    }
}

function logoutFromTeam() {
    if (confirm('Точно выйти из команды? Прогресс сохранится.')) {
        currentTeamId = null;
        currentTeamName = null;
        localStorage.removeItem('lastSelectedTeamId');
        localStorage.removeItem('lastSelectedTeamName');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('team_')) {
                localStorage.removeItem(key);
            }
        }
        renderTeams();
        updateMapStatus();
        switchPage('page-teams');
        alert('Вы вышли из команды');
    }
}

// =====================================================
// НАВИГАЦИЯ
// =====================================================
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId.replace('page-', '')) {
            link.classList.add('active');
        }
    });

    if (pageId === 'page-teams') {
        loadTeamsFromSheets();
    }
    if (pageId === 'page-leaderboard') {
        updateLeaderboard();
    }
    if (pageId === 'page-game' && currentTeamId) {
        updateActiveStageDisplay();
        updateMapStatus();
    }
    if (pageId === 'page-game' && !currentTeamId) {
        alert('Сначала выбери команду!');
        switchPage('page-teams');
    }
}

// =====================================================
// ИНИЦИАЛИЗАЦИЯ
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            if (pageName) switchPage(`page-${pageName}`);
        });
    });

    document.getElementById('completeStageBtn')?.addEventListener('click', completeStage);
    document.getElementById('addTeamBtn')?.addEventListener('click', openAddModal);
    document.getElementById('refreshTeamsBtn')?.addEventListener('click', loadTeamsFromSheets);
    document.getElementById('selectTeamModeBtn')?.addEventListener('click', () => openTeamSelectModal());
    document.getElementById('confirmTeamSelectBtn')?.addEventListener('click', confirmTeamSelect);
    document.querySelector('.btn-start')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage('page-teams');
    });

    const modal = document.getElementById('teamSelectModal');
    const closeBtn = modal?.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal && modal) modal.style.display = 'none'; };

    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '🚪 Выйти из команды';
        logoutBtn.style.cssText = 'background: #c45f24; color: white; border: none; padding: 8px 16px; border-radius: 40px; cursor: pointer; margin-top: 12px; width: 100%; font-weight: 600;';
        logoutBtn.onclick = logoutFromTeam;
        sidebarFooter.appendChild(logoutBtn);
    }

    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const a = q.nextElementSibling;
            if (a) a.style.display = a.style.display === 'none' ? 'block' : 'none';
        });
    });
    document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'block');

    loadTeamsFromSheets();
    setTimeout(() => {
        loadLastSelectedTeam();
    }, 500);

    console.log('🎮 Игровой проект "Не грузи енота" запущен!');
});
