import { db, collection, getDocs, addDoc, doc, setDoc, getDoc, updateDoc } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const streakElement = document.querySelector('.text-orange-600');
    const fireIcon = document.querySelector('.text-orange-500');
    const mascotImg = document.querySelector('img[alt="Mascote Cachorro Let\'s Learn English"]');
    const taskFeed = document.getElementById('task-feed');
    
    const flashcard = document.getElementById('flashcard');
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');
    const btnAudio = document.getElementById('btn-audio');
    const textoIngles = document.getElementById('texto-ingles');
    const textoPronuncia = document.getElementById('card-back').querySelector('.font-mono');
    const textoFrente = document.getElementById('card-front').querySelector('h2');
    const situationBadge = document.querySelector('.text-brand-600.bg-brand-100');

    let cardVirado = false;
    let cardsAtuais = [];
    let indiceCardAtual = 0;

    const userRef = doc(db, 'users', 'admin');
    let userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, { streak_count: 1, last_study_date: new Date().toISOString() });
        await iniciarDiaUm();
        userSnap = await getDoc(userRef);
    }

    let userData = userSnap.data();
    atualizarOfensiva(userData);
    carregarTarefas();
    carregarFlashcards();

    function atualizarOfensiva(data) {
        const hoje = new Date();
        const ultimoEstudo = new Date(data.last_study_date);
        hoje.setHours(0,0,0,0);
        ultimoEstudo.setHours(0,0,0,0);
        
        const diffDias = Math.ceil(Math.abs(hoje - ultimoEstudo) / (1000 * 60 * 60 * 24));

        if (diffDias > 1) {
            data.streak_count = 0;
            streakElement.textContent = '0';
            fireIcon.classList.replace('text-orange-500', 'text-gray-400');
            fireIcon.classList.remove('animate-pulse');
            mascotImg.classList.add('grayscale', 'opacity-80');
        } else {
            streakElement.textContent = data.streak_count;
            mascotImg.classList.remove('grayscale', 'opacity-80');
        }
    }

    async function carregarTarefas() {
        taskFeed.innerHTML = '';
        const tarefasSnap = await getDocs(collection(db, 'tasks'));
        const tarefas = [];
        tarefasSnap.forEach(doc => tarefas.push({ id: doc.id, ...doc.data() }));
        tarefas.sort((a, b) => new Date(b.date) - new Date(a.date));

        tarefas.forEach(tarefa => {
            const opacity = tarefa.done ? 'opacity-60' : 'opacity-100';
            const text = tarefa.done ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100';
            const border = tarefa.done ? 'border-l-gray-300' : 'border-l-brand-500';
            
            const li = document.createElement('li');
            li.className = `bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-l-4 ${border} border-gray-100 dark:border-gray-700 flex items-start gap-3 ${opacity}`;
            li.innerHTML = `
                <input type="checkbox" ${tarefa.done ? 'checked' : ''} onchange="marcarTarefa('${tarefa.id}', this.checked)" class="mt-1 w-5 h-5 rounded border-gray-300 text-brand-500">
                <div>
                    <p class="font-semibold text-sm ${text}">${tarefa.title}</p>
                    <p class="text-xs text-gray-500 mt-1">${tarefa.desc}</p>
                </div>
            `;
            taskFeed.appendChild(li);
        });
    }

    window.marcarTarefa = async function(id, isDone) {
        await updateDoc(doc(db, 'tasks', id), { done: isDone });
        await updateDoc(userRef, { last_study_date: new Date().toISOString() });
        carregarTarefas();
    };

    async function carregarFlashcards() {
        const cardsSnap = await getDocs(collection(db, 'flashcards'));
        cardsSnap.forEach(doc => cardsAtuais.push({ id: doc.id, ...doc.data() }));
        if (cardsAtuais.length > 0) renderizarCard(0);
    }

    function renderizarCard(indice) {
        if (indice >= cardsAtuais.length) {
            textoFrente.textContent = "Você revisou todos os cards de hoje!";
            situationBadge.textContent = "Concluído";
            cardFront.classList.remove('hidden');
            cardBack.classList.add('hidden');
            return;
        }
        const card = cardsAtuais[indice];
        situationBadge.textContent = `Situação: ${card.situacao}`;
        textoFrente.textContent = card.frente;
        textoIngles.textContent = card.verso_ingles;
        textoPronuncia.textContent = card.verso_pronuncia;
    }

    function tocarAudio(texto) {
        if ('speechSynthesis' in window) {
            const fala = new SpeechSynthesisUtterance(texto);
            fala.lang = 'en-US';
            fala.rate = 0.85;
            window.speechSynthesis.speak(fala);
        }
    }

    flashcard.addEventListener('click', (e) => {
        if (e.target.closest('#btn-audio') || indiceCardAtual >= cardsAtuais.length) return;
        if (!cardVirado) {
            cardFront.classList.add('hidden');
            cardBack.classList.remove('hidden');
            btnAudio.classList.remove('hidden');
            cardVirado = true;
            tocarAudio(textoIngles.textContent);
        }
    });

    btnAudio.addEventListener('click', () => tocarAudio(textoIngles.textContent));

    let touchStartX = 0;
    flashcard.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, {passive: true});
    flashcard.addEventListener('touchend', e => {
        if (!cardVirado || indiceCardAtual >= cardsAtuais.length) return;
        const swipeDistance = e.changedTouches[0].screenX - touchStartX;
        
        if (swipeDistance > 80) {
            flashcard.style.transform = 'translateX(200px) rotate(15deg)';
            flashcard.style.opacity = '0';
            setTimeout(() => resetCard(7), 300); // Fácil: 7 dias
        } else if (swipeDistance < -80) {
            flashcard.style.transform = 'translateX(-200px) rotate(-15deg)';
            flashcard.style.opacity = '0';
            setTimeout(() => resetCard(1), 300); // Errei: 1 dia
        }
    }, {passive: true});

    async function resetCard(diasParaFrente) {
        const cardAtual = cardsAtuais[indiceCardAtual];
        const novaData = new Date();
        novaData.setDate(novaData.getDate() + diasParaFrente);
        
        await updateDoc(doc(db, 'flashcards', cardAtual.id), { proxima_revisao: novaData.toISOString() });

        flashcard.style.transition = 'none';
        flashcard.style.transform = 'translateX(0) rotate(0)';
        flashcard.style.opacity = '1';
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
        btnAudio.classList.add('hidden');
        cardVirado = false;
        
        indiceCardAtual++;
        renderizarCard(indiceCardAtual);
        
        setTimeout(() => flashcard.style.transition = 'transform 0.3s ease, opacity 0.3s ease', 50);
    }

    async function iniciarDiaUm() {
        const taskCol = collection(db, 'tasks');
        await addDoc(taskCol, { title: 'Imersão', desc: 'Assistir a 10 min de POV Magic Kingdom', done: false, date: new Date().toISOString() });
        await addDoc(taskCol, { title: 'Prática Ativa', desc: 'Revisar os primeiros cards', done: false, date: new Date(Date.now() + 1000).toISOString() });

        const loteFrases = [
            { situacao: 'Imigração', frente: 'Aqui estão nossos passaportes.', verso_ingles: 'Here are our passports.', verso_pronuncia: 'Hír ár aour pás-pórts.' },
            { situacao: 'Imigração', frente: 'Estamos viajando em família.', verso_ingles: 'We are traveling as a family.', verso_pronuncia: 'Uí ár tré-vã-lin és a fê-mili.' },
            { situacao: 'Imigração', frente: 'Estou com a minha esposa e minha filha.', verso_ingles: 'I am with my wife and my daughter.', verso_pronuncia: 'Ái ém uít mái uáif énd mái dór-târ.' },
            { situacao: 'Imigração', frente: 'Vamos ficar por duas semanas.', verso_ingles: 'We are staying for two weeks.', verso_pronuncia: 'Uí ár stêi-in fór tú uíks.' },
            { situacao: 'Hotel', frente: 'Tenho uma reserva em nome de Pires.', verso_ingles: 'I have a reservation under Pires.', verso_pronuncia: 'Ái hév a re-zâr-vei-xâ-n ân-dâr Pí-ris.' },
            { situacao: 'Hotel', frente: 'O ar-condicionado não está funcionando.', verso_ingles: 'The air conditioning isn\'t working.', verso_pronuncia: 'Dâ ér con-dí-xio-nin í-zãnt uôr-kin.' },
            { situacao: 'Hotel', frente: 'A que horas é o café da manhã?', verso_ingles: 'What time is breakfast?', verso_pronuncia: 'Uát táim is brék-fést?' },
            { situacao: 'Hotel', frente: 'Pode nos dar toalhas extras?', verso_ingles: 'Could we get extra towels?', verso_pronuncia: 'Cúd uí guét éks-tra táu-ôls?' },
            { situacao: 'Transporte', frente: 'Onde fica a área de aplicativo (Uber)?', verso_ingles: 'Where is the ride-share pickup?', verso_pronuncia: 'Uér is dâ ráid-xér pí-kâp?' },
            { situacao: 'Parques', frente: 'Qual é o tempo de espera?', verso_ingles: 'How long is the wait?', verso_pronuncia: 'Ráu lóng is dâ uêit?' },
            { situacao: 'Parques', frente: 'Onde fica o banheiro mais próximo?', verso_ingles: 'Where is the nearest restroom?', verso_pronuncia: 'Uér is dâ ní-rest rés-trum?' },
            { situacao: 'Parques', frente: 'Minha esposa precisa escanear o ingresso aqui?', verso_ingles: 'Does my wife need to scan her ticket here?', verso_pronuncia: 'Dâs mái uáif níd tú skén râr tí-ket hír?' },
            { situacao: 'Parques', frente: 'Minha filha quer ver a Cinderela.', verso_ingles: 'My daughter wants to see Cinderella.', verso_pronuncia: 'Mái dór-târ uónts tú sí Sin-dê-ré-la.' },
            { situacao: 'Parques', frente: 'Onde posso estacionar o carrinho de bebê?', verso_ingles: 'Where can I park the stroller?', verso_pronuncia: 'Uér kén ái párk dâ strô-lâr?' },
            { situacao: 'Parques', frente: 'Você poderia tirar uma foto nossa?', verso_ingles: 'Could you take a picture of us?', verso_pronuncia: 'Cúd iú têik a pík-tshur óv âs?' },
            { situacao: 'Parques', frente: 'Minha MagicBand não está funcionando.', verso_ingles: 'My MagicBand is not working.', verso_pronuncia: 'Mái Mé-djik-Bénd is nót uôr-kin.' },
            { situacao: 'Restaurante', frente: 'Uma mesa para três, por favor.', verso_ingles: 'A table for three, please.', verso_pronuncia: 'A tei-bôu fór tri, plíz.' },
            { situacao: 'Restaurante', frente: 'Vocês têm menu infantil?', verso_ingles: 'Do you have a kids menu?', verso_pronuncia: 'Dú iú hév a kíds me-nú?' },
            { situacao: 'Restaurante', frente: 'Apenas água da torneira (grátis), por favor.', verso_ingles: 'Just tap water, please.', verso_pronuncia: 'Djâst tép uó-târ, plíz.' },
            { situacao: 'Restaurante', frente: 'Nós estamos prontos para pedir.', verso_ingles: 'We are ready to order.', verso_pronuncia: 'Uí ár ré-di tú ór-dâr.' },
            { situacao: 'Restaurante', frente: 'A conta, por favor.', verso_ingles: 'The check, please.', verso_pronuncia: 'Dâ tchék, plíz.' },
            { situacao: 'Compras', frente: 'Quanto custa isso?', verso_ingles: 'How much is this?', verso_pronuncia: 'Ráu mâtch is dês?' },
            { situacao: 'Compras', frente: 'Vocês têm um tamanho maior?', verso_ingles: 'Do you have a bigger size?', verso_pronuncia: 'Dú iú hév a bí-guâr sáiz?' },
            { situacao: 'Compras', frente: 'Onde ficam os provadores?', verso_ingles: 'Where are the fitting rooms?', verso_pronuncia: 'Uér ár dâ fí-tin rúms?' },
            { situacao: 'Compras', frente: 'O imposto (taxa) já está incluído?', verso_ingles: 'Is tax included?', verso_pronuncia: 'Is téks in-clú-dêd?' }
        ];

        const cardsCol = collection(db, 'flashcards');
        for (const frase of loteFrases) {
            await addDoc(cardsCol, {
                situacao: frase.situacao,
                frente: frase.frente,
                verso_ingles: frase.verso_ingles,
                verso_pronuncia: frase.verso_pronuncia,
                proxima_revisao: new Date().toISOString()
            });
        }
    }
});
