const socket = io();

// Estado Local
let currentRoom = null;
let myId = null;
let currentBidState = 0;

// Configuração do SweetAlert
const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
    timerProgressBar: true, background: '#1a1c23', color: '#fff'
});

// Navegação
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function createRoom() {
    const name = document.getElementById('playerName').value;
    const pass = document.getElementById('createPassword').value;
    if (!name.trim()) return Toast.fire({ icon: 'warning', title: 'Digite seu nome!' });
    socket.emit('createRoom', { playerName: name, password: pass });
}

function joinRoom() {
    const name = document.getElementById('playerName').value;
    const code = document.getElementById('joinCode').value.toUpperCase();
    const pass = document.getElementById('joinPassword').value;
    if (!name.trim() || !code.trim()) return Toast.fire({ icon: 'warning', title: 'Preencha nome e código!' });
    socket.emit('joinRoom', { playerName: name, roomCode: code, password: pass });
}

socket.on('connect', () => myId = socket.id);

socket.on('error', (msg) => {
    Swal.fire({ icon: 'error', title: 'Oops...', text: msg, confirmButtonText: 'OK' });
});

socket.on('roomCreated', (code) => currentRoom = code);

socket.on('updateLobby', (data) => {
    currentRoom = data.roomCode;
    showScreen('lobby-screen');
    
    document.getElementById('lobbyRoomCode').innerText = data.roomCode;
    if(data.settings) {
        document.getElementById('lobbyMoney').innerText = data.settings.startingMoney;
        document.getElementById('lobbyTime').innerText = data.settings.auctionTime;
    }

    const ul = document.getElementById('lobbyPlayers');
    ul.innerHTML = '';
    data.players.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${p.name} ${p.id === data.hostId ? '👑' : ''}</span> 
                        <span style="color:${p.ready ? 'var(--neon-green)' : '#ff4444'}; font-weight:600;">${p.ready ? 'PRONTO' : 'AGUARDANDO'}</span>`;
        ul.appendChild(li);
    });
    
    document.getElementById('playerCount').innerText = data.players.length;

    if (myId === data.hostId) {
        document.getElementById('btnStartGame').classList.remove('hidden');
        document.getElementById('btnReady').classList.add('hidden');
    } else {
        document.getElementById('btnStartGame').classList.add('hidden');
        document.getElementById('btnReady').classList.remove('hidden');
    }
});

function toggleReady() { socket.emit('toggleReady', currentRoom); }
function startGame() { socket.emit('startGame', currentRoom); }

socket.on('gameStarted', () => {
    showScreen('game-screen');
    Toast.fire({ icon: 'success', title: 'A partida começou!' });
});

// Eventos de Leilão
socket.on('auctionStart', (data) => {
    const info = data.auctionInfo;
    currentBidState = info.currentBid;
    
    document.getElementById('auction-alert').innerHTML = "NOVO LEILÃO NA MESA!";
    document.getElementById('auction-alert').style.color = "var(--neon-green)";
    
    document.getElementById('aucImage').src = info.player.image;
    document.getElementById('aucName').innerText = info.player.name;
    document.getElementById('aucNacionality').innerText = info.player.nationality;
    document.getElementById('aucClub').innerText = info.player.club;
    document.getElementById('aucPos').innerText = info.player.position;
    document.getElementById('aucOvr').innerText = info.player.overall;
    document.getElementById('aucAge').innerText = info.player.age;
    
    updateBidUI(info.currentBid, info.highestBidderName);
    updatePlayersState(data.playersState);
});

socket.on('timerUpdate', (time) => {
    const timerEl = document.getElementById('auctionTimer');
    timerEl.innerText = time.toString().padStart(2, '0');
    if (time <= 5 && time > 0) {
        timerEl.style.color = '#ff4444';
        timerEl.style.textShadow = '0 0 15px rgba(255,68,68,0.5)';
    } else {
        timerEl.style.color = 'var(--text-main)';
        timerEl.style.textShadow = '0 0 20px var(--neon-green-dim)';
    }
});

socket.on('newBid', (data) => {
    currentBidState = data.amount;
    updateBidUI(data.amount, data.bidderName);
    
    // Animação leve no box
    const box = document.querySelector('.current-bid-box');
    box.style.transform = 'scale(1.05)';
    setTimeout(() => box.style.transform = 'scale(1)', 150);
});

socket.on('auctionResult', (data) => {
    if (data.sold) {
        document.getElementById('auction-alert').innerHTML = `🔨 VENDIDO para <b>${data.winnerName}</b>!`;
        document.getElementById('auction-alert').style.color = "var(--gold)";
        if(data.winnerName === document.getElementById('playerName').value) {
            Swal.fire({ title: 'COMPRADO!', text: `Você contratou ${data.player.name} por €${data.amount}M`, icon: 'success', timer: 3000, showConfirmButton: false });
        }
    } else {
        document.getElementById('auction-alert').innerText = "❌ NENHUM LANCE. Jogador ignorado.";
        document.getElementById('auction-alert').style.color = "#ff4444";
    }
});

socket.on('updateState', (data) => updatePlayersState(data.players));

socket.on('gameOver', (players) => {
    document.getElementById('auction-alert').innerText = "FIM DE JOGO!";
    Swal.fire({ title: 'Partida Encerrada!', text: 'Verifique o ranking final na lateral esquerda.', icon: 'info' });
});

// Ações
function sendBidOffset(offset) {
    const amount = currentBidState + offset;
    socket.emit('placeBid', { roomCode: currentRoom, amount });
}

function sendCustomBid() {
    const input = document.getElementById('customBid');
    const amount = parseInt(input.value);
    if (!amount || amount <= currentBidState) {
        return Toast.fire({ icon: 'error', title: 'Lance inválido.' });
    }
    socket.emit('placeBid', { roomCode: currentRoom, amount });
    input.value = '';
}

function updateBidUI(amount, name) {
    document.getElementById('highestBid').innerText = amount;
    document.getElementById('highestBidder').innerText = name;
}

function updatePlayersState(players) {
    const ranking = document.getElementById('gameRanking');
    ranking.innerHTML = '';
    
    players.forEach(p => { p.score = p.squad.reduce((sum, j) => sum + j.overall, 0); });
    players.sort((a, b) => b.score - a.score);

    players.forEach((p, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong style="color:var(--text-muted); width:20px; display:inline-block;">${index+1}</strong> ${p.name}</span> <span>€${p.balance}M | ${p.squad.length} 👕</span>`;
        ranking.appendChild(li);

        if (p.id === myId) {
            document.getElementById('myBalance').innerText = p.balance;
            updateMySquad(p.squad);
        }
    });
}

function updateMySquad(squad) {
    document.getElementById('mySquadCount').innerText = squad.length;
    const ul = document.getElementById('mySquad');
    ul.innerHTML = '';
    squad.forEach(j => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${j.name} <small style="color:var(--text-muted)">(${j.position})</small></span> <strong style="color:var(--gold)">OVR ${j.overall}</strong>`;
        ul.appendChild(li);
    });
}

// Chat
function sendChat() {
    const input = document.getElementById('chatInput');
    if (input.value.trim() !== '') {
        socket.emit('chatMessage', { roomCode: currentRoom, message: input.value });
        input.value = '';
    }
}

socket.on('chatMessage', (data) => {
    const box = document.getElementById('chatBox');
    const li = document.createElement('li');
    li.innerHTML = `<span class="name">${data.sender}:</span> <span style="color:var(--text-main)">${data.message}</span>`;
    box.appendChild(li);
    box.scrollTop = box.scrollHeight;
});
