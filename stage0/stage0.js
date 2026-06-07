// Данные карточек (без подсказок на карточках)
const cardsData = [
    { id: 1, value: "Иван Иванов", type: "keep", explanation: "✅ Это корректные ФИО. Никаких лишних символов, всё правильно." },
    { id: 2, value: "Петр Петров", type: "keep", explanation: "✅ Корректные ФИО. Можно отправлять в базу данных." },
    { id: 3, value: "Мария Сидорова", type: "keep", explanation: "✅ Всё правильно: имя и фамилия на месте, без ошибок." },
    { id: 4, value: "Анна, Смирнова", type: "fix", explanation: "✏️ Лишняя запятая. Должно быть: 'Анна Смирнова'." },
    { id: 5, value: "Иван Иванов", type: "delete", explanation: "🗑️ Это дубликат! Такая запись уже есть в 'Чистых данных'. Оставляем только одну." },
    { id: 6, value: "Дмитрий", type: "fix", explanation: "✏️ Нет фамилии. Полное имя должно содержать и имя, и фамилию." },
    { id: 7, value: "Ольга Кузнецова", type: "keep", explanation: "✅ Отлично! Имя и фамилия написаны правильно." },
    { id: 8, value: "", type: "delete", explanation: "🗑️ Пустая запись. В ней нет никакой информации, удаляем." },
    { id: 9, value: "Елена-Петрова", type: "fix", explanation: "✏️ Лишний дефис. Правильно: 'Елена Петрова'." },
    { id: 10, value: "Петр Петров", type: "delete", explanation: "🗑️ Дубликат. Такая запись уже была обработана." },
    { id: 11, value: "Сергей Иванович", type: "fix", explanation: "✏️ Нет фамилии. Должно быть: 'Сергей Иванов' (имя + фамилия)." },
    { id: 12, value: "Анна Смирнова", type: "keep", explanation: "✅ Корректные ФИО. Всё в порядке." },
    { id: 13, value: "????", type: "delete", explanation: "🗑️ Непонятные символы. Это мусор, удаляем." },
    { id: 14, value: "Николай 123", type: "fix", explanation: "✏️ Цифры в имени. В ФИО не должно быть цифр." }
];

let currentCards = [];
let clearedCards = 0;
let bananaScore = 0;
const totalBananas = 100;
const pointsPerCard = Math.floor(totalBananas / cardsData.length);

