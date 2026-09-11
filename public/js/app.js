const socket = io();
let currentRoom = null;
let myId = null;
let currentBidState = 0;
let currentAuctionPos = null;
let roomPlayersData = []; // Store to view teams

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#1a1c23', color: '#fff' });

function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }
function createRoom() { const n = document.getElementById('playerName').value; if(!n) return Toast.fire({icon:'warning',title:'Nome!'}); socket.emit('createRoom', {playerName: n, password: document.getElementById('createPassword').value}); }
function joinRoom() { const n = document.getElementById('playerName').value, c = document.getElementById('joinCode').value.toUpperCase(); if(!n||!c) return Toast.fire({icon:'warning',title:'Preencha!'}); socket.emit('joinRoom', {playerName: n, roomCode: c, password: document.getElementById('joinPassword').value}); }

socket.on('connect', () => myId = socket.id);
socket.on('error', msg => Swal.fire({icon:'error', title:'Oops...', text:msg}));
socket.on('roomCreated', c => currentRoom = c);

socket.on('updateLobby', (data) => {
    currentRoom = data.roomCode;
    showScreen('lobby-screen');
    document.getElementById('lobbyRoomCode').innerText = data.roomCode;
    const ul = document.getElementById('lobbyPlayers'); ul.innerHTML = '';
    data.players.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${p.name} ${p.id === data.hostId ? '👑' : ''}</span><span style="color:${p.ready ? 'var(--neon-green)' : '#ff4444'}; font-weight:600;">${p.ready ? 'PRONTO' : 'AGUARDANDO'}</span>`;
        ul.appendChild(li);
    });
    document.getElementById('playerCount').innerText = data.players.length;
    document.getElementById('btnStartGame').classList.toggle('hidden', myId !== data.hostId);
    document.getElementById('btnReady').classList.toggle('hidden', myId === data.hostId);
});

function toggleReady() { socket.emit('toggleReady', currentRoom); }
function startGame() { socket.emit('startGame', currentRoom); }
socket.on('gameStarted', () => { showScreen('game-screen'); Toast.fire({icon:'success', title:'Partida iniciada!'}); });

socket.on('auctionStart', (data) => {
    const info = data.auctionInfo;
    currentBidState = info.currentBid;
    currentAuctionPos = info.player.position;
    
    document.getElementById('auction-alert').innerHTML = "LEILÃO ABERTO";
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

socket.on('timerUpdate', t => {
    const el = document.getElementById('auctionTimer'); el.innerText = t.toString().padStart(2, '0');
    el.style.color = (t<=5 && t>0) ? '#ff4444' : 'var(--text-main)';
    // Efeito visual quando o tempo sobe (ex: +5s após lance)
    el.style.transform = 'scale(1.2)';
    setTimeout(() => el.style.transform = 'scale(1)', 200);
});

socket.on('newBid', data => {
    currentBidState = data.amount; updateBidUI(data.amount, data.bidderName);
    const box = document.querySelector('.current-bid-box');
    box.style.transform = 'scale(1.05)'; setTimeout(() => box.style.transform = 'scale(1)', 150);
});

socket.on('auctionResult', data => {
    if (data.sold) {
        document.getElementById('auction-alert').innerHTML = `🔨 VENDIDO para <b>${data.winnerName}</b>!`;
        document.getElementById('auction-alert').style.color = "var(--gold)";
        if(data.winnerName === document.getElementById('playerName').value) {
            Swal.fire({ title: 'CONTRATADO!', text: `Você comprou ${data.player.name} por 🪙${data.amount}`, icon: 'success', timer: 3000, showConfirmButton: false });
        }
    } else {
        document.getElementById('auction-alert').innerText = "❌ NENHUM LANCE / TODOS DESISTIRAM.";
        document.getElementById('auction-alert').style.color = "#ff4444";
    }
});

socket.on('updateState', data => updatePlayersState(data.players));

// TELA DE SIMULAÇÃO (FIM DE JOGO)
socket.on('simulationResult', data => {
    showScreen('sim-screen');
    const rankingEl = document.getElementById('simRanking');
    rankingEl.innerHTML = '';
    
    data.players.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span><b>${i+1}º</b> ${p.name} <small>(OVR ${p.teamOvr})</small></span> <span style="color:var(--gold); font-weight:bold;">${p.pts} Pts</span>`;
        rankingEl.appendChild(li);
    });

    const matchesEl = document.getElementById('simMatches');
    matchesEl.innerHTML = '';
    data.matches.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = m;
        matchesEl.appendChild(li);
    });

    // Controle do Botão Jogar Novamente
    if (myId === data.hostId) {
        document.getElementById('btnPlayAgain').classList.remove('hidden');
        document.getElementById('waitHostText').classList.add('hidden');
    } else {
        document.getElementById('btnPlayAgain').classList.add('hidden');
        document.getElementById('waitHostText').classList.remove('hidden');
    }
});

function playAgain() {
    socket.emit('playAgain', currentRoom);
}

