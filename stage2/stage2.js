// ОЧИСТКА СТАРЫХ СОХРАНЕНИЙ
localStorage.removeItem('stage2_completed');
localStorage.removeItem('stage2_bananas');

// ДАННЫЕ
const totalBananas = 500;
let currentBananas = 0;
let completedTasks = { 1: false, 2: false, 3: false, 4: false, 5: false };
let currentTask = 1;
let hintUsed = false;

const sourceData = [
    { id: 1, sort: 'Кавендиш', color: 'Жёлтый', ripeness: 85, weight: 150, date: '15.05.2024' },
    { id: 2, sort: 'Кавендиш', color: 'Зелёный', ripeness: 30, weight: 140, date: '10.05.2024' },
    { id: 3, sort: 'Малыш', color: 'Жёлтый', ripeness: 90, weight: 80, date: '20.05.2024' },
    { id: 4, sort: 'Кавендиш', color: 'Жёлтый', ripeness: 95, weight: 160, date: '18.05.2024' },
    { id: 5, sort: 'Малыш', color: 'Зелёный', ripeness: 25, weight: 75, date: '12.05.2024' },
    { id: 6, sort: 'Кавендиш', color: 'Коричневый', ripeness: 100, weight: 155, date: '22.05.2024' },
    { id: 7, sort: 'Малыш', color: 'Жёлтый', ripeness: 70, weight: 85, date: '17.05.2024' },
    { id: 8, sort: 'Кавендиш', color: 'Жёлтый', ripeness: 80, weight: 145, date: '14.05.2024' }
];

const fields = [
    { name: 'ID', field: 'id' },
    { name: 'Сорт', field: 'sort' },
    { name: 'Цвет', field: 'color' },
    { name: 'Спелость (%)', field: 'ripeness' },
    { name: 'Вес (г)', field: 'weight' },
    { name: 'Собрано', field: 'date' }
];

const hints = {
    1: '💡 Выбери поле "Спелость (%)" и сортировку "по убыванию" (▼).',
    2: '💡 Сначала "Сорт" по возрастанию (▲), затем "Спелость" по убыванию (▼).',
    3: '💡 Для "Цвет" условие "Жёлтый", для "Спелость" условие ">80".',
    4: '💡 Сгруппируй по "Сорт", для количества выбери Count.',
    5: '💡 Создай поле: Вес_кг: [Вес]/1000, сгруппируй по "Сорт", выбери Sum.'
};

let chart = null;
let toastTimeout = null;

// DOM элементы
let bananaScoreSpan, completedCountSpan, progressBar, raccoonSpeech;
let sourceTableBody, queryRows, resultHeader, resultBody, queryMessage, toast;

