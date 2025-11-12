import React, { useState, useMemo } from 'react';
import { feedbackData } from '../constants';
import { Feedback, FeedbackStatus, FeedbackSentiment, UserRole } from '../types';
import { Notification } from './Notification';
import { StarIcon, EyeIcon, EyeOffIcon } from './icons';
import { canPerformAction } from '../utils/auth';

interface FeedbackManagementProps {
    userRole: UserRole;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <StarIcon
                key={i}
                className={`h-5 w-5 ${i < rating ? 'text-satin-gold fill-current' : 'text-charcoal/30'}`}
            />
        ))}
    </div>
);

const SentimentBadge: React.FC<{ sentiment: FeedbackSentiment }> = ({ sentiment }) => {
    const sentimentStyles: Record<FeedbackSentiment, { text: string, bg: string }> = {
        'Positive': { text: 'text-green-800', bg: 'bg-green-100' },
        'Neutral': { text: 'text-gray-800', bg: 'bg-gray-200' },
        'Negative': { text: 'text-red-800', bg: 'bg-red-100' },
    };
    const style = sentimentStyles[sentiment];
    return <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${style.text} ${style.bg}`}>{sentiment}</span>;
};

const FeedbackCard: React.FC<{
    feedback: Feedback;
    userRole: UserRole;
    onStatusToggle: (id: string, newStatus: FeedbackStatus) => void;
}> = ({ feedback, userRole, onStatusToggle }) => {
    
    const newStatus = feedback.status === 'Approved' ? 'Pending' : 'Approved';
    const ToggleIcon = feedback.status === 'Approved' ? EyeOffIcon : EyeIcon;
    const toggleText = feedback.status === 'Approved' ? 'Hide Review' : 'Approve Review';
    const canManage = canPerformAction(userRole, 'manage_feedback_status');

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-serif text-xl text-charcoal font-bold">{feedback.guestName}</h3>
                    <p className="text-sm text-charcoal/60">{feedback.date} - {feedback.roomType}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StarRating rating={feedback.rating} />
                    <SentimentBadge sentiment={feedback.sentiment} />
                </div>
            </div>
            <p className="text-charcoal/80 italic">"{feedback.comment}"</p>
            <div className="border-t border-charcoal/10 pt-4 flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold uppercase">Status: </span>
                    <span className={`font-bold ${feedback.status === 'Approved' ? 'text-green-600' : 'text-charcoal/60'}`}>
                        {feedback.status}
                    </span>
                </div>
                {canManage && (
                    <button
                        onClick={() => onStatusToggle(feedback.id, newStatus)}
                        className="flex items-center gap-2 text-sm text-deep-navy hover:text-deep-navy/70 font-bold transition-colors"
                    >
                        <ToggleIcon className="h-5 w-5" />
                        {toggleText}
                    </button>
                )}
            </div>
        </div>
    );
}


export const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ userRole }) => {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>(feedbackData);
    const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const filteredFeedback = useMemo(() => {
        return feedbackList
            .filter(f => statusFilter === 'all' || f.status === statusFilter)
            .filter(f => ratingFilter === 'all' || f.rating === ratingFilter);
    }, [feedbackList, statusFilter, ratingFilter]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    };

    const handleStatusToggle = (feedbackId: string, newStatus: FeedbackStatus) => {
        setFeedbackList(prev => prev.map(f =>
            f.id === feedbackId ? { ...f, status: newStatus } : f
        ));
        showNotification(`Review status updated to ${newStatus}.`);
    };

    return (
        <div className="space-y-6">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-serif text-3xl text-charcoal">Guest Feedback</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                         <div>
                            <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
                                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ratingFilter" className="sr-only">Filter by Rating</label>
                            <select
                                id="ratingFilter"
                                value={ratingFilter}
                                onChange={e => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
                            >
                                <option value="all">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFeedback.length > 0 ? (
                    filteredFeedback.map(feedback => (
                        <FeedbackCard key={feedback.id} feedback={feedback} userRole={userRole} onStatusToggle={handleStatusToggle} />
                    ))
                ) : (
                    <div className="lg:col-span-2 text-center py-12 bg-white rounded-lg shadow-lg">
                        <p className="text-charcoal/70">No feedback entries match the current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};