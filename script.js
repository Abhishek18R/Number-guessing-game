// Game variables
let targetNumber;
let attempts = 0;
let gameTimer;
let timeElapsed = 0;
let soundEnabled = true;
let hintsRemaining = 3;
let gameMode = 'normal';
let isGameActive = false;

// Game settings
const difficulties = {
    easy: { min: 1, max: 50 },
    normal: { min: 1, max: 100 },
    hard: { min: 1, max: 200 },
    expert: { min: 1, max: 500 }
};

const gameModes = {
    normal: { attempts: Infinity, time: Infinity },
    timed: { attempts: Infinity, time: 60 },
    limited: { attempts: 10, time: Infinity }
};

// Sound effects
const sounds = {
    correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    wrong: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    hint: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3')
};

// DOM elements
const guessInput = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');
const message = document.getElementById('message');
const hint = document.getElementById('hint');
const newGameBtn = document.getElementById('newGameBtn');
const scoreList = document.getElementById('scoreList');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const soundBtn = document.getElementById('soundBtn');
const difficultySelect = document.getElementById('difficultySelect');
const gameModeSelect = document.getElementById('gameModeSelect');
const timerDisplay = document.getElementById('timerDisplay');
const attemptsLeft = document.getElementById('attemptsLeft');
const hintBtn = document.getElementById('hintBtn');
const rangeMessage = document.getElementById('rangeMessage');

// Load high scores from localStorage
let highScores = JSON.parse(localStorage.getItem('numberGameScores')) || [];

// Initialize the game
function initGame() {
    const difficulty = difficulties[difficultySelect.value];
    gameMode = gameModeSelect.value;
    
    targetNumber = Math.floor(Math.random() * (difficulty.max - difficulty.min + 1)) + difficulty.min;
    attempts = 0;
    timeElapsed = 0;
    hintsRemaining = 3;
    isGameActive = true;

    // Update range message
    updateRangeMessage();

    // Reset UI
    message.textContent = '';
    hint.textContent = '';
    guessInput.value = '';
    newGameBtn.classList.add('hidden');
    guessInput.disabled = false;
    guessBtn.disabled = false;
    message.className = '';
    hintBtn.textContent = `Use Hint (${hintsRemaining})`;
    
    // Setup game mode specific UI
    setupGameMode();
    
    // Update high scores display
    displayHighScores();
    
    // Focus input
    guessInput.focus();
}

function setupGameMode() {
    clearInterval(gameTimer);
    
    if (gameMode === 'timed') {
        timerDisplay.classList.remove('hidden');
        attemptsLeft.classList.add('hidden');
        timeElapsed = gameModes.timed.time;
        updateTimer();
        
        gameTimer = setInterval(() => {
            timeElapsed--;
            updateTimer();
            
            if (timeElapsed <= 0) {
                endGame(false);
            }
        }, 1000);
    } else if (gameMode === 'limited') {
        timerDisplay.classList.add('hidden');
        attemptsLeft.classList.remove('hidden');
        attemptsLeft.querySelector('span').textContent = gameModes.limited.attempts;
    } else {
        timerDisplay.classList.add('hidden');
        attemptsLeft.classList.add('hidden');
    }
}

