// =====================================================
// КОНФИГУРАЦИЯ
// =====================================================
const totalBananas = 300; // 100 бананов за каждую таблицу
let currentBananas = 0;

// Задания
const tasks = {
    students: {
        id: 'students',
        name: 'Студенты',
        displayName: '🧑‍🎓 Студенты',
        description: 'Информацию о студентах: ФИО, дата рождения, класс, средний балл, контакты.',
        requiredName: 'Студенты',
        requiredFields: ['ID', 'Фамилия', 'Имя', 'Дата рождения', 'Класс', 'Средний балл'],
        optionalFields: ['Отчество', 'Email', 'Телефон', 'Адрес'],
        completed: false
    },
    books: {
        id: 'books',
        name: 'Книги',
        displayName: '📚 Книги',
        description: 'Информацию о книгах: название, автор, жанр, год издания, количество страниц, цена.',
        requiredName: 'Книги',
        requiredFields: ['ID', 'Название книги', 'Автор', 'Жанр', 'Год издания', 'Цена'],
        optionalFields: ['Количество страниц', 'Издательство', 'ISBN'],
        completed: false
    },
    products: {
        id: 'products',
        name: 'Товары',
        displayName: '🛒 Товары',
        description: 'Информацию о товарах: название, категория, цена, количество на складе, производитель.',
        requiredName: 'Товары',
        requiredFields: ['ID', 'Название товара', 'Категория', 'Цена', 'Количество на складе'],
        optionalFields: ['Производитель', 'Артикул', 'Вес', 'Описание'],
        completed: false
    }
};

// Все возможные поля (общая библиотека)
const allFields = [
    // Для студентов
    { name: 'ID', type: 'counter', category: 'students', emoji: '🔑' },
    { name: 'Фамилия', type: 'text', category: 'students', emoji: '📝' },
    { name: 'Имя', type: 'text', category: 'students', emoji: '📝' },
    { name: 'Отчество', type: 'text', category: 'students', emoji: '📝' },
    { name: 'Дата рождения', type: 'date', category: 'students', emoji: '📅' },
    { name: 'Класс', type: 'text', category: 'students', emoji: '🎓' },
    { name: 'Средний балл', type: 'number', category: 'students', emoji: '⭐' },
    { name: 'Email', type: 'text', category: 'students', emoji: '📧' },
    { name: 'Телефон', type: 'text', category: 'students', emoji: '📞' },
    { name: 'Адрес', type: 'text', category: 'students', emoji: '🏠' },

    // Для книг
    { name: 'Название книги', type: 'text', category: 'books', emoji: '📖' },
    { name: 'Автор', type: 'text', category: 'books', emoji: '✍️' },
    { name: 'Жанр', type: 'text', category: 'books', emoji: '🎭' },
    { name: 'Год издания', type: 'number', category: 'books', emoji: '📅' },
    { name: 'Количество страниц', type: 'number', category: 'books', emoji: '📄' },
    { name: 'Цена', type: 'number', category: 'books', emoji: '💰' },
    { name: 'Издательство', type: 'text', category: 'books', emoji: '🏛️' },
    { name: 'ISBN', type: 'text', category: 'books', emoji: '🔢' },

    // Для товаров
    { name: 'Название товара', type: 'text', category: 'products', emoji: '🏷️' },
    { name: 'Категория', type: 'text', category: 'products', emoji: '📂' },
    { name: 'Количество на складе', type: 'number', category: 'products', emoji: '📦' },
    { name: 'Производитель', type: 'text', category: 'products', emoji: '🏭' },
    { name: 'Артикул', type: 'text', category: 'products', emoji: '🔖' },
    { name: 'Вес', type: 'number', category: 'products', emoji: '⚖️' },
    { name: 'Описание', type: 'text', category: 'products', emoji: '📝' }
];

// Состояние
let currentTaskId = 'students';
let currentFields = [];
let draggedField = null;
let completedTasks = { students: false, books: false, products: false };

// DOM элементы
let libraryGrid, tableFieldsList, checkBtn, clearBtn;
let bananaScoreSpan, completedCountSpan, progressBar, raccoonSpeech;
let taskDescriptionText, currentTaskNameSpan, fixedTableName;

