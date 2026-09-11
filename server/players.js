const normalPlayers = [
    // Goleiros
    { id: 1, name: "Alisson Becker", position: "Goleiro", nationality: "Brasil", club: "Liverpool", overall: 89, age: 31, image: "https://ui-avatars.com/api/?name=Alisson&background=0b132b&color=ffd700&size=200" },
    { id: 2, name: "Ederson", position: "Goleiro", nationality: "Brasil", club: "Man City", overall: 88, age: 30, image: "https://ui-avatars.com/api/?name=Ederson&background=0b132b&color=ffd700&size=200" },
    { id: 3, name: "Thibaut Courtois", position: "Goleiro", nationality: "Bélgica", club: "Real Madrid", overall: 90, age: 31, image: "https://ui-avatars.com/api/?name=Courtois&background=0b132b&color=ffd700&size=200" },
    { id: 4, name: "Dibu Martínez", position: "Goleiro", nationality: "Argentina", club: "Aston Villa", overall: 86, age: 31, image: "https://ui-avatars.com/api/?name=Martinez&background=0b132b&color=ffd700&size=200" },
    { id: 5, name: "Jan Oblak", position: "Goleiro", nationality: "Eslovênia", club: "Atlético Madrid", overall: 88, age: 31, image: "https://ui-avatars.com/api/?name=Oblak&background=0b132b&color=ffd700&size=200" },
    { id: 6, name: "Ter Stegen", position: "Goleiro", nationality: "Alemanha", club: "Barcelona", overall: 89, age: 31, image: "https://ui-avatars.com/api/?name=Ter+Stegen&background=0b132b&color=ffd700&size=200" },
    { id: 7, name: "Donnarumma", position: "Goleiro", nationality: "Itália", club: "PSG", overall: 87, age: 25, image: "https://ui-avatars.com/api/?name=Donnarumma&background=0b132b&color=ffd700&size=200" },
    { id: 8, name: "Mike Maignan", position: "Goleiro", nationality: "França", club: "Milan", overall: 87, age: 28, image: "https://ui-avatars.com/api/?name=Maignan&background=0b132b&color=ffd700&size=200" },

    // Zagueiros
    { id: 9, name: "Virgil van Dijk", position: "Zagueiro", nationality: "Holanda", club: "Liverpool", overall: 89, age: 32, image: "https://ui-avatars.com/api/?name=Van+Dijk&background=0b132b&color=ffd700&size=200" },
    { id: 10, name: "Rúben Dias", position: "Zagueiro", nationality: "Portugal", club: "Man City", overall: 89, age: 26, image: "https://ui-avatars.com/api/?name=Ruben+Dias&background=0b132b&color=ffd700&size=200" },
    { id: 11, name: "Marquinhos", position: "Zagueiro", nationality: "Brasil", club: "PSG", overall: 87, age: 29, image: "https://ui-avatars.com/api/?name=Marquinhos&background=0b132b&color=ffd700&size=200" },
    { id: 12, name: "Antonio Rüdiger", position: "Zagueiro", nationality: "Alemanha", club: "Real Madrid", overall: 88, age: 31, image: "https://ui-avatars.com/api/?name=Rudiger&background=0b132b&color=ffd700&size=200" },
    { id: 13, name: "William Saliba", position: "Zagueiro", nationality: "França", club: "Arsenal", overall: 86, age: 23, image: "https://ui-avatars.com/api/?name=Saliba&background=0b132b&color=ffd700&size=200" },
    { id: 14, name: "Ronald Araujo", position: "Zagueiro", nationality: "Uruguai", club: "Barcelona", overall: 86, age: 25, image: "https://ui-avatars.com/api/?name=Araujo&background=0b132b&color=ffd700&size=200" },
    { id: 15, name: "Éder Militão", position: "Zagueiro", nationality: "Brasil", club: "Real Madrid", overall: 86, age: 26, image: "https://ui-avatars.com/api/?name=Militao&background=0b132b&color=ffd700&size=200" },
    { id: 16, name: "Alessandro Bastoni", position: "Zagueiro", nationality: "Itália", club: "Inter", overall: 86, age: 25, image: "https://ui-avatars.com/api/?name=Bastoni&background=0b132b&color=ffd700&size=200" },
    { id: 17, name: "Matthijs de Ligt", position: "Zagueiro", nationality: "Holanda", club: "Bayern", overall: 86, age: 24, image: "https://ui-avatars.com/api/?name=De+Ligt&background=0b132b&color=ffd700&size=200" },
    { id: 18, name: "Cristian Romero", position: "Zagueiro", nationality: "Argentina", club: "Tottenham", overall: 85, age: 26, image: "https://ui-avatars.com/api/?name=Romero&background=0b132b&color=ffd700&size=200" },

    // Meias/Pontas
    { id: 19, name: "Vinícius Júnior", position: "Meia/Ponta", nationality: "Brasil", club: "Real Madrid", overall: 90, age: 23, image: "https://ui-avatars.com/api/?name=Vini+Jr&background=0b132b&color=ffd700&size=200" },
    { id: 20, name: "Kevin De Bruyne", position: "Meia/Ponta", nationality: "Bélgica", club: "Man City", overall: 91, age: 32, image: "https://ui-avatars.com/api/?name=De+Bruyne&background=0b132b&color=ffd700&size=200" },
    { id: 21, name: "Jude Bellingham", position: "Meia/Ponta", nationality: "Inglaterra", club: "Real Madrid", overall: 88, age: 20, image: "https://ui-avatars.com/api/?name=Jude+B&background=0b132b&color=ffd700&size=200" },
    { id: 22, name: "Rodrygo", position: "Meia/Ponta", nationality: "Brasil", club: "Real Madrid", overall: 86, age: 23, image: "https://ui-avatars.com/api/?name=Rodrygo&background=0b132b&color=ffd700&size=200" },
    { id: 23, name: "Bukayo Saka", position: "Meia/Ponta", nationality: "Inglaterra", club: "Arsenal", overall: 87, age: 22, image: "https://ui-avatars.com/api/?name=Saka&background=0b132b&color=ffd700&size=200" },
    { id: 24, name: "Phil Foden", position: "Meia/Ponta", nationality: "Inglaterra", club: "Man City", overall: 87, age: 23, image: "https://ui-avatars.com/api/?name=Foden&background=0b132b&color=ffd700&size=200" },
    { id: 25, name: "Rafael Leão", position: "Meia/Ponta", nationality: "Portugal", club: "Milan", overall: 86, age: 24, image: "https://ui-avatars.com/api/?name=Leao&background=0b132b&color=ffd700&size=200" },
    { id: 26, name: "Bernardo Silva", position: "Meia/Ponta", nationality: "Portugal", club: "Man City", overall: 88, age: 29, image: "https://ui-avatars.com/api/?name=Bernardo&background=0b132b&color=ffd700&size=200" },
    { id: 27, name: "Mohamed Salah", position: "Meia/Ponta", nationality: "Egito", club: "Liverpool", overall: 89, age: 31, image: "https://ui-avatars.com/api/?name=Salah&background=0b132b&color=ffd700&size=200" },
    { id: 28, name: "Martin Odegaard", position: "Meia/Ponta", nationality: "Noruega", club: "Arsenal", overall: 87, age: 25, image: "https://ui-avatars.com/api/?name=Odegaard&background=0b132b&color=ffd700&size=200" },
    { id: 29, name: "Jamal Musiala", position: "Meia/Ponta", nationality: "Alemanha", club: "Bayern", overall: 87, age: 21, image: "https://ui-avatars.com/api/?name=Musiala&background=0b132b&color=ffd700&size=200" },
    { id: 30, name: "Florian Wirtz", position: "Meia/Ponta", nationality: "Alemanha", club: "Leverkusen", overall: 87, age: 21, image: "https://ui-avatars.com/api/?name=Wirtz&background=0b132b&color=ffd700&size=200" },
    { id: 31, name: "Fede Valverde", position: "Meia/Ponta", nationality: "Uruguai", club: "Real Madrid", overall: 88, age: 25, image: "https://ui-avatars.com/api/?name=Valverde&background=0b132b&color=ffd700&size=200" },
    { id: 32, name: "Bruno Fernandes", position: "Meia/Ponta", nationality: "Portugal", club: "Man Utd", overall: 88, age: 29, image: "https://ui-avatars.com/api/?name=B+Fernandes&background=0b132b&color=ffd700&size=200" },

    // Atacantes
    { id: 33, name: "Erling Haaland", position: "Atacante", nationality: "Noruega", club: "Man City", overall: 91, age: 23, image: "https://ui-avatars.com/api/?name=Haaland&background=0b132b&color=ffd700&size=200" },
    { id: 34, name: "Kylian Mbappé", position: "Atacante", nationality: "França", club: "Real Madrid", overall: 91, age: 25, image: "https://ui-avatars.com/api/?name=Mbappe&background=0b132b&color=ffd700&size=200" },
    { id: 35, name: "Harry Kane", position: "Atacante", nationality: "Inglaterra", club: "Bayern", overall: 90, age: 30, image: "https://ui-avatars.com/api/?name=Kane&background=0b132b&color=ffd700&size=200" },
    { id: 36, name: "Robert Lewandowski", position: "Atacante", nationality: "Polônia", club: "Barcelona", overall: 89, age: 35, image: "https://ui-avatars.com/api/?name=Lewa&background=0b132b&color=ffd700&size=200" },
    { id: 37, name: "Victor Osimhen", position: "Atacante", nationality: "Nigéria", club: "Napoli", overall: 88, age: 25, image: "https://ui-avatars.com/api/?name=Osimhen&background=0b132b&color=ffd700&size=200" },
    { id: 38, name: "Lautaro Martínez", position: "Atacante", nationality: "Argentina", club: "Inter", overall: 88, age: 26, image: "https://ui-avatars.com/api/?name=Lautaro&background=0b132b&color=ffd700&size=200" },
    { id: 39, name: "Julián Álvarez", position: "Atacante", nationality: "Argentina", club: "Man City", overall: 86, age: 24, image: "https://ui-avatars.com/api/?name=Alvarez&background=0b132b&color=ffd700&size=200" },
    { id: 40, name: "Antoine Griezmann", position: "Atacante", nationality: "França", club: "Atlético Madrid", overall: 88, age: 33, image: "https://ui-avatars.com/api/?name=Griezmann&background=0b132b&color=ffd700&size=200" },
    { id: 41, name: "Alexander Isak", position: "Atacante", nationality: "Suécia", club: "Newcastle", overall: 85, age: 24, image: "https://ui-avatars.com/api/?name=Isak&background=0b132b&color=ffd700&size=200" },
    { id: 42, name: "Dusan Vlahovic", position: "Atacante", nationality: "Sérvia", club: "Juventus", overall: 85, age: 24, image: "https://ui-avatars.com/api/?name=Vlahovic&background=0b132b&color=ffd700&size=200" },
    { id: 43, name: "Ollie Watkins", position: "Atacante", nationality: "Inglaterra", club: "Aston Villa", overall: 85, age: 28, image: "https://ui-avatars.com/api/?name=Watkins&background=0b132b&color=ffd700&size=200" }
];