// =====================================================
// ИСПРАВЛЕННАЯ ФУНКЦИЯ ОТРИСОВКИ ТАБЛИЦЫ
// =====================================================
function renderSourceTable() {
    if (!sourceTableBody) return;
    sourceTableBody.innerHTML = '';

    sourceData.forEach(row => {
        const tr = document.createElement('tr');
        // ВАЖНО: каждый столбец в отдельной ячейке <td>
        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.sort}</td>
            <td>${row.color}</td>
            <td>${row.ripeness}%</td>
            <td>${row.weight} g</td>
            <td>${row.date}</td>
        `;
        sourceTableBody.appendChild(tr);
    });
}

function renderQueryBuilder() {
    if (!queryRows) return;
    queryRows.innerHTML = '';

    if (currentTask === 1) {
        queryRows.innerHTML = `
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="sortField">
                    <option value="">-- выбери поле --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select id="sortOrder">
                    <option value="asc">▲ По возрастанию</option>
                    <option value="desc" selected>▼ По убыванию</option>
                </select>
                <input type="text" placeholder="Условие отбора" disabled>
                <select disabled><option>Не используется</option></select>
            </div>
        `;
    } else if (currentTask === 2) {
        queryRows.innerHTML = `
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="sortField1">
                    <option value="">-- выбери поле --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select id="sortOrder1">
                    <option value="asc">▲ По возрастанию</option>
                    <option value="desc">▼ По убыванию</option>
                </select>
                <input type="text" placeholder="Условие отбора" disabled>
                <select disabled><option>Не используется</option></select>
            </div>
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="sortField2">
                    <option value="">-- выбери поле --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select id="sortOrder2">
                    <option value="asc">▲ По возрастанию</option>
                    <option value="desc" selected>▼ По убыванию</option>
                </select>
                <input type="text" placeholder="Условие отбора" disabled>
                <select disabled><option>Не используется</option></select>
            </div>
        `;
    } else if (currentTask === 3) {
        queryRows.innerHTML = `
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="conditionField1">
                    <option value="">-- выбери поле --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select disabled><option>Не используется</option></select>
                <input type="text" id="condition1" placeholder="Условие отбора">
                <select disabled><option>Не используется</option></select>
            </div>
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="conditionField2">
                    <option value="">-- выбери поле --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select disabled><option>Не используется</option></select>
                <input type="text" id="condition2" placeholder="Условие отбора">
                <select disabled><option>Не используется</option></select>
            </div>
        `;
    } else if (currentTask === 4) {
        queryRows.innerHTML = `
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="groupField">
                    <option value="">-- выбери поле для группировки --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select disabled><option>Группировка</option></select>
                <input type="text" placeholder="Условие" disabled>
                <select id="aggregate">
                    <option value="count">Count (количество)</option>
                    <option value="sum">Sum (сумма)</option>
                </select>
            </div>
        `;
    } else if (currentTask === 5) {
        queryRows.innerHTML = `
            <div class="query-field-row" style="grid-template-columns: 1fr 1fr 2fr 1fr;">
                <select id="groupField2">
                    <option value="">-- выбери поле для группировки --</option>
                    ${fields.map(f => `<option value="${f.field}">${f.name}</option>`).join('')}
                </select>
                <select disabled><option>Группировка</option></select>
                <input type="text" placeholder="Условие" disabled>
                <select id="aggregate2">
                    <option value="sum">Sum (сумма)</option>
                </select>
            </div>
            <div class="query-field-row" style="grid-template-columns: 2fr 1fr 1.5fr 0.5fr;">
                <input type="text" id="customFieldFormula" placeholder="Формула: [Вес]/1000" value="[Вес]/1000">
                <select disabled><option>Вычисляемое</option></select>
                <input type="text" id="customFieldAlias" placeholder="Псевдоним: Вес_кг" value="Вес_кг">
                <select disabled><option>Не используется</option></select>
            </div>
        `;
    }
}

function executeQuery() {
    let result = [...sourceData];
    let isCorrect = false;
    let message = '';

    if (currentTask === 1) {
        const sortField = document.getElementById('sortField')?.value;
        const sortOrder = document.getElementById('sortOrder')?.value;
        if (sortField === 'ripeness' && sortOrder === 'desc') {
            isCorrect = true;
            message = '✅ Правильно! Бананы отсортированы по спелости!';
            result.sort((a, b) => b.ripeness - a.ripeness);
        } else {
        }
    } else if (currentTask === 2) {
        const field1 = document.getElementById('sortField1')?.value;
        const order1 = document.getElementById('sortOrder1')?.value;
        const field2 = document.getElementById('sortField2')?.value;
        const order2 = document.getElementById('sortOrder2')?.value;
        if (field1 === 'sort' && order1 === 'asc' && field2 === 'ripeness' && order2 === 'desc') {
            isCorrect = true;
            message = '✅ Правильно! Сначала по сорту, потом по спелости!';
            result.sort((a, b) => {
                if (a.sort !== b.sort) return a.sort.localeCompare(b.sort);
                return b.ripeness - a.ripeness;
            });
        } else {
        }
    } else if (currentTask === 3) {
        const field1 = document.getElementById('conditionField1')?.value;
        const cond1 = document.getElementById('condition1')?.value;
        const field2 = document.getElementById('conditionField2')?.value;
        const cond2 = document.getElementById('condition2')?.value;

        result = sourceData.filter(row => {
            let match = true;
            if (field1 === 'color' && cond1 === 'Жёлтый') match = match && row.color === 'Жёлтый';
            if (field2 === 'ripeness' && cond2 === '>80') match = match && row.ripeness > 80;
            if (field2 === 'color' && cond2 === 'Жёлтый') match = match && row.color === 'Жёлтый';
            if (field1 === 'ripeness' && cond1 === '>80') match = match && row.ripeness > 80;
            return match;
        });

        if (result.length > 0 && result.every(r => r.color === 'Жёлтый' && r.ripeness > 80)) {
            isCorrect = true;
            message = '✅ Правильно! Найдены все жёлтые бананы с высокой спелостью!';
        } else {
            result = [];
        }
    } else if (currentTask === 4) {
        const groupField = document.getElementById('groupField')?.value;
        if (groupField === 'sort') {
            isCorrect = true;
            message = '✅ Правильно! Сгруппировано по сортам с подсчётом!';
            const groups = {};
            sourceData.forEach(row => {
                groups[row.sort] = (groups[row.sort] || 0) + 1;
            });
            result = Object.entries(groups).map(([sort, count]) => ({ sort, count }));
        } else {
            result = [];
        }
    } else if (currentTask === 5) {
        const groupField = document.getElementById('groupField2')?.value;
        const formula = document.getElementById('customFieldFormula')?.value;
        if (groupField === 'sort' && formula && formula.includes('[Вес]')) {
            isCorrect = true;
            message = '✅ Правильно! Вычислен общий вес в кг по сортам!';
            const groups = {};
            sourceData.forEach(row => {
                groups[row.sort] = (groups[row.sort] || 0) + row.weight;
            });
            result = Object.entries(groups).map(([sort, totalWeight]) => ({ sort, totalWeight: totalWeight / 1000 }));
        } else {
            result = [];
        }
    }

    renderResult(result);
    queryMessage.textContent = message;
    queryMessage.className = 'query-message ' + (isCorrect ? 'correct' : 'wrong');

    if (isCorrect && !completedTasks[currentTask]) {
        completedTasks[currentTask] = true;
        let points = hintUsed ? 90 : 100;
        currentBananas += points;
        updateUI();
        const taskBtn = document.querySelector(`.task-btn[data-task="${currentTask}"]`);
        if (taskBtn) taskBtn.classList.add('completed');
        const taskStatus = document.getElementById('taskStatus');
        if (taskStatus) taskStatus.innerHTML = '✅ Выполнено!';
        raccoonSpeech.innerHTML = `🎉 Отлично! Задание ${currentTask} выполнено! +${points} бананов!`;

        const allCompleted = Object.values(completedTasks).every(v => v === true);
        if (allCompleted) showCompletion();
    } else if (isCorrect && completedTasks[currentTask]) {
        queryMessage.textContent = '✅ Задание уже выполнено! Переходи к следующему.';
    } else {
        raccoonSpeech.innerHTML = `🦝 Попробуй ещё раз!`;
    }
    hintUsed = false;
}

function renderResult(data) {
    if (!data || data.length === 0) {
        if (resultHeader) resultHeader.innerHTML = '';
        if (resultBody) resultBody.innerHTML = '<tr><td colspan="100%" style="text-align: center;">Нет данных, удовлетворяющих условиям</td></tr>';
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) chartContainer.style.display = 'none';
        return;
    }

    const columns = Object.keys(data[0]);
    if (resultHeader) resultHeader.innerHTML = '<tr>' + columns.map(col => `<th>${col}</th>`).join('') + '</tr>';
    if (resultBody) resultBody.innerHTML = data.map(row =>
        '<tr>' + columns.map(col => `<td>${row[col] !== undefined ? row[col] : '—'}</td>`).join('') + '</tr>'
    ).join('');

    if ((currentTask === 4 || currentTask === 5) && data.length > 0) {
        const chartContainer = document.getElementById('chartContainer');
        const canvas = document.getElementById('resultChart');
        if (chartContainer) chartContainer.style.display = 'block';
        if (chart) chart.destroy();

        if (currentTask === 4) {
            chart = new Chart(canvas, {
                type: 'bar',
                data: { labels: data.map(d => d.sort), datasets: [{ label: 'Количество', data: data.map(d => d.count), backgroundColor: ['#6450ff', '#a080ff'], borderRadius: 10 }] },
                options: { responsive: true, plugins: { legend: { labels: { color: '#e0ddf5' } } }, scales: { y: { ticks: { color: '#e0ddf5' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#e0ddf5' }, grid: { color: 'rgba(255,255,255,0.1)' } } } }
            });
        } else if (currentTask === 5) {
            chart = new Chart(canvas, {
                type: 'pie',
                data: { labels: data.map(d => d.sort), datasets: [{ data: data.map(d => d.totalWeight), backgroundColor: ['#6450ff', '#a080ff'] }] },
                options: { responsive: true, plugins: { legend: { labels: { color: '#e0ddf5' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} кг` } } } }
            });
        }
    } else {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) chartContainer.style.display = 'none';
        if (chart) { chart.destroy(); chart = null; }
    }
}

