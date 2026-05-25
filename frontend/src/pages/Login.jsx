import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, Mail, Lock, LogIn, Info } from 'lucide-react';
import api from '../services/api';

export const Login = () => {
    const { login } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            // Save to store
            login(user, token);

            // Redirect logic based on role, or go back to where they were
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Blue Branding Area */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 overflow-hidden flex-col justify-between p-12">
                {/* Background Image with Overlay */}
                <div 
                    className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2000&auto=format&fit=crop')" }}
                />
                
                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                        <Plane className="h-6 w-6 text-blue-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-white text-xl font-extrabold tracking-widest uppercase">FSMS</span>
                </div>

                {/* Main Text Content */}
                <div className="relative z-10 max-w-lg mt-20 mb-auto">
                    <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                        Flight School<br />Management Platform
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed font-medium">
                        Empowering instructors, students, and administration with a unified, role-based ecosystem.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-blue-200/80 text-sm">
                        © 2026 FSMS Aviation. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-white dark:bg-gray-900">
                <div className="w-full max-w-[420px] space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sign in to the administrative portal</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm font-medium"
                                        placeholder="admin@fsms.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow sm:text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white transition-all shadow-md
                                    ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
                                `}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                                {!isLoading && <LogIn className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                            </button>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-700/50">
                                <Info className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Demo: Use <code className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono text-[10px]">admin@fsms.com</code> / <code className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono text-[10px]">admin</code>
                                </span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
