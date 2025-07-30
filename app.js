
const SUPABASE_URL = 'https://rbkjhmustsmxcendkyxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJia2pobXVzdHNteGNlbmRreXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODE5NTQsImV4cCI6MjA2NzU1Nzk1NH0.E1dkg5_wNHmLovmQ3k7n3oQf3zd_Ag-cB0fsUo0yjls';


const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutButton = document.getElementById('logout-button');


const showLoginBtn = document.getElementById('show-login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Login form inputs
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');

// Signup form inputs
const signupFirstnameInput = document.getElementById('signup-firstname');
const signupLastnameInput = document.getElementById('signup-lastname');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');

// Main content containers
const pollsContainer = document.getElementById('polls-container');
const resultsContainer = document.getElementById('results-container');
const showActivePollsBtn = document.getElementById('show-active-polls-btn');
const showResultsBtn = document.getElementById('show-results-btn');

// Animation and User Display elements
const welcomeAnimationContainer = document.getElementById('welcome-animation');
const welcomeMessage = document.getElementById('welcome-message');
const userNameDisplay = document.getElementById('user-name-display');
const userEmailDisplay = document.getElementById('user-email-display');



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
    const {error} = await supabaseClient.auth.signInWithPassword({
        email: loginEmailInput.value,
        password: loginPasswordInput.value
    });
    if (error)
        alert('Chyba pri prihlasovaní: ' + error.message);
    else
        checkUser();
});

signupButton.addEventListener('click', async () => {
    const fullName = `${signupFirstnameInput.value.trim()} ${signupLastnameInput.value.trim()}`;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    if (!signupFirstnameInput.value || !signupLastnameInput.value) {
        return alert('Prosím, zadajte vaše meno a priezvisko.');
    }
    if (password.length < 6) {
        return alert('Heslo musí mať aspoň 6 znakov.');
    }

    const {data, error} = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName,
                email: email
            }
        }
    });

    if (error)
        alert('Chyba pri registrácii: ' + error.message);
    else
        alert('Registrácia úspešná! Prosím, potvrďte svoj email kliknutím na odkaz, ktorý sme vám zaslali.');
});

logoutButton.addEventListener('click', () => {
    supabaseClient.auth.signOut();
    checkUser();
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
// Core Application Logic
// =================================================================================

const checkUser = async () => {
    const {data: {user}} = await supabaseClient.auth.getUser();
    if (user) {
        // User is logged in, show welcome animation first
        authContainer.classList.add('hidden');
        appContainer.classList.add('hidden');

        const welcomeName = user.user_metadata.full_name || user.email;
        welcomeMessage.innerText = `Vitaj, ${welcomeName}`;

        welcomeAnimationContainer.classList.remove('hidden');

        // Wait for animation to finish, then show the main app
        setTimeout(() => {
            welcomeAnimationContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');

            const headerDisplayName = user.user_metadata.full_name || user.email.split('@')[0];
            userNameDisplay.textContent = headerDisplayName;
            userEmailDisplay.textContent = user.email;

            showActivePollsBtn.click();
        }, 3000);

    } else {
        // User is not logged in
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        welcomeAnimationContainer.classList.add('hidden');
        // Reset forms
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
        const {data: polls, error: pollsError} = await supabaseClient.from('polls').select('*').eq('is_active', true);
        if (pollsError)
            throw pollsError;

        const {data: {user}} = await supabaseClient.auth.getUser();
        const {data: userVotes, error: userVotesError} = await supabaseClient.from('votes').select('poll_id').eq('user_id', user.id);
        if (userVotesError)
            throw userVotesError;
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
                    <input type="radio" id="option-${
                poll.id}-${option}" name="poll-${poll.id}" value="${option}" ${hasUserVoted ? 'disabled' : ''}>
                    <label for="option-${poll.id}-${option}" class="option-label">${option}</label>
                </div>
            `

            ).join('');

            pollCard.innerHTML = `
                <h3>${poll.question}</h3>
                <form>
                    <div class="options">${
                optionsHTML}</div>
                    <button type="submit" ${hasUserVoted ? 'disabled' : ''}>${hasUserVoted ? 'Už ste hlasovali' : 'Odoslať môj hlas'}</button>
                </form>
            `

            ;
            pollsContainer.appendChild(pollCard);

            if (!hasUserVoted) {
                pollCard.querySelector('form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedOption = pollCard.querySelector(`input[name="poll-${poll.id}"]:checked`);
                    if (!selectedOption) {
                        alert('Prosím, vyberte jednu z možností.');
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
        // Call the new database function instead of fetching tables directly
        const { data: polls, error } = await supabaseClient.rpc('get_poll_results');
        console.log(polls);
        if (error) throw error;

        if (polls.length === 0) {
            resultsContainer.innerHTML = '<p>Nie sú k dispozícii žiadne výsledky z ukončených hlasovaní.</p>';
            return;
        }

        resultsContainer.innerHTML = '';
        for (const poll of polls) {
            const results = poll.results || {}; // Use the pre-calculated results

            let maxVotes = 0;
            // Find the winner(s)
            for (const option of poll.options) {
                const voteCount = results[option] || 0;
                if (voteCount > maxVotes) {
                    maxVotes = voteCount;
                }
            }

            const winners = [];
            if (maxVotes > 0) {
                for (const option of poll.options) {
                    if ((results[option] || 0) === maxVotes) {
                        winners.push(option);
                    }
                }
            }

            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';

            // Display the results
            let resultsHTML = poll.options.map(option => {
                const voteCount = results[option] || 0;
                return `
          <div class="result-item ${winners.includes(option) ? 'winner' : ''}">
            <span class="option-name">${option}</span>
            <span class="vote-count">${voteCount} hlasov</span>
          </div>
        `;
            }).join('');

            // Display the winner announcement
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
        const {error} = await supabaseClient.from('votes').insert([{
            poll_id: pollId,
            selected_option: selectedOption,
            user_id: user.id,
            email: user.email
        }]);
        if (error) {
            if (error.code === '23505')
                alert('V tomto hlasovaní ste už hlasovali.');
            else
                throw error;
        } else {
            alert('Váš hlas bol úspešne odoslaný!');
            fetchPolls();
        }
    } catch (error) {
        console.error('Error casting vote:', error);
        alert('Ľutujeme, pri odosielaní hlasu sa vyskytla chyba.');
    }
};

// =================================================================================
// Initial Load
// =================================================================================
checkUser();
