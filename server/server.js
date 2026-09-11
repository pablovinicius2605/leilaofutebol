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

// Constantes de Regras do Elenco
const SQUAD_LIMITS = { "Goleiro": 1, "Meia/Ponta": 2, "Atacante": 1 };

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
                settings: {
                    startingMoney: 50, // Fixado em 50 moedas
                    auctionTime: parseInt(data.auctionTime) || 15,
                    maxPlayers: parseInt(data.maxPlayers) || 8
                },
                players: {},
                auctionQueue: [...normalPlayers].sort(() => 0.5 - Math.random()), 
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
            id: socket.id,
            name: playerName.substring(0, 15),
            balance: room.settings.startingMoney,
            squad: [],
            ready: room.hostId === socket.id 
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

        io.to(roomCode).emit('newBid', { amount: bidAmount, bidderName: player.name, bidderId: socket.id });
    });

    // SISTEMA DE DESISTÊNCIA
    socket.on('foldBid', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'game' || !room.currentAuction) return;
        
        if (!room.currentAuction.folded.includes(socket.id)) {
            room.currentAuction.folded.push(socket.id);
            const playerName = room.players[socket.id].name;
            io.to(roomCode).emit('playerFolded', { playerName });
            io.to(roomCode).emit('chatMessage', { sender: 'SISTEMA', message: `${playerName} desistiu do lance.`, isSystem: true });
        }
    });

    socket.on('chatMessage', ({ roomCode, message }) => {
        const room = rooms[roomCode];
        if (room && room.players[socket.id] && message.trim().length > 0) {
            io.to(roomCode).emit('chatMessage', { sender: room.players[socket.id].name, message: message.substring(0, 100) });
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                if (room.hostId === socket.id) {
                    const remainingPlayers = Object.keys(room.players);
                    if (remainingPlayers.length > 0) {
                        room.hostId = remainingPlayers[0];
                    } else {
                        clearInterval(room.timer);
                        delete rooms[roomCode];
                        continue;
                    }
                }
                io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players) });
                io.to(roomCode).emit('updateState', { players: Object.values(room.players) });
            }
        }
    });

    function checkGameOverAndFill(roomCode) {
        const room = rooms[roomCode];
        const playersArr = Object.values(room.players);
        
        // Verifica se TODOS os jogadores estão com elenco cheio (4 jogadores) ou se acabaram os jogadores
        const allFull = playersArr.every(p => p.squad.length >= 4);
        
        if (room.auctionQueue.length === 0 || allFull) {
            // Fim de jogo: Preencher times incompletos com memes
            playersArr.forEach(p => {
                ['Goleiro', 'Meia/Ponta', 'Atacante'].forEach(pos => {
                    const currentCount = p.squad.filter(x => x.position === pos).length;
                    const needed = SQUAD_LIMITS[pos] - currentCount;
                    
                    if (needed > 0) {
                        const availableMemes = memePlayers.filter(m => m.position === pos);
                        for(let i=0; i<needed; i++) {
                            // Pega um meme aleatório da posição
                            const meme = availableMemes[Math.floor(Math.random() * availableMemes.length)];
                            p.squad.push({...meme, isMeme: true}); // Adiciona sem cobrar nada
                        }
                    }
                });
            });

            room.status = 'finished';
            io.to(roomCode).emit('updateState', { players: Object.values(room.players) });
            io.to(roomCode).emit('gameOver', Object.values(room.players));
            return true;
        }
        return false;
    }

    function startNextAuction(roomCode) {
        const room = rooms[roomCode];
        
        if (checkGameOverAndFill(roomCode)) return;

        const playerToAuction = room.auctionQueue.pop();
        
        // Se a posição sorteada já estiver cheia para TODOS os jogadores da sala, pula o jogador
        const isUselessPlayer = Object.values(room.players).every(p => isPositionFull(p, playerToAuction.position));
        if (isUselessPlayer) {
            return startNextAuction(roomCode); // Pula direto
        }

        room.currentAuction = {
            player: playerToAuction,
            currentBid: 0, // Inicia sem lance (valor 0)
            highestBidderId: null,
            highestBidderName: "Ninguém",
            timeLeft: room.settings.auctionTime,
            folded: [] // IDs de quem desistiu
        };

        io.to(roomCode).emit('auctionStart', {
            auctionInfo: room.currentAuction,
            playersState: Object.values(room.players)
        });

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
            
            io.to(roomCode).emit('auctionResult', {
                sold: true,
                winnerName: winner.name,
                amount: auction.currentBid,
                player: auction.player
            });
        } else {
            io.to(roomCode).emit('auctionResult', { sold: false, player: auction.player });
        }

        setTimeout(() => startNextAuction(roomCode), 4000);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { console.log(`[ON] Servidor rodando na porta ${PORT}`); });
