// Common utility functions
const utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    showLoading(show = true) {
        if (show) {
            const loader = document.createElement('div');
            loader.className = 'loader';
            loader.id = 'global-loader';
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        } else {
            document.getElementById('global-loader')?.remove();
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }
};

// Navigation handler
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    // Check authentication status
    checkAuthStatus();
});

async function checkAuthStatus() {
    const user = await supabaseClient.getUser();
    const authLinks = document.querySelectorAll('.auth-link');
    const dashboardLink = document.querySelector('.dashboard-link');
    
    if (user) {
        authLinks.forEach(link => {
            if (link.classList.contains('login-link')) {
                link.style.display = 'none';
            }
            if (link.classList.contains('signup-link')) {
                link.style.display = 'none';
            }
        });
        if (dashboardLink) {
            dashboardLink.style.display = 'block';
        }
    }
}

// Dashboard specific functions
async function loadDashboard() {
    utils.showLoading(true);
    
    try {
        // Load CME activities
        const { data: cmeData } = await supabaseClient.getCMEActivities();
        updateCMEStats(cmeData);
        
        // Load job applications
        const { data: jobData } = await supabaseClient.getJobApplications();
        updateJobStats(jobData);
        
        // Load subscription info
        const subscription = await supabaseClient.getCurrentSubscription();
        updateSubscriptionInfo(subscription);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        utils.showToast('Error loading dashboard data', 'error');
    } finally {
        utils.showLoading(false);
    }
}

function updateCMEStats(activities) {
    const totalCredits = activities.reduce((sum, act) => sum + act.credits, 0);
    const recentActivities = activities.slice(0, 5);
    
    // Update UI elements
    document.getElementById('total-credits')?.textContent = totalCredits;
    document.getElementById('activities-count')?.textContent = activities.length;
    
    // Update recent activities table
    const tableBody = document.getElementById('recent-activities');
    if (tableBody) {
        tableBody.innerHTML = recentActivities.map(act => `
            <tr>
                <td>${act.title}</td>
                <td>${utils.formatDate(act.date_completed)}</td>
                <td>${act.credits}</td>
                <td><span class="badge badge-success">${act.category || 'General'}</span></td>
            </tr>
        `).join('');
    }
}

function updateJobStats(applications) {
    const stats = {
        applied: applications.filter(a => a.status === 'applied').length,
        interviewing: applications.filter(a => a.status === 'interviewing').length,
        offers: applications.filter(a => a.status === 'offer').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };
    
    // Update UI
    document.getElementById('applied-count')?.textContent = stats.applied;
    document.getElementById('interviewing-count')?.textContent = stats.interviewing;
    document.getElementById('offers-count')?.textContent = stats.offers;
}

function updateSubscriptionInfo(subscription) {
    if (subscription) {
        document.getElementById('current-plan')?.textContent = subscription.plan_id;
        document.getElementById('renewal-date')?.textContent = 
            utils.formatDate(subscription.current_period_end);
    }
}

// CME Tracker specific functions
async function addCMEActivity(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const activity = {
        title: formData.get('title'),
        date_completed: formData.get('date'),
        credits: parseFloat(formData.get('credits')),
        category: formData.get('category'),
        provider: formData.get('provider'),
        notes: formData.get('notes')
    };
    
    utils.showLoading(true);
    const { error } = await supabaseClient.addCMEActivity(activity);
    utils.showLoading(false);
    
    if (!error) {
        utils.showToast('CME activity added successfully');
        event.target.reset();
        loadDashboard(); // Reload data
    } else {
        utils.showToast('Error adding activity: ' + error.message, 'error');
    }
}

// ATS Score Checker
async function checkATSScore() {
    const resumeText = document.getElementById('resume-text')?.value;
    const jobDescription = document.getElementById('job-description')?.value;
    
    if (!resumeText || !jobDescription) {
        utils.showToast('Please fill in both fields', 'error');
        return;
    }
    
    utils.showLoading(true);
    
    // Simple ATS scoring algorithm
    const jobKeywords = extractKeywords(jobDescription);
    const matchedKeywords = jobKeywords.filter(keyword => 
        resumeText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const score = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
    const missingKeywords = jobKeywords.filter(k => !matchedKeywords.includes(k));
    
    utils.showLoading(false);
    
    // Display results
    document.getElementById('ats-score').textContent = score;
    document.getElementById('matched-keywords').textContent = matchedKeywords.join(', ');
    document.getElementById('missing-keywords').innerHTML = missingKeywords
        .map(k => `<li>${k}</li>`)
        .join('');
    
    document.getElementById('ats-results').style.display = 'block';
}

function extractKeywords(text) {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = ['the', 'and', 'for', 'with', 'etc', 'job', 'description'];
    return [...new Set(words.filter(w => 
        w.length > 3 && !stopWords.includes(w)
    ))];
}

// Interview Prep
async function saveInterviewResponse() {
    const question = document.getElementById('question')?.value;
    const response = document.getElementById('response')?.value;
    const category = document.getElementById('category')?.value;
    
    if (!question || !response) {
        utils.showToast('Please answer the question', 'error');
        return;
    }
    
    const session = {
        question,
        response,
        category,
        self_evaluation: document.getElementById('self-evaluation')?.value,
        created_at: new Date()
    };
    
    utils.showLoading(true);
    const { error } = await supabaseClient.saveInterviewSession(session);
    utils.showLoading(false);
    
    if (!error) {
        utils.showToast('Response saved successfully');
        // Load next question or show feedback
        loadNextQuestion();
    } else {
        utils.showToast('Error saving response', 'error');
    }
}

// Export functions for use in HTML
window.addCMEActivity = addCMEActivity;
window.checkATSScore = checkATSScore;
window.saveInterviewResponse = saveInterviewResponse;
window.loadDashboard = loadDashboard;
