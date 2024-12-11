<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    let currentClueIndex = 0;
    let clues: string[] = [];
    let userGuess = '';
    let gameWon = false;
    let todaysWord = '';
    let attempts = 0;
    let feedback = '';
    let feedbackType: 'success' | 'error' | '' = '';
    let guessHistory: string[] = [];
    let shake = false;

    let stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        averageAttempts: 0
    };

    onMount(async () => {
        loadStats();
        await initializeGame();
    });

    async function initializeGame() {
        try {
            const response = await fetch('/api/daily');
            const data = await response.json();
            console.log('API Response:', data);
            clues = data.clues;
            todaysWord = data.word;
            if (!todaysWord) {
                console.error('No word received from API');
                todaysWord = "EXAMPLE";
            }
        } catch (error) {
            console.error('Error fetching daily puzzle:', error);
            todaysWord = "EXAMPLE";
            clues = [
                "I am something you see every day",
                "I help you understand things better",
                "I can be found in books and speech",
                "I'm often used to illustrate a point",
                "I start with the letter E"
            ];
        }
    }

    function loadStats() {
        const savedStats = localStorage.getItem('conceptQuestStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
        }
    }

    function saveStats() {
        localStorage.setItem('conceptQuestStats', JSON.stringify(stats));
    }

    function showFeedback(message: string, type: 'success' | 'error') {
        feedback = message;
        feedbackType = type;
        setTimeout(() => {
            feedback = '';
            feedbackType = '';
        }, 2000);
    }

    function checkGuess() {
        if (!todaysWord) {
            console.error('No word set for comparison');
            return;
        }
        
        const normalizedGuess = userGuess.trim().toLowerCase();
        const normalizedWord = todaysWord.toLowerCase();
        
        attempts++;
        guessHistory = [...guessHistory, userGuess];
        
        console.log('Comparing:', normalizedGuess, 'with:', normalizedWord);
        
        if (normalizedGuess === normalizedWord) {
            gameWon = true;
            updateStats();
            showFeedback('Congratulations! You got it right! 🎉', 'success');
        } else {
            shake = true;
            setTimeout(() => shake = false, 500);
            showFeedback('Not quite right. Try again! 🤔', 'error');
            
            // Show next clue if available
            if (currentClueIndex < clues.length - 1) {
                currentClueIndex++;
            }
        }
        userGuess = '';
    }

    function updateStats() {
        stats.gamesPlayed++;
        stats.gamesWon++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.averageAttempts = ((stats.averageAttempts * (stats.gamesWon - 1)) + attempts) / stats.gamesWon;
        saveStats();
    }

    function showNextClue() {
        if (currentClueIndex < clues.length - 1) {
            currentClueIndex++;
        }
    }

    function shareResult() {
        const result = `Concept Quest - Day X\n${currentClueIndex + 1}/5 clues\n${'🟩'.repeat(currentClueIndex + 1)}${'⬜️'.repeat(4 - currentClueIndex)}`;
        navigator.clipboard.writeText(result);
        showFeedback('Results copied to clipboard! 📋', 'success');
    }
</script>

<div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
    <div class="relative py-3 sm:max-w-xl sm:mx-auto">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div class="max-w-md mx-auto">
                <div class="divide-y divide-gray-200">
                    <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                        <h1 class="text-3xl font-bold text-center mb-8">Concept Quest</h1>
                        
                        {#if feedback}
                            <div
                                class="fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white text-lg font-medium"
                                class:bg-green-500={feedbackType === 'success'}
                                class:bg-red-500={feedbackType === 'error'}
                                transition:fly={{ y: -20, duration: 300 }}
                            >
                                {feedback}
                            </div>
                        {/if}
                        
                        {#if !gameWon}
                            <div class="space-y-4">
                                {#each clues.slice(0, currentClueIndex + 1) as clue, index}
                                    <div 
                                        class="p-4 bg-gray-50 rounded-lg"
                                        in:fly={{ y: 20, duration: 300 }}
                                    >
                                        <p class="font-medium">Clue {index + 1}: {clue}</p>
                                    </div>
                                {/each}
                                
                                <div class="flex gap-2">
                                    <input
                                        type="text"
                                        bind:value={userGuess}
                                        placeholder="Enter your guess"
                                        class="flex-1 p-2 border rounded {shake ? 'animate-shake' : ''}"
                                        class:border-red-500={shake}
                                        on:keydown={(e) => e.key === 'Enter' && checkGuess()}
                                    />
                                    <button
                                        on:click={checkGuess}
                                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Guess
                                    </button>
                                </div>

                                {#if guessHistory.length > 0}
                                    <div class="mt-4">
                                        <h3 class="text-sm font-semibold text-gray-500 mb-2">Previous Guesses:</h3>
                                        <div class="flex flex-wrap gap-2">
                                            {#each guessHistory as guess}
                                                <span class="px-2 py-1 bg-gray-100 rounded text-sm">{guess}</span>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                                
                                {#if currentClueIndex < clues.length - 1}
                                    <button
                                        on:click={showNextClue}
                                        class="w-full p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Show Next Clue
                                    </button>
                                {/if}
                            </div>
                        {:else}
                            <div class="text-center space-y-4" in:fly={{ y: 20, duration: 500 }}>
                                <h2 class="text-2xl font-bold text-green-500">Congratulations! 🎉</h2>
                                <p>You guessed it in {attempts} attempts using {currentClueIndex + 1} clues!</p>
                                <p class="text-xl font-bold">The word was: {todaysWord}</p>
                                <button
                                    on:click={shareResult}
                                    class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                    Share Result
                                </button>
                            </div>
                        {/if}
                        
                        <div class="mt-8 pt-8 border-t">
                            <h3 class="text-xl font-bold mb-4">Statistics</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center p-2 bg-gray-50 rounded">
                                    <p class="font-bold text-2xl">{stats.gamesWon}</p>
                                    <p class="text-sm">Games Won</p>
                                </div>
                                <div class="text-center p-2 bg-gray-50 rounded">
                                    <p class="font-bold text-2xl">{stats.currentStreak}</p>
                                    <p class="text-sm">Current Streak</p>
                                </div>
                                <div class="text-center p-2 bg-gray-50 rounded">
                                    <p class="font-bold text-2xl">{stats.maxStreak}</p>
                                    <p class="text-sm">Max Streak</p>
                                </div>
                                <div class="text-center p-2 bg-gray-50 rounded">
                                    <p class="font-bold text-2xl">{stats.averageAttempts.toFixed(1)}</p>
                                    <p class="text-sm">Avg Attempts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .animate-shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    @keyframes shake {
        10%, 90% {
            transform: translate3d(-1px, 0, 0);
        }
        20%, 80% {
            transform: translate3d(2px, 0, 0);
        }
        30%, 50%, 70% {
            transform: translate3d(-4px, 0, 0);
        }
        40%, 60% {
            transform: translate3d(4px, 0, 0);
        }
    }
</style>
