// Initialize Supabase
const SUPABASE_URL = 'https://lqoedzuozraqgaaappvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxb2VkenVvenJhcWdhYWFwcHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODA5ODEsImV4cCI6MjA4Nzg1Njk4MX0.8AJpt0ic2QLasn3WI-vuqyi04K77VwnujJGq3MtPh0A';

// Create Supabase client
const supabaseClient = {
    init() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return this.supabase;
    },

    // Authentication
    async signUp(email, password, userData) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        return { error };
    },

    async getUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    },

    // CME Activities
    async addCMEActivity(activity) {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('cme_activities')
            .insert([{ ...activity, user_id: user.id }])
            .select();
        
        return { data, error };
    },

    async getCMEActivities() {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('cme_activities')
            .select('*')
            .eq('user_id', user.id)
            .order('date_completed', { ascending: false });

        return { data, error };
    },

    async deleteCMEActivity(id) {
        const { error } = await this.supabase
            .from('cme_activities')
            .delete()
            .eq('id', id);

        return { error };
    },

    // Resumes
    async saveResume(resumeData) {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('resumes')
            .upsert({
                user_id: user.id,
                ...resumeData,
                updated_at: new Date()
            })
            .select();

        return { data, error };
    },

    async getResumes() {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        return { data, error };
    },

    // Job Applications
    async addJobApplication(application) {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('job_applications')
            .insert([{ ...application, user_id: user.id }])
            .select();

        return { data, error };
    },

    async getJobApplications() {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('job_applications')
            .select('*')
            .eq('user_id', user.id)
            .order('applied_date', { ascending: false });

        return { data, error };
    },

    async updateApplicationStatus(id, status) {
        const { error } = await this.supabase
            .from('job_applications')
            .update({ status, updated_at: new Date() })
            .eq('id', id);

        return { error };
    },

    // Interview Prep
    async saveInterviewSession(session) {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('interview_prep')
            .insert([{ ...session, user_id: user.id }])
            .select();

        return { data, error };
    },

    async getInterviewSessions() {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('interview_prep')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    // Subscription Management
    async updateSubscription(tier, paymentId) {
        const user = await this.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await this.supabase
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: tier,
                razorpay_payment_id: paymentId,
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

        return { error };
    },

    async getCurrentSubscription() {
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await this.supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        return data;
    }
};

// Initialize
supabaseClient.init();