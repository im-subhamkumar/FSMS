import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                    </Link>
                </li>
                {pathnames.map((name, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const title = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
                    
                    return (
                        <li key={name}>
                            <div className="flex items-center group">
                                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 group-hover:text-gray-600 transition-colors" />
                                {isLast ? (
                                    <span className="text-sm font-semibold text-gray-900 ml-1">{title}</span>
                                ) : (
                                    <Link to={routeTo} className="text-sm font-medium text-gray-500 hover:text-blue-600 ml-1 transition-colors">
                                        {title}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
