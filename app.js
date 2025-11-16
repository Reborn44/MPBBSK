// Wrap the entire script in a DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {

    const SUPABASE_URL = 'https://rbkjhmustsmxcendkyxj.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJia2pobXVzdHNteGNlbmRreXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODE5NTQsImV4cCI6MjA2NzU1Nzk1NH0.E1dkg5_wNHmLovmQ3k7n3oQf3zd_Ag-cB0fsUo0yjls';
    //DONT YOU DARE STEAL THIS
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
    const signupNicknameInput = document.getElementById('signup-nickname'); // ADDED: Nickname input
    const pollsContainer = document.getElementById('polls-container');
    const resultsContainer = document.getElementById('results-container');
    const showActivePollsBtn = document.getElementById('show-active-polls-btn');
    const showResultsBtn = document.getElementById('show-results-btn');
    const welcomeAnimationContainer = document.getElementById('welcome-animation');
    const welcomeMessage = document.getElementById('welcome-message');
    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');
    const themeToggle = document.getElementById('theme-toggle');
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const fsPresent = document.getElementById('fs-present');
    const fsFor = document.getElementById('fs-for');
    const fsAgainst = document.getElementById('fs-against');
    const fsAbstained = document.getElementById('fs-abstained');
    const fsNotVoted = document.getElementById('fs-not-voted');
    const fsStatus = document.getElementById('fs-status');
    const fsCloseBtn = document.getElementById('fs-close-btn');
    const fsDate = document.getElementById('fs-date');
    const fsTime = document.getElementById('fs-time');
    const fullscreenLogo = document.querySelector('.fullscreen-logo');
    const userAvatar = document.getElementById('user-avatar');

    // --- ADDED: Admin Panel DOM References ---
    const adminContainer = document.getElementById('admin-container');
    const showAdminBtn = document.getElementById('show-admin-btn');
    const createPollForm = document.getElementById('create-poll-form');
    const pollQuestionInput = document.getElementById('poll-question');
    const pollOptionsInput = document.getElementById('poll-options');
    const pollEndDateInput = document.getElementById('poll-end-date');
    const createPollBtn = document.getElementById('create-poll-btn');
    const adminPollList = document.getElementById('admin-poll-list');

    // --- APP STATE ---
    let voteSubscription = null;
    let isTourRunning = false;
    let currentUserIsAdmin = false; // ADDED: Admin state


    // --- EVENT LISTENERS ---

    showLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
        loginEmailInput.focus();
    });

    showSignupBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        showLoginBtn.classList.remove('active');
        showSignupBtn.classList.add('active');
        signupFirstnameInput.focus();
    });

    loginButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: loginEmailInput.value,
            password: loginPasswordInput.value
        });
        if (error)
            showToast('Chyba pri prihlasovaní: ' + error.message, 'error');
    });

    // --- REPLACE IT WITH THIS ---
    signupButton.addEventListener('click', async () => {
        // --- START OF ADDED CODE ---
        const email = signupEmailInput.value;
        const requiredDomain = '@krajskyparlament.sk';

        if (!email || !email.toLowerCase().endsWith(requiredDomain)) {
            return showToast(`Registrácia je povolená len pre emaily s doménou ${requiredDomain}`, 'error');
        }
        // --- END OF ADDED CODE ---

        const nickname = document.getElementById('signup-nickname').value.trim();
        const fullName = `${signupFirstnameInput.value.trim()} ${signupLastnameInput.value.trim()}`;
        if (!signupFirstnameInput.value || !signupLastnameInput.value) {
            return showToast('Prosím, zadajte vaše meno a priezvisko.', 'error');
        }
        if (!nickname) {
            return showToast('Prosím, zadajte prezývku.', 'error');
        }
        if (signupPasswordInput.value.length < 6) {
            return showToast('Heslo musí mať aspoň 6 znakov.', 'error');
        }
        const { error } = await supabaseClient.auth.signUp({
            email: email, // Use the 'email' variable we just defined
            password: signupPasswordInput.value,
            options: { data: { full_name: fullName, nickname: nickname } }
        });
        if (error) {
            showToast('Chyba pri registrácii: ' + error.message, 'error');
        } else {
            showToast('Registrácia úspešná! Prosím, potvrďte svoj email.');
        }
    });
    document.addEventListener('contextmenu', event => event.preventDefault());

    logoutButton.addEventListener('click', () => {
        if (voteSubscription) {
            voteSubscription.unsubscribe();
            voteSubscription = null;
        }
        currentUserIsAdmin = false; // Reset admin state on logout
        showAdminBtn.classList.add('hidden'); // Hide admin button
        if (adminContainer) adminContainer.classList.add('hidden'); // ADDED: Hide admin panel itself
        supabaseClient.auth.signOut();
    });

    themeToggle.addEventListener('click', () => {
        if (themeToggle.checked) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    });

    showActivePollsBtn.addEventListener('click', () => {
        pollsContainer.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        if (adminContainer) adminContainer.classList.add('hidden'); // ADDED: Hide admin

        showActivePollsBtn.classList.add('active');
        showResultsBtn.classList.remove('active');
        showAdminBtn.classList.remove('active'); // ADDED: Deactivate admin

        resultsContainer.innerHTML = '';
        fetchPolls()
    });

    showResultsBtn.addEventListener('click', () => {
        pollsContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        if (adminContainer) adminContainer.classList.add('hidden'); // ADDED: Hide admin

        showActivePollsBtn.classList.remove('active');
        showResultsBtn.classList.add('active');
        showAdminBtn.classList.remove('active'); // ADDED: Deactivate admin

        pollsContainer.innerHTML = '';
        fetchResults();
    });

    // --- ADDED: Admin Panel Event Listeners ---
    showAdminBtn.addEventListener('click', () => {
        pollsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        if (adminContainer) adminContainer.classList.remove('hidden'); // SHOW admin

        showActivePollsBtn.classList.remove('active');
        showResultsBtn.classList.remove('active');
        showAdminBtn.classList.add('active'); // ACTIVATE admin

        // Fetch and display admin data
        fetchAdminPolls();
    });

    createPollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        createPollBtn.disabled = true;
        createPollBtn.textContent = 'Vytváram...';

        const question = pollQuestionInput.value.trim();
        const optionsString = pollOptionsInput.value.trim();
        const endDate = pollEndDateInput.value ? pollEndDateInput.value : null;

        if (!question || !optionsString) {
            showToast('Otázka a možnosti sú povinné.', 'error');
            createPollBtn.disabled = false;
            createPollBtn.textContent = 'Vytvoriť hlasovanie';
            return;
        }

        // Convert comma-separated string to array of strings
        const options = optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) {
            showToast('Musíte zadať aspoň 2 možnosti oddelené čiarkou.', 'error');
            createPollBtn.disabled = false;
            createPollBtn.textContent = 'Vytvoriť hlasovanie';
            return;
        }

        try {
            const { error } = await supabaseClient.from('polls').insert({
                question: question,
                options: options,
                end_date: endDate,
                is_active: false // New polls are inactive by default
            });

            if (error) throw error;

            showToast('Hlasovanie úspešne vytvorené!', 'success');
            createPollForm.reset();
            fetchAdminPolls(); // Refresh the list

        } catch (error) {
            console.error('Error creating poll:', error);
            showToast(`Chyba pri vytváraní hlasovania: ${error.message}`, 'error');
        } finally {
            createPollBtn.disabled = false;
            createPollBtn.textContent = 'Vytvoriť hlasovanie';
        }
    });


    fsCloseBtn.addEventListener('click', () => {
        fullscreenModal.classList.add('hidden');
    });

    // =================================================================================
    // UI Functions
    // =================================================================================



    //this button does this and that button does that
    const startOnboardingTour = () => {
        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: 'shepherd-theme-arrows',
                scrollTo: true,
                cancelIcon: { enabled: true },
            }
        });

        tour.addStep({
            title: 'Vitajte v Hlasovacom Systéme MP-BBSK!',
            text: 'Ukážeme vám, ako sa tu orientovať. Kliknite na "Ďalej" pre pokračovanie.',
            buttons: [{ text: 'Ďalej', action: tour.next }]
        });
        tour.addStep({
            title: 'Váš Účet',
            text: 'Tu vidíte svoj profilový avatar, meno a email. Tlačidlom sa môžete kedykoľvek odhlásiť.',
            attachTo: { element: '.user-info', on: 'bottom' },
            buttons: [{ text: 'Späť', action: tour.back }, { text: 'Ďalej', action: tour.next }]
        });
        tour.addStep({
            title: 'Navigácia',
            text: 'Týmito kartami prepínate medzi rôznymi sekciami: aktívne hlasovania, výsledky, a ďalšie.',
            attachTo: { element: '.app-nav', on: 'bottom' },
            buttons: [{ text: 'Späť', action: tour.back }, { text: 'Ďalej', action: tour.next }]
        });

        // Check if the poll card exists before adding the next steps
        const pollCardElement = document.querySelector('.poll-card');
        if (pollCardElement) {
            tour.addStep({
                title: 'Aktívne Hlasovanie',
                text: 'Tu vidíte hlasovanie, ktoré práve prebieha. Vyberte si jednu z možností.',
                attachTo: { element: pollCardElement, on: 'bottom' },
                buttons: [{ text: 'Späť', action: tour.back }, { text: 'Ďalej', action: tour.next }]
            });

            const pollCardButton = pollCardElement.querySelector('button');
            if (pollCardButton) {
                tour.addStep({
                    title: 'Odoslanie Hlasu',
                    text: 'Po výbere možnosti odošlite svoj hlas kliknutím na toto tlačidlo.',
                    attachTo: { element: pollCardButton, on: 'top' },
                    buttons: [{ text: 'Späť', action: tour.back }, { text: 'Dokončiť', action: tour.complete }]
                });
            }
        } else {
            // If no poll card, just add a final step
            tour.addStep({
                title: 'Všetko pripravené!',
                text: 'Momentálne nie sú žiadne aktívne hlasovania. Keď sa nejaké objaví, uvidíte ho tu.',
                buttons: [{ text: 'Späť', action: tour.back }, { text: 'Dokončiť', action: tour.complete }]
            });
        }


        // Mark tour as complete when finished or cancelled
        tour.on('complete', () => localStorage.setItem('onboardingTourCompleted', 'true'));
        tour.on('cancel', () => localStorage.setItem('onboardingTourCompleted', 'true'));

        tour.start();
    };


    //because the normal chrome popout was boring
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };

    //bone loader (why is it a skeleton loader?)
    const renderSkeletonLoader = (container) => {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line button"></div>
            `;
            container.appendChild(skeletonCard);
        }
    };

    //dark mode
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) themeToggle.checked = theme === 'dark';
    };

    //so you want dark mode?
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (systemPrefersDark) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    };

    //First name and last name first letter cutter tool
    const getInitials = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '?';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    //Different colors for everyone!
    const generateColorForId = (id) => {
        const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00', '#f4511e'];
        let hash = 0;
        if (!id || id.length === 0) return colors[0];
        for (let i = 0; i < id.length; i++) {
            const char = id.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    //Inspired by Narodna rada Slovensko
    const showFullscreenResults = async (poll) => {
        const results = poll.results || {};
        let totalVotesCast = 0;
        const fullscreenContent = document.querySelector('.fullscreen-content');

        // --- NEW: Special logic for the "Member Count" poll ---
        if (poll.question === "Preverenie uznášaniaschopnosti" && poll.options.length === 1 && poll.options[0] === "Som prítomný") {
            const presentCount = results['Som prítomný'] || 0;

            fsPresent.textContent = presentCount;
            fsFor.textContent = '-';
            fsAgainst.textContent = '-';
            fsAbstained.textContent = '-';
            fsNotVoted.textContent = '-';

            if (presentCount >= 10) {
                fsStatus.textContent = 'Valné zhromaždenie je uznášaniaschopné';
                fullscreenContent.style.backgroundColor = '#003366'; // Blue background
                fullscreenLogo.src = 'img.png';
            } else {
                fsStatus.textContent = 'Valné zhromaždenie nie je uznášaniaschopné';
                fullscreenContent.style.backgroundColor = '#d40000'; // Red background
                fullscreenLogo.src = 'img_1.png';
            }

            const now = new Date();
            fsDate.textContent = now.toLocaleDateString('sk-SK');
            fsTime.textContent = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

            fullscreenModal.classList.remove('hidden');
            return; // Stop the function here for this special poll type
        }

        // --- Original logic for all other polls ---
        for (const option in results) {
            totalVotesCast += results[option];
        }

        const votesFor = results['Za'] || 0;
        const votesAgainst = results['Proti'] || 0;
        const votesAbstained = results['Zdržiavam sa'] || 0;

        const isFormalVote = poll.options.includes('Za') && poll.options.includes('Proti');

        // MODIFIED: Use rpc to get count, it's more efficient
        const { data: profileCount, error } = await supabaseClient.rpc('get_profile_count');

        let totalEligibleVoters = 0;
        if (error) {
            console.error('Could not get profile count:', error);
            // Fallback or error handling
            totalEligibleVoters = totalVotesCast; // As a rough fallback
        } else {
            totalEligibleVoters = profileCount;
        }

        const notVoted = totalEligibleVoters - totalVotesCast;

        const now = new Date();
        fsDate.textContent = now.toLocaleDateString('sk-SK');
        fsTime.textContent = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

        fsPresent.textContent = totalVotesCast;
        fsFor.textContent = votesFor;
        fsAgainst.textContent = votesAgainst;
        fsAbstained.textContent = votesAbstained;
        fsNotVoted.textContent = notVoted < 0 ? 0 : notVoted;

        if (isFormalVote) {
            if (votesFor > votesAgainst) {
                fsStatus.textContent = 'NÁVRH SCHVÁLENÝ';
                fsStatus.style.color = 'white';
                fullscreenContent.style.backgroundColor = '#003366';
                fullscreenLogo.src = 'img.png'; // Set to BLUE logo
            } else {
                fsStatus.textContent = 'NÁVRH NESCHVÁLENÝ';
                fsStatus.style.color = 'white';
                fullscreenContent.style.backgroundColor = '#d40000';
                fullscreenLogo.src = 'img_1.png'; // Set to RED logo
            }
        } else {
            fsStatus.textContent = 'HLASOVANIE UKONČENÉ';
            fsStatus.style.color = 'white';
            fullscreenContent.style.backgroundColor = '#003366';
            fullscreenLogo.src = 'whitelogo2.png'; // Set to default logo
        }

        fullscreenModal.classList.remove('hidden');
    };

    //times ticking so get to voting
    const formatTimeRemaining = (endDate) => {
        if (!endDate) return null;
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return 'Hlasovanie ukončené';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

        if (parts.length === 0) return 'Koniec za menej ako minútu';
        return `Koniec za: ${parts.join(' ')}`;
    };
    // =================================================================================
    // Core Application Logic
    // =================================================================================

    //What does this even do??
    const subscribeToVotes = () => {
        if (voteSubscription) return;
        voteSubscription = supabaseClient.channel('public:votes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
                if (!pollsContainer.classList.contains('hidden')) {
                    fetchPolls();
                }
            })
            .subscribe();
    };

    // --- ADDED: Function to check for admin status ---
    // This function also creates a profile if one doesn't exist.
    const checkUserRole = async (user) => {
        if (!user) return;

        try {
            // 1. Check if a profile exists
            let { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('is_admin, full_name')
                .eq('id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile not found, create it
                const { data: newProfile, error: insertError } = await supabaseClient
                    .from('profiles')
                    .insert({
                        id: user.id,
                        full_name: user.user_metadata.full_name,
                        nickname: user.user_metadata.nickname,
                        email: user.email,
                        is_admin: false // Default to false
                    })
                    .select('is_admin, full_name')
                    .single();

                if (insertError) throw insertError;
                profile = newProfile;

            } else if (error) {
                throw error;
            }

            // 2. Update App State
            const fullName = profile.full_name || user.user_metadata.full_name || user.email;
            if (profile.is_admin) {
                currentUserIsAdmin = true;
                showAdminBtn.classList.remove('hidden');
            } else {
                currentUserIsAdmin = false;
                showAdminBtn.classList.add('hidden');
            }

            // 3. Return full name for welcome message
            return fullName;

        } catch (error) {
            // This is where Error 1 ("column profiles.is_admin does not exist") is caught
            console.error('Error checking user role or creating profile:', error);
            showToast('Chyba pri načítaní profilu.', 'error');

            // --- FIX ADDED ---
            // Explicitly hide the admin button and set admin status to false on error
            currentUserIsAdmin = false;
            showAdminBtn.classList.add('hidden');
            if (adminContainer) adminContainer.classList.add('hidden'); // Also hide the panel

            // Fallback to metadata
            return user.user_metadata.full_name || user.email;
        }
    };


    //Im glad you logged in
    const handleUserLoggedIn = async (user) => { // Made this async
        authContainer.classList.add('hidden');
        appContainer.classList.add('hidden');
        if (adminContainer) adminContainer.classList.add('hidden'); // ADDED: Hide admin panel on login

        // MODIFIED: Check role and get name from profile
        const fullName = await checkUserRole(user);

        // --- Avatar Logic ---
        const initials = getInitials(fullName);
        const avatarColor = generateColorForId(user.id);
        userAvatar.textContent = initials;
        userAvatar.style.backgroundColor = avatarColor;

        welcomeMessage.innerText = `Vitaj, ${fullName}`;
        welcomeAnimationContainer.classList.remove('hidden');
        subscribeToVotes();

        setTimeout(() => {
            welcomeAnimationContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userNameDisplay.textContent = fullName; // Display name from profile
            userEmailDisplay.textContent = user.email;
            showActivePollsBtn.click();

            if (!localStorage.getItem('onboardingTourCompleted') && !isTourRunning) {
                isTourRunning = true;
                // Short delay to ensure poll card has time to render
                setTimeout(startOnboardingTour, 1500);
            }
        }, 3000);
    };

    // why would you log out?!
    const handleUserLoggedOut = () => {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        welcomeAnimationContainer.classList.add('hidden');
        // Check if loginEmailInput exists before trying to focus
        if (loginEmailInput) {
            loginEmailInput.focus();
        }
        // ADDED: Reset admin state on logout
        currentUserIsAdmin = false;
        showAdminBtn.classList.add('hidden');
        if (adminContainer) adminContainer.classList.add('hidden'); // ADDED: Hide admin panel itself
    };

    //get new polls in the first tab
    const fetchPolls = async () => {
        renderSkeletonLoader(pollsContainer);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: polls, error: pollsError } = await supabaseClient
                .from('polls')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false }); // Show newest first

            if (pollsError) throw pollsError;

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            const { data: userVotes, error: userVotesError } = await supabaseClient
                .from('votes')
                .select('poll_id')
                .eq('user_id', user.id);

            if (userVotesError) throw userVotesError;

            const userVotedPollIds = new Set(userVotes.map(v => v.poll_id));
            pollsContainer.innerHTML = '';

            if (polls.length === 0) {
                pollsContainer.innerHTML = '<p>Momentálne nie sú k dispozícii žiadne aktívne hlasovania.</p>';
                return;
            }

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

                // New timer logic
                const timeRemaining = formatTimeRemaining(poll.end_date);
                const timerHTML = timeRemaining ? `<div class="countdown-timer">${timeRemaining}</div>` : '';
                const isPollFinished = timeRemaining === 'Hlasovanie ukončené';

                pollCard.innerHTML = `
                    ${timerHTML}
                    <h3>${poll.question}</h3>
                    <form>
                        <div class="options">${optionsHTML}</div>
                        <button type="submit" ${hasUserVoted || isPollFinished ? 'disabled' : ''}>${hasUserVoted ? 'Už ste hlasovali' : (isPollFinished ? 'Ukončené' : 'Odoslať môj hlas')}</button>
                    </form>
                `;
                pollsContainer.appendChild(pollCard);
                if (!hasUserVoted && !isPollFinished) {
                    pollCard.querySelector('form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const selectedOption = pollCard.querySelector(`input[name="poll-${poll.id}"]:checked`);
                        if (!selectedOption) {
                            showToast('Prosím, vyberte jednu z možností.', 'error');
                            return;
                        }
                        // CHANGE: Pass the pollCard element to the castVote function
                        await castVote(poll.id, selectedOption.value, user, pollCard);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching polls:', error);
            pollsContainer.innerHTML = '<p>Ľutujeme, pri načítaní hlasovaní sa vyskytla chyba.</p>';
        }
    };

    // get results in the second tab
    const fetchResults = async () => {
        renderSkeletonLoader(resultsContainer);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            // MODIFIED: Removed the .order() clause that was causing the error
            const { data: polls, error } = await supabaseClient.rpc('get_poll_results');

            if (error) throw error;
            resultsContainer.innerHTML = '';
            if (polls.length === 0) {
                resultsContainer.innerHTML = '<p>Nie sú k dispozícii žiadne výsledky z ukončených hlasovaní.</p>';
                return;
            }

            // Since we can't sort from the RPC, we'll sort the results here in JavaScript.
            // This assumes the RPC returns a 'created_at' field. If not, this sort will
            // not work as intended, but it won't crash the app.
            // A better fix is to modify the RPC 'get_poll_results' to return 'created_at'.
            // For now, let's sort by poll_id as a fallback.
            polls.sort((a, b) => b.poll_id - a.poll_id); // Sort by ID descending (newest)

            for (const poll of polls) {
                const results = poll.results || {};
                let totalVotes = 0;
                let maxVotes = 0;
                for (const option of poll.options) {
                    const voteCount = results[option] || 0;
                    totalVotes += voteCount;
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
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const isWinner = winners.includes(option);
                    return `
                        <div class="result-item ${isWinner ? 'winner' : ''}">
                            <div class="result-bar-container">
                                <div class="result-bar-fill" style="width: ${percentage}%;"></div>
                                <div class="result-bar-text">
                                    <span class="option-label">${option}</span>
                                    <span class="vote-label">${voteCount} hlasov</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                let winnerAnnouncement = '';
                if (winners.length > 1) {
                    winnerAnnouncement = `<div class="final-winner-announcement">Hlasovanie skončilo nerozhodne medzi: ${winners.join(', ')}</div>`;
                } else if (winners.length === 1) {
                    winnerAnnouncement = `<div class="final-winner-announcement">Víťaz: ${winners[0]}</div>`;
                } else {
                    winnerAnnouncement = `<div class="final-winner-announcement">V tomto hlasovaní neboli odovzdané žiadne hlasy.</div>`;
                }
                // MODIFIED: Added fullscreen button logic
                const footerHTML = `
                    <div class="result-card-footer">
                        <button id="generate-fs-btn-${poll.poll_id}" class="fullscreen-btn">Zobraziť na celej obrazovke</button>
                    </div>
                `;
                // MODIFIED: Added header with button
                resultCard.innerHTML = `
                    <div class="result-card-header">
                         <h3>${poll.question}</h3>
                         <button id="generate-fs-btn-${poll.poll_id}" class="fullscreen-btn"></button>
                    </div>
                    ${resultsHTML} 
                    ${winnerAnnouncement}
                `;
                resultsContainer.appendChild(resultCard);

                document.getElementById(`generate-fs-btn-${poll.poll_id}`).addEventListener('click', () => {
                    showFullscreenResults(poll);
                });
            }
        } catch (error) {
            // This is where Error 3 ("column record.created_at does not exist") is caught
            console.error('Error fetching results:', error);
            resultsContainer.innerHTML = '<p>Ľutujeme, pri načítaní výsledkov sa vyskytla chyba.</p>';
        }
    };

    // --- MODIFIED: Fetch all polls for admin panel (now 3-state) ---
    const fetchAdminPolls = async () => {
        if (!currentUserIsAdmin) return;

        adminPollList.innerHTML = ''; // Clear existing list
        renderSkeletonLoader(adminPollList); // Show loader

        try {
            const { data: polls, error } = await supabaseClient
                .from('polls')
                .select('*')
                .order('created_at', { ascending: false }); // Show newest first

            if (error) throw error;

            adminPollList.innerHTML = ''; // Clear loader

            if (polls.length === 0) {
                adminPollList.innerHTML = '<p>Zatiaľ neboli vytvorené žiadne hlasovania.</p>';
                return;
            }

            polls.forEach(poll => {
                const pollItem = document.createElement('div');
                pollItem.className = 'admin-poll-item';

                let statusClass = '';
                let statusText = '';
                let buttonsHTML = '';

                if (poll.is_active === true) {
                    statusClass = 'status-active';
                    statusText = 'Aktívne (Hlasuje sa)';
                    buttonsHTML = `
                    <button class="button-danger" data-id="${poll.id}" data-action="deactivate">Deaktivovať (Zobraziť výsledky)</button>
                    <button class="button-secondary" data-id="${poll.id}" data-action="hide">Skryť (Vymazať)</button>
                `;
                } else if (poll.is_active === false) {
                    statusClass = 'status-inactive';
                    statusText = 'Neaktívne (Zobrazujú sa výsledky)';
                    buttonsHTML = `
                    <button class="button-success" data-id="${poll.id}" data-action="activate">Aktivovať</button>
                    <button class="button-secondary" data-id="${poll.id}" data-action="hide">Skryť (Vymazať)</button>
                `;
                } else { // poll.is_active is null
                    statusClass = 'status-hidden'; // We will add this CSS class
                    statusText = 'Skryté (Koncept/Vymazané)';
                    buttonsHTML = `
                    <button class="button-success" data-id="${poll.id}" data-action="activate">Aktivovať</button>
                    <button class="button-secondary" data-id="${poll.id}" data-action="deactivate">Zobraziť výsledky</button>
                `;
                }

                pollItem.innerHTML = `
                <div class="admin-poll-info">
                    <strong>${poll.question}</strong>
                    <span>Možnosti: ${poll.options.join(', ')}</span>
                    <span class="${statusClass}">Status: ${statusText}</span>
                    <span>Koniec: ${poll.end_date ? new Date(poll.end_date).toLocaleString('sk-SK') : 'Nenastavený'}</span>
                </div>
                <div class="admin-poll-actions">
                    ${buttonsHTML}
                </div>
            `;
                adminPollList.appendChild(pollItem);
            });

            // Add event listeners to the new buttons
            adminPollList.querySelectorAll('.admin-poll-actions button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const action = e.target.dataset.action;

                    let newStatus;
                    if (action === 'activate') {
                        newStatus = true;
                    } else if (action === 'deactivate') {
                        newStatus = false;
                    } else if (action === 'hide') {
                        newStatus = null;
                    }

                    // Pass the button element for optimistic UI
                    handleSetPollStatus(id, newStatus, e.target);
                });
            });

        } catch (error) {
            console.error('Error fetching admin polls:', error);
            adminPollList.innerHTML = '<p>Chyba pri načítaní hlasovaní.</p>';
            showToast('Chyba pri načítaní hlasovaní.', 'error');
        }
    };

    // --- ADDED: Activate/Deactivate a poll ---
    // --- MODIFIED: Set poll status (handles true, false, null) ---
    const handleSetPollStatus = async (pollId, newStatus, buttonElement) => {
        if (!currentUserIsAdmin) return;

        // Save original text and disable all buttons for this poll
        const actionButtons = buttonElement.parentElement.querySelectorAll('button');
        const originalButtonTexts = new Map();
        actionButtons.forEach(btn => {
            originalButtonTexts.set(btn, btn.textContent);
            btn.disabled = true;
            btn.textContent = 'Mením...';
        });

        try {
            const { error } = await supabaseClient
                .from('polls')
                .update({ is_active: newStatus })
                .eq('id', pollId);

            if (error) throw error;

            let statusText = '';
            if (newStatus === true) statusText = 'aktivované';
            else if (newStatus === false) statusText = 'deaktivované (zobrazia sa výsledky)';
            else statusText = 'skryté';

            showToast(`Hlasovanie bolo úspešne ${statusText}.`, 'success');
            fetchAdminPolls(); // Refresh the list (which will re-enable buttons)

        } catch (error) {
            console.error('Error setting poll status:', error);
            showToast('Chyba pri zmene statusu hlasovania.', 'error');
            // Restore buttons on error
            actionButtons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = originalButtonTexts.get(btn);
            });
        }
    };


    //VOTING LOGIC
    const castVote = async (pollId, selectedOption, user, pollCard) => {
        // --- Optimistic UI Update ---
        // 1. Immediately select the UI elements we need to change.
        const voteButton = pollCard.querySelector('button[type="submit"]');
        const radioInputs = pollCard.querySelectorAll('input[type="radio"]');
        const originalButtonText = voteButton.textContent; // Save original text for potential rollback

        // 2. Instantly disable the form and update the button text.
        // This makes the app feel instantaneous to the user.
        voteButton.disabled = true;
        voteButton.textContent = 'Už ste hlasovali';
        radioInputs.forEach(input => {
            input.disabled = true;
        });

        try {
            // 3. Send the request to Supabase in the background.
            const { error } = await supabaseClient.from('votes').insert([{
                poll_id: pollId,
                selected_option: selectedOption,
                user_id: user.id,
                email: user.email // Note: Storing email here might be redundant if you join with the auth table.
            }]);

            if (error) {
                // An error occurred, so we need to decide what to do.
                if (error.code === '23505') {
                    // This specific error means the user has already voted.
                    // Our optimistic UI is actually correct, so we just show the message.
                    showToast('V tomto hlasovaní ste už hlasovali.', 'error');
                } else {
                    // For any other error, we assume the vote failed and roll back the UI.
                    throw error; // Let the catch block handle the UI rollback.
                }
            } else {
                // Success! The UI is already updated, so we just show a confirmation.
                showToast('Váš hlas bol úspešne odoslaný!');
            }
        } catch (error) {
            // --- UI Rollback ---
            // 4. If a non-specific error happened, revert the UI to its original state.
            console.error('Error casting vote:', error);
            showToast('Ľutujeme, pri odosielaní hlasu sa vyskytla chyba.', 'error');

            voteButton.disabled = false;
            voteButton.textContent = originalButtonText;
            radioInputs.forEach(input => {
                input.disabled = false;
            });
        }
    };

    // --- INITIAL LOAD & AUTH STATE CHANGE ---
    loadTheme();

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            handleUserLoggedIn(session.user);
        } else {
            handleUserLoggedOut();
        }
    });

}); // Close the DOMContentLoaded listener