// =====================================================
// ИНИЦИАЛИЗАЦИЯ
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    libraryGrid = document.getElementById('libraryGrid');
    tableFieldsList = document.getElementById('tableFieldsList');
    checkBtn = document.getElementById('checkBtn');
    clearBtn = document.getElementById('clearBtn');
    bananaScoreSpan = document.getElementById('bananaScore');
    completedCountSpan = document.getElementById('completedCount');
    progressBar = document.getElementById('progressBar');
    raccoonSpeech = document.getElementById('raccoonSpeech');
    taskDescriptionText = document.getElementById('taskDescriptionText');
    currentTaskNameSpan = document.getElementById('currentTaskName');
    fixedTableName = document.getElementById('fixedTableName');

    document.getElementById('totalBananas').textContent = totalBananas;

    // Перемешиваем поля
    shuffleArray(allFields);

    // Рендерим библиотеку
    renderLibrary();

    // Настройка drag-and-drop
    setupDragAndDrop();

    // Обработчики кнопок
    checkBtn.addEventListener('click', checkTable);
    clearBtn.addEventListener('click', clearCurrentTable);

    // Обработчики выбора задания
    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskId = btn.getAttribute('data-task');
            switchTask(taskId);
        });
    });

    // Показываем инструкцию при первом открытии
    if (!localStorage.getItem('stage1_instruction_shown')) {
        document.getElementById('instructionModal').style.display = 'flex';
        localStorage.setItem('stage1_instruction_shown', 'true');
    }

    // Загружаем первое задание
    switchTask('students');

    updateUI();
});

function closeInstruction() {
    document.getElementById('instructionModal').style.display = 'none';
}

function switchTab(tabName) {
    const constructorTab = document.getElementById('constructorTab');
    const theoryTab = document.getElementById('theoryTab');
    const btns = document.querySelectorAll('.tab-btn');

    if (tabName === 'constructor') {
        constructorTab.classList.add('active');
        theoryTab.classList.remove('active');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        constructorTab.classList.remove('active');
        theoryTab.classList.add('active');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderLibrary() {
    libraryGrid.innerHTML = '';
    allFields.forEach(field => {
        const card = document.createElement('div');
        card.className = 'material-card';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-field-name', field.name);
        card.setAttribute('data-field-type', field.type);
        card.setAttribute('data-category', field.category);
        card.innerHTML = `
            <span class="material-emoji">${field.emoji}</span>
            <span class="material-name">${escapeHtml(field.name)}</span>
        `;
        libraryGrid.appendChild(card);
    });
}

function setupDragAndDrop() {
    document.querySelectorAll('.material-card').forEach(el => {
        el.addEventListener('dragstart', dragStart);
        el.addEventListener('dragend', dragEnd);
    });

    const observer = new MutationObserver(() => {
        document.querySelectorAll('.material-card').forEach(el => {
            if (!el.hasAttribute('data-drag-listener')) {
                el.setAttribute('data-drag-listener', 'true');
                el.addEventListener('dragstart', dragStart);
                el.addEventListener('dragend', dragEnd);
            }
        });
    });
    observer.observe(libraryGrid, { childList: true, subtree: true });

    tableFieldsList.addEventListener('dragover', (e) => e.preventDefault());
    tableFieldsList.addEventListener('drop', dropOnTable);
}

function dragStart(e) {
    draggedField = this;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.querySelector('.material-name').textContent);
    e.dataTransfer.effectAllowed = 'copy';
}

function dragEnd(e) {
    this.classList.remove('dragging');
    draggedField = null;
}

function dropOnTable(e) {
    e.preventDefault();
    if (!draggedField) return;

    const fieldName = draggedField.querySelector('.material-name').textContent;
    const fieldData = allFields.find(f => f.name === fieldName);

    if (!fieldData) return;

    if (currentFields.some(f => f.name === fieldName)) {
        showToast(`❌ Поле "${fieldName}" уже добавлено!`, false);
        return;
    }

    currentFields.push({
        name: fieldName,
        type: fieldData.type,
        isKey: fieldName === 'ID' && currentFields.length === 0,
        category: fieldData.category
    });

    showToast(`✅ Поле "${fieldName}" добавлено`, true);
    renderTableFields();
    updateUI();
}

function renderTableFields() {
    if (currentFields.length === 0) {
        tableFieldsList.innerHTML = `
            <div class="empty-builder">
                <span class="empty-icon">🏗️</span>
                <p>Перетащи сюда поля из библиотеки</p>
            </div>
        `;
        return;
    }

    tableFieldsList.innerHTML = '';
    currentFields.forEach((field, index) => {
        const row = document.createElement('div');
        row.className = 'builder-field';
        row.innerHTML = `
            <div class="field-name-display">
                <span>${escapeHtml(field.name)}</span>
            </div>
            <div>
                <select class="field-type-select" data-index="${index}">
                    <option value="text" ${field.type === 'text' ? 'selected' : ''}>📝 Текст</option>
                    <option value="number" ${field.type === 'number' ? 'selected' : ''}>🔢 Число</option>
                    <option value="date" ${field.type === 'date' ? 'selected' : ''}>📅 Дата/время</option>
                    <option value="counter" ${field.type === 'counter' ? 'selected' : ''}>🔑 Счетчик</option>
                </select>
            </div>
            <div>
                <input type="radio" name="primaryKey" value="${index}" class="key-radio" ${field.isKey ? 'checked' : ''}>
            </div>
            <div>
                <button class="delete-field-btn" data-index="${index}">🗑️</button>
            </div>
        `;
        tableFieldsList.appendChild(row);
    });

    document.querySelectorAll('.field-type-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            currentFields[index].type = e.target.value;
        });
    });

    document.querySelectorAll('.key-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            currentFields.forEach((f, i) => f.isKey = (i === index));
            renderTableFields();
        });
    });

    document.querySelectorAll('.delete-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const removed = currentFields.splice(index, 1)[0];
            showToast(`🗑️ Поле "${removed.name}" удалено`, false);
            renderTableFields();
            updateUI();
        });
    });
}