function switchTask(taskId) {
    currentTask = taskId;
    hintUsed = false;
    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.getAttribute('data-task')) === taskId) btn.classList.add('active');
    });
    document.getElementById('taskNumber').textContent = taskId;
    document.getElementById('taskDescription').textContent =
        taskId === 1 ? 'Отсортируй бананы по спелости от самых спелых к зелёным (по убыванию).' :
        taskId === 2 ? 'Отсортируй сначала по сорту (А-Я), потом по спелости (от самых спелых).' :
        taskId === 3 ? 'Найди все жёлтые бананы со спелостью больше 80%.' :
        taskId === 4 ? 'Посчитай количество бананов каждого сорта.' :
        'Вычисли общий вес бананов каждого сорта в килограммах.';
    renderQueryBuilder();
    queryMessage.textContent = '';
    queryMessage.className = 'query-message';
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) chartContainer.style.display = 'none';
    if (chart) { chart.destroy(); chart = null; }
    if (completedTasks[taskId]) {
        queryMessage.textContent = '✅ Это задание уже выполнено! Переходи к следующему.';
        queryMessage.className = 'query-message correct';
    }
    raccoonSpeech.innerHTML = `🦝 Задание ${taskId}: ${document.getElementById('taskDescription').textContent}`;
}

function resetQuery() {
    renderQueryBuilder();
    queryMessage.textContent = '';
    queryMessage.className = 'query-message';
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) chartContainer.style.display = 'none';
    if (chart) { chart.destroy(); chart = null; }
    showToast('🔄 Конструктор сброшен', false);
}