const memePlayers = [
    { id: 901, name: "Alex Muralha", position: "Goleiro", nationality: "Brasil", club: "Livre", overall: 45, age: 34, image: "https://ui-avatars.com/api/?name=Muralha&background=ff4444&color=fff&size=200" },
    { id: 902, name: "Hugo Neneca", position: "Goleiro", nationality: "Brasil", club: "Livre", overall: 55, age: 25, image: "https://ui-avatars.com/api/?name=Neneca&background=ff4444&color=fff&size=200" },
    { id: 909, name: "Harry Maguire", position: "Zagueiro", nationality: "Inglaterra", club: "Man Utd", overall: 50, age: 31, image: "https://ui-avatars.com/api/?name=Maguire&background=ff4444&color=fff&size=200" },
    { id: 910, name: "Jemerson", position: "Zagueiro", nationality: "Brasil", club: "Livre", overall: 48, age: 31, image: "https://ui-avatars.com/api/?name=Jemerson&background=ff4444&color=fff&size=200" },
    { id: 903, name: "Mauro Shampoo", position: "Meia/Ponta", nationality: "Brasil", club: "Íbis", overall: 15, age: 67, image: "https://ui-avatars.com/api/?name=Shampoo&background=ff4444&color=fff&size=200" },
    { id: 904, name: "Luan (Rei)", position: "Meia/Ponta", nationality: "Brasil", club: "Livre", overall: 30, age: 31, image: "https://ui-avatars.com/api/?name=Luan&background=ff4444&color=fff&size=200" },
    { id: 905, name: "Lucas Lima", position: "Meia/Ponta", nationality: "Brasil", club: "Livre", overall: 40, age: 33, image: "https://ui-avatars.com/api/?name=L+Lima&background=ff4444&color=fff&size=200" },
    { id: 911, name: "Antony", position: "Meia/Ponta", nationality: "Brasil", club: "Man Utd", overall: 45, age: 24, image: "https://ui-avatars.com/api/?name=Antony&background=ff4444&color=fff&size=200" },
    { id: 906, name: "Flávio Caça-Rato", position: "Atacante", nationality: "Brasil", club: "Íbis", overall: 25, age: 37, image: "https://ui-avatars.com/api/?name=Caca+Rato&background=ff4444&color=fff&size=200" },
    { id: 907, name: "Ribamar", position: "Atacante", nationality: "Brasil", club: "Livre", overall: 35, age: 27, image: "https://ui-avatars.com/api/?name=Ribamar&background=ff4444&color=fff&size=200" },
    { id: 908, name: "Yuri Alberto", position: "Atacante", nationality: "Brasil", club: "Corinthians", overall: 35, age: 23, image: "https://ui-avatars.com/api/?name=Yuri+A&background=ff4444&color=fff&size=200" }
];
module.exports = { normalPlayers, memePlayers };
