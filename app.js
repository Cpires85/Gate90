import { db, collection, getDocs, addDoc, doc, setDoc, getDoc, updateDoc } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const streakElement = document.querySelector('.text-orange-600');
    const fireIcon = document.querySelector('.text-orange-500');
    const mascotImg = document.querySelector('img[alt="Mascote Cachorro Let\'s Learn English"]');
    const taskFeed = document.getElementById('task-feed');
    
    // Elementos do Flashcard
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');
    const flipBtn = document.getElementById('flip-btn');
    const situationBadge = document.querySelector('.text-brand-500.bg-brand-50');

    // 1. Inicialização e Controle da Ofensiva (Foguinho)
    const userRef = doc(db, 'users', 'admin');
    let userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // É o primeiro dia de uso. Cria o perfil e injeta as tarefas do Dia 1.
        await setDoc(userRef, {
            streak_count: 1,
            last_study_date: new Date().toISOString()
        });
        await iniciarDiaUm();
        userSnap = await getDoc(userRef);
    }

    let userData = userSnap.data();
    atualizarOfensiva(userData);

    function atualizarOfensiva(data) {
        const hoje = new Date();
        const ultimoEstudo = new Date(data.last_study_date);
        
        // Zera a hora para comparar apenas as datas
        hoje.setHours(0,0,0,0);
        ultimoEstudo.setHours(0,0,0,0);
        
        const diffTempo = Math.abs(hoje - ultimoEstudo);
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        if (diffDias > 1) {
            // Perdeu a ofensiva: apagou o foguinho e o mascote fica triste
            data.streak_count = 0;
            streakElement.textContent = '0';
            fireIcon.classList.remove('text-orange-500', 'animate-pulse');
            fireIcon.classList.add('text-gray-400');
            mascotImg.classList.add('grayscale', 'opacity-80');
        } else {
            // Ofensiva ativa
            streakElement.textContent = data.streak_count;
            mascotImg.classList.remove('grayscale', 'opacity-80');
        }
    }

    // 2. Carregar Tarefas Diárias do Firestore
    async function carregarTarefas() {
        taskFeed.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">Carregando tarefas...</p>';
        const tarefasSnap = await getDocs(collection(db, 'tasks'));
        const tarefas = [];
        
        tarefasSnap.forEach(doc => {
            tarefas.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar da mais recente para a mais antiga (garante que as novas ficam no topo)
        tarefas.sort((a, b) => new Date(b.date) - new Date(a.date));

        taskFeed.innerHTML = '';
        tarefas.forEach(tarefa => {
            const opacityClass = tarefa.done ? 'opacity-60' : 'opacity-100';
            const textClass = tarefa.done ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100';
            const borderClass = tarefa.done ? 'border-l-gray-300' : 'border-l-brand-500';
            
            const li = document.createElement('li');
            li.className = `bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-l-4 ${borderClass} border-gray-100 dark:border-gray-700 flex items-start gap-3 ${opacityClass}`;
            li.innerHTML = `
                <input type="checkbox" ${tarefa.done ? 'checked' : ''} onchange="marcarTarefa('${tarefa.id}', this.checked)" class="mt-1 w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500">
                <div>
                    <p class="font-semibold text-sm ${textClass}">${tarefa.title}</p>
                    <p class="text-xs text-gray-500 mt-1">${tarefa.desc}</p>
                </div>
            `;
            taskFeed.appendChild(li);
        });
    }

    // Função global para o checkbox atualizar o banco
    window.marcarTarefa = async function(id, isDone) {
        await updateDoc(doc(db, 'tasks', id), { done: isDone });
        
        // Se concluiu a tarefa hoje, garante que o foguinho suba
        const hojeIso = new Date().toISOString();
        await updateDoc(userRef, { last_study_date: hojeIso });
        
        carregarTarefas(); // Recarrega a lista para aplicar o risco (line-through)
    };

    // 3. Injeção Automática do Dia 1 (Roda apenas na primeira vez que abre o app)
    async function iniciarDiaUm() {
        // Criar as 3 primeiras tarefas
        const taskCol = collection(db, 'tasks');
        await addDoc(taskCol, { title: 'Imersão', desc: 'Assistir a 10 min de POV Magic Kingdom', done: false, date: new Date().toISOString() });
        await addDoc(taskCol, { title: 'Prática Ativa', desc: 'Revisar os 3 cards iniciais', done: false, date: new Date(Date.now() + 1000).toISOString() });

        // Criar os primeiros Flashcards focados na viagem em família
        const cardsCol = collection(db, 'flashcards');
        
        // Card 1: Correção do Teste (Fila)
        await addDoc(cardsCol, {
            situacao: 'Parques',
            frente: 'Como perguntar o tempo de espera na fila do brinquedo?',
            verso_ingles: 'How long is the wait?',
            verso_pronuncia: 'Ráu lóng is dâ uêit?',
            proxima_revisao: new Date().toISOString()
        });

        // Card 2: Dinâmica Familiar
        await addDoc(cardsCol, {
            situacao: 'Restaurante',
            frente: 'Pedir uma mesa para você, sua esposa e sua filha.',
            verso_ingles: 'A table for three, please.',
            verso_pronuncia: 'A tei-bôu fór tri, plíz.',
            proxima_revisao: new Date().toISOString()
        });

        // Card 3: Correção do Teste (Hotel)
        await addDoc(cardsCol, {
            situacao: 'Hotel',
            frente: 'Avisar que o ar-condicionado do quarto quebrou.',
            verso_ingles: 'The air conditioning isn\'t working.',
            verso_pronuncia: 'Dâ ér con-dí-xio-nin í-zãnt uôr-kin.',
            proxima_revisao: new Date().toISOString()
        });
    }

    // Carrega tudo ao iniciar
    carregarTarefas();
});
