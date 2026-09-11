const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const playersDB = require('./players');

const app = express();
const server = http.createServer(app);

// Middlewares de Segurança e CORS
app.use(helmet({
    contentSecurityPolicy: false, // Desativado para permitir CDNs (SweetAlert, Google Fonts, etc)
}));
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexões de qualquer origem no Render
        methods: ["GET", "POST"]
    }
});

// Estado global em memória
const rooms = {};

// Funções Auxiliares
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

io.on('connection', (socket) => {
    console.log(`[+] Jogador conectado: ${socket.id}`);

    // CRIAR SALA
    socket.on('createRoom', (data) => {
        try {
            const roomCode = generateRoomCode();
            rooms[roomCode] = {
                id: roomCode,
                password: data.password || "",
                hostId: socket.id,
                status: 'lobby',
                settings: {
                    startingMoney: parseInt(data.startingMoney) || 100,
                    auctionTime: parseInt(data.auctionTime) || 15,
                    maxPlayers: parseInt(data.maxPlayers) || 8
                },
                players: {},
                auctionQueue: [...playersDB].sort(() => 0.5 - Math.random()), 
                currentAuction: null,
                timer: null
            };

            joinRoomEngine(socket, roomCode, data.playerName);
            socket.emit('roomCreated', roomCode);
            console.log(`[!] Sala criada: ${roomCode} por ${data.playerName}`);
        } catch (error) {
            socket.emit('error', 'Erro ao criar a sala.');
        }
    });

    // ENTRAR NA SALA
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
            name: playerName.substring(0, 15), // Limita nome
            balance: room.settings.startingMoney,
            squad: [],
            ready: room.hostId === socket.id 
        };

        io.to(roomCode).emit('updateLobby', {
            roomCode,
            hostId: room.hostId,
            players: Object.values(room.players),
            settings: room.settings
        });
    }

    // TOGGLE READY
    socket.on('toggleReady', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players[socket.id]) {
            room.players[socket.id].ready = !room.players[socket.id].ready;
            io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players) });
        }
    });

    // INICIAR PARTIDA
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

    // LANCES
    socket.on('placeBid', ({ roomCode, amount }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'game' || !room.currentAuction) return;

        const player = room.players[socket.id];
        const auction = room.currentAuction;
        const bidAmount = parseInt(amount);

        if (isNaN(bidAmount)) return socket.emit('error', 'Lance inválido.');
        if (player.balance < bidAmount) return socket.emit('error', 'Saldo insuficiente.');
        if (bidAmount <= auction.currentBid) return socket.emit('error', `O lance deve ser maior que €${auction.currentBid}M.`);
        if (auction.highestBidderId === socket.id) return socket.emit('error', 'Você já é o dono do maior lance.');

        auction.currentBid = bidAmount;
        auction.highestBidderId = socket.id;
        auction.highestBidderName = player.name;

        io.to(roomCode).emit('newBid', {
            amount: bidAmount,
            bidderName: player.name,
            bidderId: socket.id
        });
    });

    // CHAT
    socket.on('chatMessage', ({ roomCode, message }) => {
        const room = rooms[roomCode];
        if (room && room.players[socket.id] && message.trim().length > 0) {
            io.to(roomCode).emit('chatMessage', {
                sender: room.players[socket.id].name,
                message: message.substring(0, 100) // Evita spam
            });
        }
    });

    // DESCONEXÃO E LIMPEZA
    socket.on('disconnect', () => {
        console.log(`[-] Jogador desconectado: ${socket.id}`);
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
                        console.log(`[!] Sala destruída: ${roomCode}`);
                        continue;
                    }
                }
                
                io.to(roomCode).emit('updateLobby', { roomCode, hostId: room.hostId, players: Object.values(room.players) });
                io.to(roomCode).emit('updateState', { players: Object.values(room.players) });
            }
        }
    });

    // LÓGICA DO LEILÃO
    function startNextAuction(roomCode) {
        const room = rooms[roomCode];
        if (room.auctionQueue.length === 0) {
            room.status = 'finished';
            return io.to(roomCode).emit('gameOver', Object.values(room.players));
        }

        const playerToAuction = room.auctionQueue.pop();
        room.currentAuction = {
            player: playerToAuction,
            currentBid: playerToAuction.startingBid,
            highestBidderId: null,
            highestBidderName: "Ninguém",
            timeLeft: room.settings.auctionTime
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

        setTimeout(() => startNextAuction(roomCode), 5000);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ON] Servidor rodando na porta ${PORT}`);
});
