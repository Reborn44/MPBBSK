const SUPABASE_URL = 'https://rbkjhmustsmxcendkyxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJia2pobXVzdHNteGNlbmRreXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODE5NTQsImV4cCI6MjA2NzU1Nzk1NH0.E1dkg5_wNHmLovmQ3k7n3oQf3zd_Ag-cB0fsUo0yjls';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENT REFERENCES ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutButton = document.getElementById('logout-button');
const showLoginBtn = document.getElementById('show-login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const signupFirstnameInput = document.getElementById('signup-firstname');
const signupLastnameInput = document.getElementById('signup-lastname');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');
const pollsContainer = document.getElementById('polls-container');
const resultsContainer = document.getElementById('results-container');
const showActivePollsBtn = document.getElementById('show-active-polls-btn');
const showResultsBtn = document.getElementById('show-results-btn');
const welcomeAnimationContainer = document.getElementById('welcome-animation');
const welcomeMessage = document.getElementById('welcome-message');
const userNameDisplay = document.getElementById('user-name-display');
const userEmailDisplay = document.getElementById('user-email-display');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// NEW: Variable to hold our realtime subscription
let voteSubscription = null;


// --- EVENT LISTENERS ---

// Auth Tab Switching
showLoginBtn.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
});

showSignupBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    showLoginBtn.classList.remove('active');
    showSignupBtn.classList.add('active');
});

// Authentication Buttons
loginButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmailInput.value,
        password: loginPasswordInput.value
    });
    if (error)
        showToast('Chyba pri prihlasovaní: ' + error.message, 'error');
    else
        checkUser();
});

signupButton.addEventListener('click', async () => {
    const fullName = `${signupFirstnameInput.value.trim()} ${signupLastnameInput.value.trim()}`;
    if (!signupFirstnameInput.value || !signupLastnameInput.value) {
        return showToast('Prosím, zadajte vaše meno a priezvisko.', 'error');
    }
    if (signupPasswordInput.value.length < 6) {
        return showToast('Heslo musí mať aspoň 6 znakov.', 'error');
    }

    const { error } = await supabaseClient.auth.signUp({
        email: signupEmailInput.value,
        password: signupPasswordInput.value,
        options: { data: { full_name: fullName } }
    });
    if (error)
        showToast('Chyba pri registrácii: ' + error.message, 'error');
    else
        showToast('Registrácia úspešná! Prosím, potvrďte svoj email.');
});

logoutButton.addEventListener('click', () => {
    // NEW: Unsubscribe from realtime changes when logging out
    if (voteSubscription) {
        voteSubscription.unsubscribe();
        voteSubscription = null;
    }
    supabaseClient.auth.signOut();
    checkUser();
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPassword();
});

// App Tab Switching
showActivePollsBtn.addEventListener('click', () => {
    pollsContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    showActivePollsBtn.classList.add('active');
    showResultsBtn.classList.remove('active');
    resultsContainer.innerHTML = '';
    fetchPolls();
});

showResultsBtn.addEventListener('click', () => {
    pollsContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    showActivePollsBtn.classList.remove('active');
    showResultsBtn.classList.add('active');
    pollsContainer.innerHTML = '';
    fetchResults();
});

// =================================================================================
// New Notification & Realtime System
// =================================================================================

const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
};

// NEW: Function to subscribe to vote changes
const subscribeToVotes = () => {
    // First, make sure we don't have an existing subscription
    if (voteSubscription) {
        return;
    }

    voteSubscription = supabaseClient.channel('public:votes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, payload => {
            console.log('New vote detected!', payload);
            // If the user is currently viewing the active polls, refresh the view
            if (!pollsContainer.classList.contains('hidden')) {
                fetchPolls();
            }
        })
        .subscribe();
};


// =================================================================================
// Core Application Logic
// =================================================================================

const forgotPassword = async () => {
    const email = loginEmailInput.value;
    if (!email) {
        showToast("Prosím, zadajte svoju emailovú adresu do poľa 'Email' a potom kliknite na 'Zabudli ste heslo?'.", "error");
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) {
        showToast("Chyba pri obnove hesla: " + error.message, "error");
    } else {
        showToast("Ak email existuje, bol vám odoslaný odkaz na obnovu hesla.");
    }
};

const checkUser = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        authContainer.classList.add('hidden');
        appContainer.classList.add('hidden');
        const welcomeName = user.user_metadata.full_name || user.email;
        welcomeMessage.innerText = `Vitaj, ${welcomeName}`;
        welcomeAnimationContainer.classList.remove('hidden');

        // NEW: Start the realtime subscription when the user logs in
        subscribeToVotes();

        setTimeout(() => {
            welcomeAnimationContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            const headerDisplayName = user.user_metadata.full_name || user.email.split('@')[0];
            userNameDisplay.textContent = headerDisplayName;
            userEmailDisplay.textContent = user.email;
            showActivePollsBtn.click();
        }, 3000);
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        welcomeAnimationContainer.classList.add('hidden');
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        signupFirstnameInput.value = '';
        signupLastnameInput.value = '';
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
    }
};