function switchTask(taskId) {
    currentTaskId = taskId;
    const task = tasks[taskId];

    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-task') === taskId) {
            btn.classList.add('active');
        }
    });

    taskDescriptionText.textContent = task.description;
    currentTaskNameSpan.textContent = task.displayName;
    if (fixedTableName) fixedTableName.textContent = task.requiredName;

    currentFields = [];
    renderTableFields();
    closeResult();

    updateUI();
    raccoonSpeech.textContent = `🦝 Теперь строим таблицу "${task.displayName}". Перетаскивай нужные поля!`;
}

function checkTable() {
    const task = tasks[currentTaskId];
    const currentFieldNames = currentFields.map(f => f.name);
    const requiredSet = new Set(task.requiredFields);
    const currentSet = new Set(currentFieldNames);

    const missingFields = task.requiredFields.filter(f => !currentSet.has(f));
    const extraFields = currentFieldNames.filter(f => !requiredSet.has(f) && !task.optionalFields.includes(f));

    const hasAllRequired = missingFields.length === 0;
    const hasNoExtra = extraFields.length === 0;
    const hasKey = currentFields.some(f => f.isKey === true);

    if (hasAllRequired && hasNoExtra && hasKey) {
        if (!task.completed) {
            task.completed = true;
            currentBananas += 100;
            completedTasks[task.id] = true;

            showResult(`✅ Отлично! Таблица "${task.requiredName}" собрана правильно! +100 бананов`, true);
            showToast(`🎉 Таблица "${task.requiredName}" принята! +100 бананов`, true);
            raccoonSpeech.textContent = `🦝 Поздравляю! Таблица "${task.requiredName}" готова! Переходи к следующему заданию.`;

            const taskBtn = document.querySelector(`.task-btn[data-task="${task.id}"]`);
            if (taskBtn) taskBtn.classList.add('completed');

            const allCompleted = tasks.students.completed && tasks.books.completed && tasks.products.completed;
            if (allCompleted) {
                showCompletion();
            }
        } else {
            showResult(`✅ Таблица "${task.requiredName}" уже была принята!`, true);
        }
    } else {
        let errorMsg = '';
        if (!hasAllRequired) errorMsg += `❌ Не хватает полей: ${missingFields.join(', ')}. `;
        if (!hasNoExtra) errorMsg += `❌ Лишние поля: ${extraFields.join(', ')}. `;
        if (!hasKey) errorMsg += `❌ Не выбран ключевое поле (обычно это ID). `;
        if (hasAllRequired && hasNoExtra && !hasKey) errorMsg = `❌ Не выбран ключевое поле. Отметь ID как ключевое (🔑). `;

        showResult(errorMsg, false);
        raccoonSpeech.textContent = `🦝 ${errorMsg.substring(0, 120)} Попробуй ещё раз!`;
    }

    updateUI();
}

function showResult(message, isCorrect) {
    const panel = document.getElementById('resultPanel');
    const content = document.getElementById('resultContent');
    content.textContent = message;
    content.className = 'result-content ' + (isCorrect ? 'correct' : 'wrong');
    panel.style.display = 'block';

    setTimeout(() => {
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        }
    }, 5000);
}

function closeResult() {
    document.getElementById('resultPanel').style.display = 'none';
}

function clearCurrentTable() {
    if (confirm('Очистить все поля таблицы?')) {
        currentFields = [];
        renderTableFields();
        showToast('🗑️ Таблица очищена', false);
        raccoonSpeech.textContent = '🦝 Таблица очищена. Можешь начать заново!';
    }
}

function updateUI() {
    bananaScoreSpan.textContent = currentBananas;
    const completedCount = Object.values(tasks).filter(t => t.completed).length;
    completedCountSpan.textContent = completedCount;
    const progressPercent = (completedCount / 3) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function showToast(message, isCorrect) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showCompletion() {
    document.getElementById('finalBananas').textContent = currentBananas;
    document.getElementById('completionModal').style.display = 'flex';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function completeStage() {
    window.location.href = 'index.html';
}