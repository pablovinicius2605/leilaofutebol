const normalPlayers = [
    // Goleiros
    { id: 1, name: "Alisson Becker", position: "Goleiro", nationality: "Brasil", club: "Liverpool", overall: 89, age: 31, image: "https://ui-avatars.com/api/?name=Alisson+B&background=1a1c23&color=00ff88&size=200" },
    { id: 2, name: "Ederson", position: "Goleiro", nationality: "Brasil", club: "Man City", overall: 88, age: 30, image: "https://ui-avatars.com/api/?name=Ederson&background=1a1c23&color=00ff88&size=200" },
    { id: 3, name: "Thibaut Courtois", position: "Goleiro", nationality: "Bélgica", club: "Real Madrid", overall: 90, age: 31, image: "https://ui-avatars.com/api/?name=Courtois&background=1a1c23&color=00ff88&size=200" },
    { id: 4, name: "Dibu Martínez", position: "Goleiro", nationality: "Argentina", club: "Aston Villa", overall: 86, age: 31, image: "https://ui-avatars.com/api/?name=Dibu+M&background=1a1c23&color=00ff88&size=200" },
    
    // Meias/Pontas
    { id: 5, name: "Vinícius Júnior", position: "Meia/Ponta", nationality: "Brasil", club: "Real Madrid", overall: 90, age: 23, image: "https://ui-avatars.com/api/?name=Vini+Jr&background=1a1c23&color=00ff88&size=200" },
    { id: 6, name: "Kevin De Bruyne", position: "Meia/Ponta", nationality: "Bélgica", club: "Man City", overall: 91, age: 32, image: "https://ui-avatars.com/api/?name=De+Bruyne&background=1a1c23&color=00ff88&size=200" },
    { id: 7, name: "Jude Bellingham", position: "Meia/Ponta", nationality: "Inglaterra", club: "Real Madrid", overall: 87, age: 20, image: "https://ui-avatars.com/api/?name=Jude+B&background=1a1c23&color=00ff88&size=200" },
    { id: 8, name: "Rodrygo", position: "Meia/Ponta", nationality: "Brasil", club: "Real Madrid", overall: 85, age: 23, image: "https://ui-avatars.com/api/?name=Rodrygo&background=1a1c23&color=00ff88&size=200" },
    { id: 9, name: "Bukayo Saka", position: "Meia/Ponta", nationality: "Inglaterra", club: "Arsenal", overall: 86, age: 22, image: "https://ui-avatars.com/api/?name=Saka&background=1a1c23&color=00ff88&size=200" },
    { id: 10, name: "Phil Foden", position: "Meia/Ponta", nationality: "Inglaterra", club: "Man City", overall: 86, age: 23, image: "https://ui-avatars.com/api/?name=Foden&background=1a1c23&color=00ff88&size=200" },
    { id: 11, name: "Rafael Leão", position: "Meia/Ponta", nationality: "Portugal", club: "Milan", overall: 86, age: 24, image: "https://ui-avatars.com/api/?name=Leao&background=1a1c23&color=00ff88&size=200" },
    { id: 12, name: "Bernardo Silva", position: "Meia/Ponta", nationality: "Portugal", club: "Man City", overall: 88, age: 29, image: "https://ui-avatars.com/api/?name=Bernardo&background=1a1c23&color=00ff88&size=200" },

    // Atacantes
    { id: 13, name: "Erling Haaland", position: "Atacante", nationality: "Noruega", club: "Man City", overall: 91, age: 23, image: "https://ui-avatars.com/api/?name=Haaland&background=1a1c23&color=00ff88&size=200" },
    { id: 14, name: "Kylian Mbappé", position: "Atacante", nationality: "França", club: "PSG", overall: 91, age: 25, image: "https://ui-avatars.com/api/?name=Mbappe&background=1a1c23&color=00ff88&size=200" },
    { id: 15, name: "Harry Kane", position: "Atacante", nationality: "Inglaterra", club: "Bayern", overall: 90, age: 30, image: "https://ui-avatars.com/api/?name=Kane&background=1a1c23&color=00ff88&size=200" },
    { id: 16, name: "Robert Lewandowski", position: "Atacante", nationality: "Polônia", club: "Barcelona", overall: 89, age: 35, image: "https://ui-avatars.com/api/?name=Lewa&background=1a1c23&color=00ff88&size=200" },
    { id: 17, name: "Victor Osimhen", position: "Atacante", nationality: "Nigéria", club: "Napoli", overall: 88, age: 25, image: "https://ui-avatars.com/api/?name=Osimhen&background=1a1c23&color=00ff88&size=200" }
];

const memePlayers = [
    { id: 901, name: "Alex Muralha", position: "Goleiro", nationality: "Brasil", club: "Livre", overall: 45, age: 34, image: "https://ui-avatars.com/api/?name=Muralha&background=ff4444&color=fff&size=200" },
    { id: 902, name: "Hugo Neneca", position: "Goleiro", nationality: "Brasil", club: "Livre", overall: 55, age: 25, image: "https://ui-avatars.com/api/?name=Neneca&background=ff4444&color=fff&size=200" },
    { id: 903, name: "Mauro Shampoo", position: "Meia/Ponta", nationality: "Brasil", club: "Íbis", overall: 15, age: 67, image: "https://ui-avatars.com/api/?name=Shampoo&background=ff4444&color=fff&size=200" },
    { id: 904, name: "Luan (Rei)", position: "Meia/Ponta", nationality: "Brasil", club: "Livre", overall: 30, age: 31, image: "https://ui-avatars.com/api/?name=Luan&background=ff4444&color=fff&size=200" },
    { id: 905, name: "Lucas Lima", position: "Meia/Ponta", nationality: "Brasil", club: "Sport", overall: 40, age: 33, image: "https://ui-avatars.com/api/?name=L+Lima&background=ff4444&color=fff&size=200" },
    { id: 906, name: "Flávio Caça-Rato", position: "Atacante", nationality: "Brasil", club: "Íbis", overall: 25, age: 37, image: "https://ui-avatars.com/api/?name=Caca+Rato&background=ff4444&color=fff&size=200" },
    { id: 907, name: "Ribamar", position: "Atacante", nationality: "Brasil", club: "Náutico", overall: 35, age: 27, image: "https://ui-avatars.com/api/?name=Ribamar&background=ff4444&color=fff&size=200" },
    { id: 908, name: "Yuri Alberto", position: "Atacante", nationality: "Brasil", club: "Corinthians", overall: 35, age: 23, image: "https://ui-avatars.com/api/?name=Yuri+A&background=ff4444&color=fff&size=200" }
];

module.exports = { normalPlayers, memePlayers };
