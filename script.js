document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const progressBar = document.getElementById('progress-bar');
    const volumeBar = document.getElementById('volume-bar');
    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time');
    const currentTrackTitle = document.getElementById('current-track-title');
    const musicList = document.getElementById('music-list');
    const musicCount = document.getElementById('music-count');
    const ipConfigLink = document.getElementById('ip-config-link');
    const ipConfigModal = document.getElementById('ip-config-modal');
    const closeModalButton = document.getElementById('close-modal');
    const ipUrlInput = document.getElementById('ip-url-input');
    const connectIpButton = document.getElementById('connect-ip-button');
    const ipStatusMessage = document.getElementById('ip-status-message');
    const searchInput = document.getElementById('search-input');
    const navItems = document.querySelectorAll('.nav-item');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const fullScreenLoader = document.getElementById('fullScreenLoader');

    let isPlaying = false;
    let currentTrackData = null;
    let musicIP = localStorage.getItem('musicIP');
    let allMusicData = [];

    // --- Funções de Controle da UI (Incluindo o Loader) ---

    const toggleFullScreenLoading = (isLoading) => {
        if (isLoading) {
            fullScreenLoader.classList.remove('loader-hidden');
        } else {
            setTimeout(() => {
                fullScreenLoader.classList.add('loader-hidden');
            }, 300); 
        }
    };

    function renderMessage(message) {
        musicList.innerHTML = `<li class="nav-message">${message}</li>`;
        musicCount.textContent = '0 músicas';
    }

    // --- Funções de persistência de dados (localStorage) ---
    function loadFromLocalStorage(key, defaultValue = {}) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Erro ao carregar dados do ${key}:`, e);
            return defaultValue;
        }
    }

    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Erro ao salvar dados no ${key}:`, e);
        }
    }

    function getFavorites() {
        return loadFromLocalStorage('favorites', []);
    }

    function toggleFavorite(songId) {
        let favorites = getFavorites();
        const index = favorites.indexOf(songId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(songId);
        }
        saveToLocalStorage('favorites', favorites);
        return favorites;
    }

    function getHistory() {
        return loadFromLocalStorage('history', []);
    }

    function updateHistory(songId) {
        let history = getHistory();
        const index = history.indexOf(songId);
        if (index > -1) {
            history.splice(index, 1);
        }
        history.unshift(songId);
        history = history.slice(0, 50);
        saveToLocalStorage('history', history);
    }

    function getPlayCounts() {
        return loadFromLocalStorage('playCounts', {});
    }

    function updatePlayCount(songId) {
        let playCounts = getPlayCounts();
        playCounts[songId] = (playCounts[songId] || 0) + 1;
        saveToLocalStorage('playCounts', playCounts);
    }

    // --- Funções do Player de Música ---
    function togglePlayPause() {
        if (!audioPlayer.src) return;
        if (isPlaying) {
            audioPlayer.pause();
            playPauseButton.textContent = 'play_arrow';
        } else {
            audioPlayer.play();
            playPauseButton.textContent = 'pause';
        }
        isPlaying = !isPlaying;
    }

    function updateProgressBar() {
        const { currentTime, duration } = audioPlayer;
        progressBar.value = (currentTime / duration) * 100 || 0;
        currentTimeSpan.textContent = formatTime(currentTime);
        totalTimeSpan.textContent = formatTime(duration);
    }

    function seek() {
        const seekTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
    }

    function setVolume() {
        audioPlayer.volume = volumeBar.value / 100;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    function loadTrack(trackElement) {
        const id = trackElement.dataset.id;
        const src = trackElement.dataset.src;
        const title = trackElement.dataset.title;
        const artist = trackElement.dataset.artist;
        const duration = trackElement.dataset.duration;

        currentTrackData = { id, src, title, artist, duration };

        audioPlayer.src = src;
        currentTrackTitle.textContent = `${title} - ${artist}`;
        totalTimeSpan.textContent = duration;

        progressBar.value = 0;
        currentTimeSpan.textContent = '0:00';

        if (id) {
            updateHistory(id);
            updatePlayCount(id);
        }
    }

    // --- Event Listeners do Player ---
    playPauseButton.addEventListener('click', togglePlayPause);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    progressBar.addEventListener('input', seek);
    volumeBar.addEventListener('input', setVolume);
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        playPauseButton.textContent = 'play_arrow';
    });

    audioPlayer.volume = volumeBar.value / 100;

    // --- Menu Toggle (Corrigido para Mobile) ---
    function toggleSidebar() {
        if (window.innerWidth <= 900) {
            // Modo Mobile/Tablet: Usa a classe 'open' para deslizar o menu
            sidebar.classList.toggle('open');
            // Muda o ícone do menu
            const icon = menuToggle.querySelector('.material-icons');
            icon.textContent = sidebar.classList.contains('open') ? 'close' : 'menu';
        } else {
            // Modo Desktop: Usa a classe 'collapsed' para encolher
            sidebar.classList.toggle('collapsed');
        }
    }

    menuToggle.addEventListener('click', toggleSidebar);

    // Fecha o menu quando clicar em um item de navegação (mobile)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                const icon = menuToggle.querySelector('.material-icons');
                icon.textContent = 'menu';
            }
        });
    });

    // Fecha o menu quando clicar fora dele (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
            const icon = menuToggle.querySelector('.material-icons');
            icon.textContent = 'menu';
        }
    });

    // --- Configuração do IP (Modal) ---
    ipConfigLink.addEventListener('click', (e) => {
        e.preventDefault();
        ipConfigModal.style.display = 'flex';
        ipUrlInput.value = musicIP || '';
        ipStatusMessage.textContent = '';
    });

    closeModalButton.addEventListener('click', () => {
        ipConfigModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === ipConfigModal) {
            ipConfigModal.style.display = 'none';
        }
    });

    function juntarUrl(base, relativo) {
        try {
            return new URL(relativo, base).href;
        } catch {
            return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
        }
    }

    async function buscarJSON(url) {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        return resposta.json();
    }

    connectIpButton.addEventListener('click', async () => {
        const newIP = ipUrlInput.value.trim().replace(/\/$/, '');
        if (!newIP) {
            ipStatusMessage.textContent = 'Por favor, insira um IP válido.';
            return;
        }

        ipStatusMessage.textContent = 'Conectando…';
        try {
            const saude = await buscarJSON(juntarUrl(newIP, '/api/saude'));
            if (saude.status === "ok") {
                musicIP = newIP;
                localStorage.setItem('musicIP', musicIP);
                ipStatusMessage.textContent = 'Conectado com sucesso!';
                ipStatusMessage.style.color = 'lime';
                setTimeout(() => {
                    ipConfigModal.style.display = 'none';
                    fetchMusicData(musicIP);
                }, 1000);
            } else {
                throw new Error('Falha na resposta do servidor.');
            }
        } catch (error) {
            ipStatusMessage.textContent = `Falha ao conectar. Verifique o IP. Erro: ${error.message}`;
            ipStatusMessage.style.color = 'red';
            console.error(error);
        }
    });

    // --- Gerenciar Navegação e Feedback Visual ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const sectionId = item.id;
            switch (sectionId) {
                case 'discover-link':
                    fetchMusicData(musicIP);
                    break;
                case 'library-link':
                    showLibrary();
                    break;
                case 'top-tracks-link':
                    showTopTracks();
                    break;
                case 'history-link':
                    showHistory();
                    break;
                case 'ip-config-link':
                    break;
                default:
                    renderMessage('Navegação não implementada');
            }
        });
    });

    function showLibrary() {
        const favorites = getFavorites();
        const favoriteSongs = allMusicData.filter(song => favorites.includes(song.id));
        if (favoriteSongs.length === 0) {
            renderMessage('Sua biblioteca está vazia. Curta uma música para adicioná-la.');
        } else {
            renderMusicList(favoriteSongs, 'library');
        }
    }

    function showTopTracks() {
        const playCounts = getPlayCounts();
        const topSongs = allMusicData.filter(song => (playCounts[song.id] || 0) >= 8);
        const sortedSongs = [...topSongs].sort((a, b) => {
            const countA = playCounts[a.id] || 0;
            const countB = playCounts[b.id] || 0;
            return countB - countA;
        });
        if (sortedSongs.length === 0) {
            renderMessage('Nenhuma música foi tocada 8 vezes ou mais ainda.');
        } else {
            renderMusicList(sortedSongs, 'top_tracks');
        }
    }

    function showHistory() {
        const historyIds = getHistory();
        const historySongs = historyIds.map(id => allMusicData.find(song => song.id === id)).filter(song => song);
        if (historySongs.length === 0) {
            renderMessage('Seu histórico de faixas está vazio. Comece a ouvir para preenchê-lo!');
        } else {
            renderMusicList(historySongs, 'history');
        }
    }

    // --- Carregamento e Interação com a Lista de Músicas ---
    async function fetchMusicData(ip) {
        if (!ip) {
            renderMessage('Por favor, adicione um IP para carregar as músicas.');
            return;
        }
        
        toggleFullScreenLoading(true);

        try {
            const musicas = await buscarJSON(juntarUrl(ip, '/api/musicas'));
            if (!Array.isArray(musicas)) {
                throw new Error('Formato de dados de música incorreto.');
            }
            allMusicData = musicas.map((music, index) => ({
                id: music.id || index,
                src: juntarUrl(ip, music.url),
                title: music.title || '(Sem título)',
                artist: music.artist || 'Desconhecido',
                duration: music.duration
            }));
            renderMusicList(allMusicData, 'discover');

            if (allMusicData.length > 0) {
                const firstTrackElement = musicList.querySelector('.music-item');
                if (firstTrackElement) {
                    loadTrack(firstTrackElement);
                }
            }
        } catch (error) {
            console.error("Não foi possível carregar as músicas do IP:", error);
            musicList.innerHTML = `<li class="nav-message" style="color: red;">Não foi possível carregar as músicas. Verifique a URL do IP e o servidor.</li>`;
            musicCount.textContent = '0 músicas';
        } finally {
            toggleFullScreenLoading(false);
        }
    }

    function renderMusicList(musics, view) {
        musicList.innerHTML = '';
        musicCount.textContent = `${musics.length} músicas`;
        const favorites = getFavorites();
        const playCounts = getPlayCounts();
        
        musics.forEach((music, index) => {
            const isFavorited = favorites.includes(music.id);
            const playCount = playCounts[music.id] || 0;
            const li = document.createElement('li');
            li.classList.add('music-item');
            li.dataset.id = music.id;
            li.dataset.src = music.src;
            li.dataset.title = music.title || '(Sem título)';
            li.dataset.artist = music.artist || 'Desconhecido';
            li.dataset.duration = music.duration;
            li.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <div class="track-details">
                    <span class="track-title">${music.title}</span>
                    <span class="track-artist">${music.artist}</span>
                </div>
                <div class="track-extra-info">
                    <span class="track-duration">${music.duration}</span>
                    ${view === 'top_tracks' ? `<span class="play-count"> | ${playCount} plays</span>` : ''}
                </div>
                <span class="material-icons favorite-icon ${isFavorited ? 'favorited' : ''}">
                    ${isFavorited ? 'favorite' : 'favorite_border'}
                </span>
            `;
            musicList.appendChild(li);

            li.addEventListener('click', () => {
                loadTrack(li);
                audioPlayer.play();
                isPlaying = true;
                playPauseButton.textContent = 'pause';
            });

            const favoriteIcon = li.querySelector('.favorite-icon');
            favoriteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(music.id);
                favoriteIcon.classList.toggle('favorited');
                favoriteIcon.textContent = favoriteIcon.classList.contains('favorited') ? 'favorite' : 'favorite_border';
            });
        });
    }

    // --- Funcionalidade de Pesquisa ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMusic = allMusicData.filter(music =>
            (music.title && music.title.toLowerCase().includes(searchTerm)) ||
            (music.artist && music.artist.toLowerCase().includes(searchTerm))
        );
        renderMusicList(filteredMusic, 'discover');
    });

    // --- Inicialização ---
    fetchMusicData(musicIP);
});