// DOM элементы
let cardsGrid, keepContainer, fixContainer, deleteContainer;
let bananaScoreSpan, clearedCountSpan, totalCardsSpan, progressBar, raccoonSpeech, toast;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    cardsGrid = document.getElementById('cardsGrid');
    keepContainer = document.querySelector('.container.keep .container-dropzone');
    fixContainer = document.querySelector('.container.fix .container-dropzone');
    deleteContainer = document.querySelector('.container.delete .container-dropzone');
    bananaScoreSpan = document.getElementById('bananaScore');
    clearedCountSpan = document.getElementById('clearedCount');
    totalCardsSpan = document.getElementById('totalCards');
    progressBar = document.getElementById('progressBar');
    raccoonSpeech = document.getElementById('raccoonSpeech');
    toast = document.getElementById('toast');

    totalCardsSpan.textContent = cardsData.length;

    // Копируем данные
    currentCards = JSON.parse(JSON.stringify(cardsData));

    // Перемешиваем карточки
    shuffleArray(currentCards);

    // Рендерим карточки
    renderCards();
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderCards() {
    cardsGrid.innerHTML = '';
    currentCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'data-card';
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-id', card.id);
        cardEl.setAttribute('data-type', card.type);
        cardEl.setAttribute('data-value', card.value);
        cardEl.setAttribute('data-explanation', card.explanation);
        cardEl.innerHTML = `<div class="card-value">${escapeHtml(card.value || '❌ Пусто')}</div>`;

        cardEl.addEventListener('dragstart', dragStart);
        cardEl.addEventListener('dragend', dragEnd);

        cardsGrid.appendChild(cardEl);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

let draggedCard = null;

function dragStart(e) {
    draggedCard = this;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
}

function dragEnd(e) {
    this.classList.remove('dragging');
    draggedCard = null;
}

function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function showToast(message, isCorrect) {
    toast.textContent = message;
    toast.className = 'toast ' + (isCorrect ? 'correct' : 'wrong');
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function drop(e) {
    e.preventDefault();
    const container = e.target.closest('.container');
    if (!container || !draggedCard) return;

    const targetType = container.classList.contains('keep') ? 'keep' :
                       container.classList.contains('fix') ? 'fix' : 'delete';

    const cardId = parseInt(draggedCard.getAttribute('data-id'));
    const card = currentCards.find(c => c.id === cardId);

    if (!card) return;

    // Проверка правильности
    if (card.type === targetType) {
        // Правильно! Показываем подсказку-объяснение
        showToast(card.explanation, true);
        addToContainer(container, card);
        removeCard(cardId);
        clearedCards++;
        bananaScore += pointsPerCard;
        updateUI();

        // Меняем речь енота
        raccoonSpeech.textContent = getRandomEncouragement();

        // Проверка завершения
        if (clearedCards === cardsData.length) {
            showCompletion();
        }
    } else {
        // Неправильно! Показываем, почему не так, и куда надо было положить
        const correctContainer = card.type === 'keep' ? 'Чистые данные' :
                                  card.type === 'fix' ? 'Исправление' : 'Дубликаты/Мусор';
        showToast(`❌ Неправильно! ${card.explanation} Это нужно положить в "${correctContainer}".`, false);
        raccoonSpeech.textContent = getRandomError();
        shakeElement(container);
    }
}

function addToContainer(container, card) {
    const dropzone = container.querySelector('.container-dropzone');
    const cardInContainer = document.createElement('div');
    cardInContainer.className = 'card-in-container';
    cardInContainer.textContent = escapeHtml(card.value || '❌ Пусто');
    dropzone.appendChild(cardInContainer);
}

function removeCard(cardId) {
    const index = currentCards.findIndex(c => c.id === cardId);
    if (index !== -1) {
        currentCards.splice(index, 1);
    }
    if (draggedCard) {
        draggedCard.remove();
    }
}

function updateUI() {
    bananaScoreSpan.textContent = bananaScore;
    clearedCountSpan.textContent = clearedCards;
    const progressPercent = (clearedCards / cardsData.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function getRandomEncouragement() {
    const messages = [
        '🍌 Отлично! +' + pointsPerCard + ' бананов!',
        '🦝 Так держать! Ты понял принцип!',
        '✨ Правильно! Данные чистятся!',
        '🎉 Ура! Ещё одна карточка на месте!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomError() {
    const messages = [
        '😕 Ой, не туда! Прочитай объяснение внимательно.',
        '🤔 Неправильно. Посмотри в теорию, там всё понятно.',
        '🦝 Ошибка! Но теперь ты знаешь, как правильно.',
        '💡 Запомни объяснение — в следующий раз будет легче!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function shakeElement(el) {
    el.style.transform = 'translateX(5px)';
    setTimeout(() => { el.style.transform = ''; }, 100);
    setTimeout(() => { el.style.transform = 'translateX(-5px)'; }, 200);
    setTimeout(() => { el.style.transform = ''; }, 300);
}

function switchTab(tabName) {
    const gameTab = document.getElementById('gameTab');
    const theoryTab = document.getElementById('theoryTab');
    const btns = document.querySelectorAll('.tab-btn');

    if (tabName === 'game') {
        gameTab.classList.add('active');
        theoryTab.classList.remove('active');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        gameTab.classList.remove('active');
        theoryTab.classList.add('active');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

function showCompletion() {
    document.getElementById('finalBananas').textContent = bananaScore;
    document.getElementById('completionModal').style.display = 'flex';
}

function completeStage() {

    // Возвращаемся на основной сайт
    window.location.href = 'index.html';
}