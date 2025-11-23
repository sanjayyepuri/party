import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
    return (
        <div className={`bg-white p-6 shadow-none rounded-none max-w-md w-full ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = "" }: CardProps) => {
    return (
        <div className={`mb-6 pb-2 ${className}`}>
            {children}
        </div>
    );
};

export const CardTitle = ({ children, className = "" }: CardProps) => {
    return (
        <h1 className={`font-serif text-2xl font-bold tracking-tight text-black ${className}`}>
            {children}
        </h1>
    );
};