const fetchPolls = async () => {
    pollsContainer.innerHTML = '<p>Načítavam hlasovania...</p>';
    try {
        const { data: polls, error: pollsError } = await supabaseClient.from('polls').select('*').eq('is_active', true);
        if (pollsError) throw pollsError;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: userVotes, error: userVotesError } = await supabaseClient.from('votes').select('poll_id').eq('user_id', user.id);
        if (userVotesError) throw userVotesError;
        const userVotedPollIds = new Set(userVotes.map(v => v.poll_id));

        if (polls.length === 0) {
            pollsContainer.innerHTML = '<p>Momentálne nie sú k dispozícii žiadne aktívne hlasovania.</p>';
            return;
        }

        pollsContainer.innerHTML = '';
        for (const poll of polls) {
            const hasUserVoted = userVotedPollIds.has(poll.id);
            const pollCard = document.createElement('div');
            pollCard.className = 'poll-card';
            const optionsHTML = poll.options.map(option => `
                <div class="option">
                    <input type="radio" id="option-${poll.id}-${option}" name="poll-${poll.id}" value="${option}" ${hasUserVoted ? 'disabled' : ''}>
                    <label for="option-${poll.id}-${option}" class="option-label">${option}</label>
                </div>
            `).join('');
            pollCard.innerHTML = `
                <h3>${poll.question}</h3>
                <form>
                    <div class="options">${optionsHTML}</div>
                    <button type="submit" ${hasUserVoted ? 'disabled' : ''}>${hasUserVoted ? 'Už ste hlasovali' : 'Odoslať môj hlas'}</button>
                </form>
            `;
            pollsContainer.appendChild(pollCard);
            if (!hasUserVoted) {
                pollCard.querySelector('form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedOption = pollCard.querySelector(`input[name="poll-${poll.id}"]:checked`);
                    if (!selectedOption) {
                        showToast('Prosím, vyberte jednu z možností.', 'error');
                        return;
                    }
                    await castVote(poll.id, selectedOption.value, user);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching polls:', error);
        pollsContainer.innerHTML = '<p>Ľutujeme, pri načítaní hlasovaní sa vyskytla chyba.</p>';
    }
};

const fetchResults = async () => {
    resultsContainer.innerHTML = '<p>Načítavam výsledky...</p>';
    try {
        const { data: polls, error } = await supabaseClient.rpc('get_poll_results');
        if (error) throw error;
        if (polls.length === 0) {
            resultsContainer.innerHTML = '<p>Nie sú k dispozícii žiadne výsledky z ukončených hlasovaní.</p>';
            return;
        }
        resultsContainer.innerHTML = '';
        for (const poll of polls) {
            const results = poll.results || {};
            let maxVotes = 0;
            for (const option of poll.options) {
                const voteCount = results[option] || 0;
                if (voteCount > maxVotes) maxVotes = voteCount;
            }
            const winners = [];
            if (maxVotes > 0) {
                for (const option of poll.options) {
                    if ((results[option] || 0) === maxVotes) winners.push(option);
                }
            }
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            let resultsHTML = poll.options.map(option => {
                const voteCount = results[option] || 0;
                return `<div class="result-item ${winners.includes(option) ? 'winner' : ''}"><span class="option-name">${option}</span><span class="vote-count">${voteCount} hlasov</span></div>`;
            }).join('');
            let winnerAnnouncement = '';
            if (winners.length > 1) {
                winnerAnnouncement = `<div class="final-winner-announcement">Hlasovanie skončilo nerozhodne medzi: ${winners.join(', ')}</div>`;
            } else if (winners.length === 1) {
                winnerAnnouncement = `<div class="final-winner-announcement">Víťaz: ${winners[0]}</div>`;
            } else {
                winnerAnnouncement = `<div class="final-winner-announcement">V tomto hlasovaní neboli odovzdané žiadne hlasy.</div>`;
            }
            resultCard.innerHTML = `<h3>${poll.question}</h3> ${resultsHTML} ${winnerAnnouncement}`;
            resultsContainer.appendChild(resultCard);
        }
    } catch (error) {
        console.error('Error fetching results:', error);
        resultsContainer.innerHTML = '<p>Ľutujeme, pri načítaní výsledkov sa vyskytla chyba.</p>';
    }
};

const castVote = async (pollId, selectedOption, user) => {
    try {
        const { error } = await supabaseClient.from('votes').insert([{
            poll_id: pollId,
            selected_option: selectedOption,
            user_id: user.id,
            email: user.email
        }]);
        if (error) {
            if (error.code === '23505')
                showToast('V tomto hlasovaní ste už hlasovali.', 'error');
            else
                throw error;
        } else {
            showToast('Váš hlas bol úspešne odoslaný!');
            // No need to call fetchPolls() here anymore, the realtime subscription will handle it.
        }
    } catch (error) {
        console.error('Error casting vote:', error);
        showToast('Ľutujeme, pri odosielaní hlasu sa vyskytla chyba.', 'error');
    }
};

// Initial Load
checkUser();