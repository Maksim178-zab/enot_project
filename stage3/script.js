// Функция скачивания шаблонов
function downloadTemplate(type) {
    let content = '';
    let filename = '';

    switch(type) {
        case 'algorithm':
            content = `Алгоритм сортировки данных в MS Access

Команда: ____________________

Шаг 1: _________________________________________________
Шаг 2: _________________________________________________
Шаг 3: _________________________________________________
Шаг 4: _________________________________________________
Шаг 5: _________________________________________________
Шаг 6: _________________________________________________
Шаг 7: _________________________________________________

Дата: ____________________`;
            filename = 'Алгоритм_сортировки.doc';
            break;

        case 'presentation':
            content = `План презентации проекта

Команда: ____________________
Тема: ____________________

Слайд 1: Титульный
Слайд 2: Цель и задачи
Слайд 3: Теория (базы данных)
Слайд 4: Процесс очистки данных
Слайд 5: Создание таблицы в Access
Слайд 6: Запросы и сортировка
Слайд 7: Результаты и выводы

Дата защиты: ____________________`;
            filename = 'План_презентации.doc';
            break;

        case 'speech':
            content = `План выступления на защите

Команда: ____________________

1. Приветствие и представление команды (30 сек)
   _________________________________________________

2. Тема и актуальность проекта (30 сек)
   _________________________________________________

3. Что сделано: по этапам квеста (2 минуты)
   Этап 0: _________________________________________
   Этап 1: _________________________________________
   Этап 2: _________________________________________

4. Демонстрация работы БД (1 минута)
   _________________________________________________

5. Выводы и ответы на вопросы (1 минута)
   _________________________________________________

Время выступления: ____________________`;
            filename = 'План_выступления.doc';
            break;
    }

    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Показ уведомления
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Обработчики скачивания шаблонов
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            downloadTemplate(type);
            showToast('📥 Скачивание начато...');
        });
    });
});