function updateTimer() {
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timerDisplay.querySelector('span').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function useHint() {
    if (hintsRemaining <= 0) {
        showMessage('No hints remaining!', 'error');
        return;
    }

    hintsRemaining--;
    hintBtn.textContent = `Use Hint (${hintsRemaining})`;
    
    const range = Math.floor((difficulties[difficultySelect.value].max - difficulties[difficultySelect.value].min) / 10);
    const lowerBound = Math.max(difficulties[difficultySelect.value].min, targetNumber - range);
    const upperBound = Math.min(difficulties[difficultySelect.value].max, targetNumber + range);
    
    showMessage(`The number is between ${lowerBound} and ${upperBound}`, 'hint');
    playSound('hint');
}

function checkGuess() {
    if (!isGameActive) return;
    
    const userGuess = parseInt(guessInput.value);
    const difficulty = difficulties[difficultySelect.value];
    
    // Validate input
    if (isNaN(userGuess) || userGuess < difficulty.min || userGuess > difficulty.max) {
        showMessage(`Please enter a valid number between ${difficulty.min} and ${difficulty.max}`, 'error');
        return;
    }

    attempts++;
    
    // Update attempts left for limited mode
    if (gameMode === 'limited') {
        const remainingAttempts = gameModes.limited.attempts - attempts;
        attemptsLeft.querySelector('span').textContent = remainingAttempts;
        
        if (remainingAttempts <= 0 && userGuess !== targetNumber) {
            endGame(false);
            return;
        }
    }

    if (userGuess === targetNumber) {
        endGame(true);
    } else {
        // Provide hints
        showMessage('Wrong guess! Try again.', 'error');
        playSound('wrong');
        
        if (userGuess < targetNumber) {
            hint.textContent = `Hint: The number is higher than ${userGuess}`;
            if (targetNumber - userGuess <= 10) {
                hint.textContent += " (You're getting close!)";
            }
        } else {
            hint.textContent = `Hint: The number is lower than ${userGuess}`;
            if (userGuess - targetNumber <= 10) {
                hint.textContent += " (You're getting close!)";
            }
        }
    }
    
    guessInput.value = '';
    guessInput.focus();
}

function endGame(isWin) {
    isGameActive = false;
    clearInterval(gameTimer);
    
    if (isWin) {
        showMessage(`Congratulations! You've guessed the number in ${attempts} attempts!`, 'success');
        playSound('correct');
        document.querySelector('.container').classList.add('bounce');
        setTimeout(() => {
            document.querySelector('.container').classList.remove('bounce');
        }, 1000);
        
        // Update high scores
        updateHighScores({
            attempts,
            time: gameMode === 'timed' ? gameModes.timed.time - timeElapsed : null,
            mode: gameMode,
            difficulty: difficultySelect.value,
            date: new Date().toLocaleDateString()
        });
    } else {
        showMessage(`Game Over! The number was ${targetNumber}`, 'error');
        playSound('wrong');
    }
    
    guessInput.disabled = true;
    guessBtn.disabled = true;
    newGameBtn.classList.remove('hidden');
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
    message.style.animation = 'none';
    message.offsetHeight; // Trigger reflow
    message.style.animation = null;
}

function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(() => {}); // Ignore autoplay restrictions
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    soundBtn.innerHTML = soundEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
}

function toggleSettings() {
    settingsMenu.classList.toggle('hidden');
    settingsBtn.querySelector('i').classList.toggle('fa-spin');
}

// Update and save high scores
function updateHighScores(score) {
    let highScores = JSON.parse(localStorage.getItem('numberGameScores')) || [];
    highScores.push(score);
    
    // Sort scores by attempts and time
    highScores.sort((a, b) => {
        if (a.attempts === b.attempts) {
            return (b.time || 0) - (a.time || 0);
        }
        return a.attempts - b.attempts;
    });
    
    // Keep only top 10 scores
    highScores = highScores.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('numberGameScores', JSON.stringify(highScores));
    
    // Update display
    displayHighScores();
}

// Display high scores
function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('numberGameScores')) || [];
    const activeFilter = document.querySelector('.score-filter.active').dataset.mode;
    
    scoreList.innerHTML = '';
    
    const filteredScores = activeFilter === 'all' ? 
        highScores : 
        highScores.filter(score => score.mode === activeFilter);
    
    filteredScores.forEach((score, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-item';
        
        // Add medal emoji for top 3
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        scoreElement.innerHTML = `
            <span>${medal} ${score.attempts} attempts${score.time ? ` (${score.time}s)` : ''}</span>
            <span>${score.difficulty} - ${score.date}</span>
        `;
        
        scoreElement.style.animationDelay = `${index * 0.1}s`;
        scoreList.appendChild(scoreElement);
    });
}

// Event listeners
guessBtn.addEventListener('click', checkGuess);
newGameBtn.addEventListener('click', () => {
    document.querySelector('.container').classList.remove('bounce');
    initGame();
});
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkGuess();
    }
});
settingsBtn.addEventListener('click', toggleSettings);
soundBtn.addEventListener('click', toggleSound);
hintBtn.addEventListener('click', useHint);

// Score filter listeners
document.querySelectorAll('.score-filter').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelector('.score-filter.active').classList.remove('active');
        button.classList.add('active');
        displayHighScores();
    });
});

// Settings change listeners
difficultySelect.addEventListener('change', () => {
    if (isGameActive) {
        if (confirm('Changing difficulty will start a new game. Continue?')) {
            initGame();
        } else {
            difficultySelect.value = Object.keys(difficulties).find(key => 
                difficulties[key].max === Math.max(difficulties[difficultySelect.value].max));
            updateRangeMessage(); // Update message even if game doesn't restart
        }
    } else {
        updateRangeMessage();
    }
});

gameModeSelect.addEventListener('change', () => {
    if (isGameActive) {
        if (confirm('Changing game mode will start a new game. Continue?')) {
            initGame();
        } else {
            gameModeSelect.value = gameMode;
        }
    }
});

// Update range message based on current difficulty
function updateRangeMessage() {
    const difficulty = difficulties[difficultySelect.value];
    rangeMessage.textContent = `Try to guess the number between ${difficulty.min} and ${difficulty.max}!`;
    rangeMessage.style.animation = 'none';
    rangeMessage.offsetHeight; // Trigger reflow
    rangeMessage.style.animation = null;
}

// Initialize game on page load
initGame(); 