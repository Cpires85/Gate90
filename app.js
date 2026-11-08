// app.js
import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da Interface
    const streakElement = document.querySelector('.text-orange-600');
    const fireIcon = document.querySelector('.text-orange-500');
    const mascotImg = document.querySelector('img[alt="Mascote Cachorro Let\'s Learn English"]');
    const taskFeed = document.getElementById('task-feed');

    // Estado do Usuário (Simulado - depois você conectará ao documento do Firestore)
    let userState = {
        streak_count: 5,
        last_study_date: new Date().toISOString() // Data da última vez que estudou
    };

    // 1. Lógica do Foguinho e do Mascote
    function checkStreak() {
        const today = new Date();
        const lastStudy = new Date(userState.last_study_date);
        const diffTime = Math.abs(today - lastStudy);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 2) {
            // Perdeu a ofensiva: Foguinho apaga e mascote fica triste (preto e branco)
            userState.streak_count = 0;
            streakElement.textContent = '0';
            fireIcon.classList.remove('text-orange-500', 'animate-pulse');
            fireIcon.classList.add('text-gray-400');
            mascotImg.classList.add('grayscale', 'opacity-80');
        } else {
            // Ofensiva mantida
            streakElement.textContent = userState.streak_count;
            mascotImg.classList.remove('grayscale', 'opacity-80');
        }
    }

    // 2. Renderização das Tarefas (Sempre a mais nova no topo)
    async function loadTasks() {
        taskFeed.innerHTML = ''; // Limpa a lista de carregamento
        
        // Simulação de dados do Firestore (Você substituirá por um getDocs real)
        const tasks = [
            { id: 1, title: 'Revisão: Alfândega', desc: '10 cards pendentes', date: '2026-11-05T10:00:00', done: true },
            { id: 2, title: 'Treinar pedido de ingressos', desc: '"Does my wife need to scan her ticket here?"', date: '2026-11-06T14:00:00', done: false },
            { id: 3, title: 'Encontro com Personagens', desc: '"My daughter wants to see Cinderella."', date: '2026-11-06T18:00:00', done: false }
        ];

        // Ordena por data (mais recente primeiro / ordem decrescente)
        tasks.sort((a, b) => new Date(b.date) - new Date(a.date));

        tasks.forEach(task => {
            const opacityClass = task.done ? 'opacity-60' : 'opacity-100';
            const textClass = task.done ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100';
            const borderClass = task.done ? 'border-l-gray-300' : 'border-l-brand-500';
            
            const li = document.createElement('li');
            li.className = `bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-l-4 ${borderClass} border-gray-100 dark:border-gray-700 flex items-start gap-3 ${opacityClass}`;
            li.innerHTML = `
                <input type="checkbox" ${task.done ? 'checked' : ''} class="mt-1 w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500">
                <div>
                    <p class="font-semibold text-sm ${textClass}">${task.title}</p>
                    <p class="text-xs text-gray-500 mt-1">${task.desc}</p>
                </div>
            `;
            taskFeed.appendChild(li);
        });
    }

    checkStreak();
    loadTasks();
});
