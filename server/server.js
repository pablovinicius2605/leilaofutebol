const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { normalPlayers, memePlayers } = require('./players');

const app = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
const rooms = {};
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// ADICIONADO ZAGUEIRO, TOTAL 5 JOGADORES
const SQUAD_LIMITS = { "Goleiro": 1, "Zagueiro": 1, "Meia/Ponta": 2, "Atacante": 1 };

function isPositionFull(player, position) {
    return player.squad.filter(p => p.position === position).length >= SQUAD_LIMITS[position];
}

io.on('connection', (socket) => {
    socket.on('createRoom', (data) => {
        try {
            const roomCode = generateRoomCode();
            rooms[roomCode] = {
                id: roomCode,
                password: data.password || "",
                hostId: socket.id,
                status: 'lobby',
                // Aumentado dinheiro para 75 pois agora são 5 posições
                settings: { startingMoney: 75, auctionTime: parseInt(data.auctionTime) || 15, maxPlayers: parseInt(data.maxPlayers) || 8 },
                players: {},
                auctionQueue: [], 
                currentAuction: null,
                timer: null
            };
            joinRoomEngine(socket, roomCode, data.playerName);
            socket.emit('roomCreated', roomCode);
        } catch (error) {}
    });

    socket.on('joinRoom', (data) => {
        const room = rooms[data.roomCode];
        if (!room) return socket.emit('error', 'Sala não encontrada.');
        if (room.password && room.password !== data.password) return socket.emit('error', 'Senha incorreta.');
        if (Object.keys(room.players).length >= room.settings.maxPlayers) return socket.emit('error', 'A sala está cheia.');
        if (room.status !== 'lobby') return socket.emit('error', 'A partida já começou.');
        joinRoomEngine(socket, data.roomCode, data.playerName);
    });

    function joinRoomEngine(socket, roomCode, playerName) {
        const room = rooms[roomCode];
        socket.join(roomCode);
        room.players[socket.id] = {
            id: socket.id, name: playerName.substring(0, 15), balance: room.settings.startingMoney,
            squad: [], ready: room.hostId === socket.id, pts: 0 
        };
        io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players), settings: room.settings });
    }

    socket.on('toggleReady', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players[socket.id]) {
            room.players[socket.id].ready = !room.players[socket.id].ready;
            io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players) });
        }
    });

    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.hostId === socket.id) {
            const allReady = Object.values(room.players).every(p => p.ready);
            if (!allReady) return socket.emit('error', 'Todos os jogadores precisam estar prontos.');
            
            // PEGA 30 JOGADORES ALEATORIOS DO BANCO DE DADOS
            let shuffled = [...normalPlayers].sort(() => 0.5 - Math.random());
            room.auctionQueue = shuffled.slice(0, 30);
            
            room.status = 'game';
            io.to(roomCode).emit('gameStarted');
            startNextAuction(roomCode);
        }
    });

    socket.on('placeBid', ({ roomCode, amount }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'game' || !room.currentAuction) return;

        const player = room.players[socket.id];
        const auction = room.currentAuction;
        const bidAmount = parseInt(amount);

        if (isNaN(bidAmount)) return socket.emit('error', 'Lance inválido.');
        if (player.balance < bidAmount) return socket.emit('error', 'Saldo insuficiente.');
        if (bidAmount <= auction.currentBid) return socket.emit('error', `Lance deve ser maior que $${auction.currentBid}.`);
        if (auction.highestBidderId === socket.id) return socket.emit('error', 'Você já tem o maior lance.');
        if (isPositionFull(player, auction.player.position)) return socket.emit('error', 'Você já preencheu esta posição no elenco!');
        if (auction.folded.includes(socket.id)) return socket.emit('error', 'Você desistiu deste leilão.');

        auction.currentBid = bidAmount;
        auction.highestBidderId = socket.id;
        auction.highestBidderName = player.name;
        
        auction.timeLeft = Math.min(auction.timeLeft + 5, 30);

        io.to(roomCode).emit('newBid', { amount: bidAmount, bidderName: player.name, bidderId: socket.id });
        io.to(roomCode).emit('timerUpdate', auction.timeLeft); 
    });

    socket.on('foldBid', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'game' || !room.currentAuction) return;
        
        if (!room.currentAuction.folded.includes(socket.id)) {
            room.currentAuction.folded.push(socket.id);
            const playerName = room.players[socket.id].name;
            io.to(roomCode).emit('playerFolded', { playerName });
            io.to(roomCode).emit('chatMessage', { sender: 'SISTEMA', message: `${playerName} desistiu.`, isSystem: true });
            
            checkAuctionEndEarly(roomCode);
        }
    });

    function checkAuctionEndEarly(roomCode) {
        const room = rooms[roomCode];
        const auction = room.currentAuction;
        let possibleBidders = 0;
        
        Object.values(room.players).forEach(p => {
            if (!auction.folded.includes(p.id) && !isPositionFull(p, auction.player.position) && p.balance > auction.currentBid) {
                possibleBidders++;
            }
        });

        if (auction.folded.length >= 3 || possibleBidders === 0) {
            clearInterval(room.timer);
            resolveAuction(roomCode);
        }
    }

    socket.on('chatMessage', ({ roomCode, message }) => {
        const room = rooms[roomCode];
        if (room && room.players[socket.id] && message.trim().length > 0) {
            io.to(roomCode).emit('chatMessage', { sender: room.players[socket.id].name, message: message.substring(0, 100) });
        }
    });

    socket.on('playAgain', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.hostId === socket.id) {
            room.status = 'lobby';
            room.auctionQueue = [];
            Object.values(room.players).forEach(p => {
                p.balance = room.settings.startingMoney;
                p.squad = [];
                p.pts = 0;
                p.ready = (p.id === room.hostId);
            });
            io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players), settings: room.settings });
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                if (room.hostId === socket.id) {
                    const remainingPlayers = Object.keys(room.players);
                    if (remainingPlayers.length > 0) { room.hostId = remainingPlayers[0]; } 
                    else { clearInterval(room.timer); delete rooms[roomCode]; continue; }
                }
                io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players) });
                io.to(roomCode).emit('updateState', { players: Object.values(room.players) });
            }
        }
    });

    function checkGameOverAndFill(roomCode) {
        const room = rooms[roomCode];
        const playersArr = Object.values(room.players);
        // TOTAL DE 5 JOGADORES AGORA
        const allFull = playersArr.every(p => p.squad.length >= 5);
        
        if (room.auctionQueue.length === 0 || allFull) {
            playersArr.forEach(p => {
                ['Goleiro', 'Zagueiro', 'Meia/Ponta', 'Atacante'].forEach(pos => {
                    const currentCount = p.squad.filter(x => x.position === pos).length;
                    const needed = SQUAD_LIMITS[pos] - currentCount;
                    if (needed > 0) {
                        const availableMemes = memePlayers.filter(m => m.position === pos);
                        for(let i=0; i<needed; i++) {
                            const meme = availableMemes[Math.floor(Math.random() * availableMemes.length)];
                            p.squad.push({...meme, isMeme: true});
                        }
                    }
                });
            });

            room.status = 'simulation';
            runSimulation(roomCode);
            return true;
        }
        return false;
    }
    
    // SIMULAÇÃO MAIS DETALHADA
    function runSimulation(roomCode) {
        const room = rooms[roomCode];
        const playersArr = Object.values(room.players);
        
        playersArr.forEach(p => { 
            p.teamOvr = p.squad.reduce((sum, j) => sum + j.overall, 0); 
            p.pts = 0; 
            
            // Força de Setores para simulação tática
            let defPlayers = p.squad.filter(j => j.position === 'Goleiro' || j.position === 'Zagueiro');
            let atkPlayers = p.squad.filter(j => j.position === 'Meia/Ponta' || j.position === 'Atacante');
            
            p.defOvr = defPlayers.reduce((sum, j) => sum + j.overall, 0) / Math.max(1, defPlayers.length);
            p.atkOvr = atkPlayers.reduce((sum, j) => sum + j.overall, 0) / Math.max(1, atkPlayers.length);
        });
        
        let matches = [];

        // Ida simples
        for(let i=0; i<playersArr.length; i++) {
            for(let j=i+1; j<playersArr.length; j++) {
                let p1 = playersArr[i], p2 = playersArr[j];
                
                // Attack P1 vs Defense P2 + RNG
                let p1Chance = p1.atkOvr - p2.defOvr + Math.floor(Math.random() * 20 - 10);
                let p2Chance = p2.atkOvr - p1.defOvr + Math.floor(Math.random() * 20 - 10);
                
                let goals1 = Math.max(0, Math.floor((p1Chance + 15) / 10));
                let goals2 = Math.max(0, Math.floor((p2Chance + 15) / 10));
                
                goals1 = Math.min(goals1, 4); goals2 = Math.min(goals2, 4);
                
                if(goals1 > goals2) p1.pts += 3;
                else if(goals2 > goals1) p2.pts += 3;
                else { p1.pts += 1; p2.pts += 1; }
                
                // Pegar autores dos gols (apenas meias e atacantes fazem gol nesta simulação pra simplificar)
                let scorers1 = [], scorers2 = [];
                let atk1 = p1.squad.filter(x => x.position === 'Atacante' || x.position === 'Meia/Ponta');
                let atk2 = p2.squad.filter(x => x.position === 'Atacante' || x.position === 'Meia/Ponta');
                
                for(let k=0; k<goals1; k++) {
                    let scorer = atk1[Math.floor(Math.random() * atk1.length)];
                    if(scorer) scorers1.push(scorer.name.split(' ')[0]);
                }
                for(let k=0; k<goals2; k++) {
                    let scorer = atk2[Math.floor(Math.random() * atk2.length)];
                    if(scorer) scorers2.push(scorer.name.split(' ')[0]);
                }
                
                let s1Text = scorers1.length > 0 ? `<div style="font-size:11px; color:#888;">⚽ ${scorers1.join(', ')}</div>` : '';
                let s2Text = scorers2.length > 0 ? `<div style="font-size:11px; color:#888;">⚽ ${scorers2.join(', ')}</div>` : '';

                matches.push(`
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <div style="width:40%; text-align:right;"><b>${p1.name}</b> ${s1Text}</div>
                        <div style="width:20%; text-align:center; color:var(--gold); font-weight:bold; font-size:18px;">${goals1} x ${goals2}</div>
                        <div style="width:40%; text-align:left;"><b>${p2.name}</b> ${s2Text}</div>
                    </div>
                `);
            }
        }
        
        playersArr.sort((a,b) => b.pts - a.pts || b.teamOvr - a.teamOvr);
        
        io.to(roomCode).emit('updateState', { players: playersArr });
        io.to(roomCode).emit('simulationResult', { players: playersArr, matches: matches, hostId: room.hostId });
    }

    function startNextAuction(roomCode) {
        const room = rooms[roomCode];
        if (checkGameOverAndFill(roomCode)) return;

        const playerToAuction = room.auctionQueue.pop();
        
        let validBidders = 0;
        Object.values(room.players).forEach(p => {
            if (!isPositionFull(p, playerToAuction.position) && p.balance > 0) validBidders++;
        });

        if (validBidders === 0) {
            return startNextAuction(roomCode); 
        }

        room.currentAuction = {
            player: playerToAuction, currentBid: 0, highestBidderId: null,
            highestBidderName: "Ninguém", timeLeft: room.settings.auctionTime, folded: []
        };

        io.to(roomCode).emit('auctionStart', { auctionInfo: room.currentAuction, playersState: Object.values(room.players) });

        clearInterval(room.timer);
        room.timer = setInterval(() => {
            room.currentAuction.timeLeft--;
            io.to(roomCode).emit('timerUpdate', room.currentAuction.timeLeft);
            if (room.currentAuction.timeLeft <= 0) {
                clearInterval(room.timer);
                resolveAuction(roomCode);
            }
        }, 1000);
    }

    function resolveAuction(roomCode) {
        const room = rooms[roomCode];
        const auction = room.currentAuction;
        if (auction.highestBidderId) {
            const winner = room.players[auction.highestBidderId];
            winner.balance -= auction.currentBid;
            winner.squad.push(auction.player);
            io.to(roomCode).emit('auctionResult', { sold: true, winnerName: winner.name, amount: auction.currentBid, player: auction.player });
        } else {
            io.to(roomCode).emit('auctionResult', { sold: false, player: auction.player });
        }
        setTimeout(() => startNextAuction(roomCode), 4000);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { console.log(`[ON] Servidor rodando na porta ${PORT}`); });