function sendBidOffset(offset) {
    const amount = currentBidState === 0 ? offset : currentBidState + offset;
    socket.emit('placeBid', { roomCode: currentRoom, amount });
}

function sendCustomBid() {
    const amount = parseInt(document.getElementById('customBid').value);
    socket.emit('placeBid', { roomCode: currentRoom, amount });
    document.getElementById('customBid').value = '';
}

function foldBid() {
    socket.emit('foldBid', currentRoom);
    lockBidUI();
}

function updateBidUI(amount, name) { document.getElementById('highestBid').innerText = amount; document.getElementById('highestBidder').innerText = name; }

function viewTeam(playerId) {
    const p = roomPlayersData.find(x => x.id === playerId);
    if(!p) return;
    
    let html = `<ul style="list-style:none; padding:0; text-align:left;">`;
    if(p.squad.length === 0) html += `<li>Nenhum jogador comprado.</li>`;
    p.squad.forEach(j => {
        html += `<li style="margin-bottom:10px; background:#23252b; padding:10px; border-radius:5px;">
                    <b style="color:var(--gold)">[${j.position}]</b> ${j.name} (OVR ${j.overall})
                 </li>`;
    });
    html += `</ul>`;
    
    Swal.fire({
        title: `Elenco de ${p.name}`,
        html: html,
        showCloseButton: true,
        showConfirmButton: false
    });
}

function updatePlayersState(players) {
    roomPlayersData = players; // Save for viewTeam func
    const ranking = document.getElementById('gameRanking'); ranking.innerHTML = '';
    
    // Força provisória (Soma de OVR)
    players.forEach(p => { p.score = p.squad.reduce((sum, j) => sum + j.overall, 0); });
    players.sort((a, b) => b.score - a.score);

    players.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><b>${i+1}</b> ${p.name} 
                <button class="btn-ver-time" onclick="viewTeam('${p.id}')">Ver Time</button>
            </span> 
            <span>🪙${p.balance}</span>`;
        ranking.appendChild(li);

        if (p.id === myId) {
            document.getElementById('myBalance').innerText = p.balance;
            renderMySquadSlots(p.squad);
            
            // Trava botões de lance
            if (currentAuctionPos) {
                const LIMITS = { "Goleiro": 1, "Meia/Ponta": 2, "Atacante": 1 };
                const myPosCount = p.squad.filter(x => x.position === currentAuctionPos).length;
                if(myPosCount >= LIMITS[currentAuctionPos]) lockBidUI();
                else unlockBidUI();
            }
        }
    });
}

function lockBidUI() {
    document.getElementById('bidControlsArea').classList.add('hidden');
    document.getElementById('customBidArea').classList.add('hidden');
    document.getElementById('lockedBidArea').classList.remove('hidden');
}

function unlockBidUI() {
    document.getElementById('bidControlsArea').classList.remove('hidden');
    document.getElementById('customBidArea').classList.remove('hidden');
    document.getElementById('lockedBidArea').classList.add('hidden');
}

function renderMySquadSlots(squad) {
    const slots = [
        { id: 'slot-gol', pos: 'Goleiro', label: 'GOL' },
        { id: 'slot-mei1', pos: 'Meia/Ponta', label: 'MEI' },
        { id: 'slot-mei2', pos: 'Meia/Ponta', label: 'MEI' },
        { id: 'slot-ata', pos: 'Atacante', label: 'ATA' }
    ];
    
    slots.forEach(s => {
        const el = document.getElementById(s.id);
        el.className = 'slot';
        el.innerHTML = `<span class="pos">${s.label}</span><span class="name">Vazio</span>`;
    });

    let meiCount = 1;
    squad.forEach(p => {
        let targetId = '';
        if(p.position === 'Goleiro') targetId = 'slot-gol';
        else if(p.position === 'Meia/Ponta') { targetId = `slot-mei${meiCount}`; meiCount++; }
        else if(p.position === 'Atacante') targetId = 'slot-ata';

        if(targetId) {
            const el = document.getElementById(targetId);
            el.classList.add('filled');
            if(p.isMeme) el.classList.add('meme');
            el.innerHTML = `<span class="pos">${p.isMeme ? 'MEME' : el.querySelector('.pos').innerText}</span><span class="name">${p.name} <small>(OVR ${p.overall})</small></span>`;
        }
    });
}

function sendChat() {
    const input = document.getElementById('chatInput');
    if (input.value.trim() !== '') { socket.emit('chatMessage', { roomCode: currentRoom, message: input.value }); input.value = ''; }
}

socket.on('chatMessage', data => {
    const box = document.getElementById('chatBox'); const li = document.createElement('li');
    if(data.isSystem) li.innerHTML = `<span class="sys">${data.sender}:</span> <span style="color:var(--text-muted)">${data.message}</span>`;
    else li.innerHTML = `<span class="name">${data.sender}:</span> <span style="color:var(--text-main)">${data.message}</span>`;
    box.appendChild(li); box.scrollTop = box.scrollHeight;
});