function showHint() {
    hintUsed = true;
    showToast(hints[currentTask], true);
    raccoonSpeech.innerHTML = `🦝 ${hints[currentTask]}`;
}

function updateUI() {
    if (bananaScoreSpan) bananaScoreSpan.textContent = currentBananas;
    const completedCount = Object.values(completedTasks).filter(v => v === true).length;
    if (completedCountSpan) completedCountSpan.textContent = completedCount;
    if (progressBar) progressBar.style.width = `${(completedCount / 5) * 100}%`;
}

function showToast(message, isCorrect) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function closeInstruction() { document.getElementById('instructionModal').style.display = 'none'; }
function closeCompletion() { document.getElementById('completionModal').style.display = 'none'; }
function showCompletion() {
    document.getElementById('finalBananas').textContent = currentBananas;
    document.getElementById('completionModal').style.display = 'flex';
}
function completeStage() {
    window.location.href = 'index.html';
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    bananaScoreSpan = document.getElementById('bananaScore');
    completedCountSpan = document.getElementById('completedCount');
    progressBar = document.getElementById('progressBar');
    raccoonSpeech = document.getElementById('raccoonSpeech');
    sourceTableBody = document.getElementById('sourceTableBody');
    queryRows = document.getElementById('queryRows');
    resultHeader = document.getElementById('resultHeader');
    resultBody = document.getElementById('resultBody');
    queryMessage = document.getElementById('queryMessage');
    toast = document.getElementById('toast');
    document.getElementById('totalBananas').textContent = totalBananas;

    renderSourceTable();
    renderQueryBuilder();

    document.getElementById('executeBtn').addEventListener('click', () => executeQuery());
    document.getElementById('hintBtn').addEventListener('click', () => showHint());
    document.getElementById('resetBtn').addEventListener('click', () => resetQuery());

    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTask(parseInt(btn.getAttribute('data-task'))));
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('gameTab').classList.toggle('active', tab === 'game');
            document.getElementById('theoryTab').classList.toggle('active', tab === 'theory');
        });
    });

    if (!localStorage.getItem('stage2_instruction_shown')) {
        document.getElementById('instructionModal').style.display = 'flex';
        localStorage.setItem('stage2_instruction_shown', 'true');
    }

    updateUI();
});