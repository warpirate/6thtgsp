import React from 'react';
import { Receipt } from '@/types';

interface StatusBadgeProps {
  status: Receipt['status'];
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: Receipt['status']) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
      case 'submitted':
        return {
          label: 'Submitted',
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'verified':
        return {
          label: 'Verified',
          className: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-300'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
