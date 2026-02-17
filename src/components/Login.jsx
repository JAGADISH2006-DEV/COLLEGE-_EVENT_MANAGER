/**
 * 🔒 TEAM AUTHENTICATION COMPONENT
 * 
 * Provides the secure gateway to the application.
 * Handles both "Sign In" and "Create Team Account" using Firebase.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { loginUser, registerUser, initFirebase, getUserRole } from '../services/firebase';
import { Shield, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
    // Component State: Track what the user enters in the form
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Global Store Hooks: Get helper functions to update global app state
    const firebaseConfig = useAppStore((state) => state.firebaseConfig);
    const setUser = useAppStore((state) => state.setUser);
    const setUserRole = useAppStore((state) => state.setUserRole);
    const setCloudProvider = useAppStore((state) => state.setCloudProvider);

    /**
     * Handles the authentication logic when the button is clicked.
     */
    const handleAuth = async (e) => {
        e.preventDefault(); // Stop page refresh
        setError('');       // Clear previous errors
        setIsLoading(true); // Show spinner

        try {
            // Check if Firebase is configured before attempting anything
            if (!firebaseConfig || !firebaseConfig.apiKey) {
                throw new Error("Configuration Missing: Please go to Settings and paste your Firebase Project Config JSON first.");
            }

            // Initialize the Firebase engine
            initFirebase(firebaseConfig);

            if (isRegistering) {
                // Execute Firebase "Create User" logic
                const userCredential = await registerUser(email, password, name);
                setUser(userCredential.user);    // Save user to the "Brain" (Store)

                // Fetch and set role
                const role = await getUserRole(userCredential.user.uid);
                setUserRole(role);

                setCloudProvider('firestore');   // Activate cloud sync
            } else {
                // Execute Firebase "Login" logic
                const userCredential = await loginUser(email, password);
                setUser(userCredential.user);    // Save user to the "Brain" (Store)

                // Fetch and set role
                const role = await getUserRole(userCredential.user.uid);
                setUserRole(role);

                setCloudProvider('firestore');   // Activate cloud sync
            }
        } catch (err) {
            console.error('Auth failure:', err);

            // Map cryptic Firebase errors to friendly messages for the user
            let message = err.message;
            if (err.code === 'auth/user-not-found') message = 'User not found. Try registering instead.';
            if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
            if (err.code === 'auth/email-already-in-use') message = 'This email is already in use by another team member.';

            setError(message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false); // Hide spinner
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
            {/* Elegant Background Shadows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Branding Section */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6 rotate-12"
                    >
                        <Shield size={40} className="text-white -rotate-12" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        {isRegistering ? 'Create' : 'Team'} <span className="text-indigo-600">{isRegistering ? 'Account' : 'Access'}</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isRegistering ? 'Sign up to start collaborating.' : 'Please log in to sync your event data.'}
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="glass-card p-8 border-0 ring-1 ring-slate-200 dark:ring-slate-800 shadow-2xl shadow-indigo-500/5">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-4">
                            {isRegistering && (
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name"
                                        className="input pl-11 !py-3 font-semibold"
                                    />
                                </div>
                            )}

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="input pl-11 !py-3 font-semibold"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="input pl-11 !py-3 font-semibold"
                                />
                            </div>
                        </div>

                        {/* Error Notification */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2"
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full h-14 font-black shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                isRegistering ? "Register Now" : "Secure Login"
                            )}
                        </button>
                    </form>

                    {/* Mode Toggle */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                            {isRegistering ? 'Already a member? Login' : 'Need an account? Sign up'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
