import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  title?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  badge?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'card' | 'compact' | 'dashed' | 'hero';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconProp,
  title,
  description,
  badge,
  action,
  secondaryAction,
  actions,
  children,
  variant = 'default',
  className = ''
}) => {
  // Determine if IconProp is a component or a React element
  const renderIcon = () => {
    if (!IconProp) return null;

    if (React.isValidElement(IconProp)) {
      return IconProp;
    }

    // Component passed (e.g. LucideIcon)
    const IconComponent = IconProp as React.ComponentType<{ className?: string }>;
    const sizeClasses = variant === 'compact' ? 'w-5 h-5' : 'w-8 h-8 md:w-10 md:h-10';

    return <IconComponent className={`${sizeClasses} text-emerald-400`} />;
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'compact':
        return 'py-6 px-4 space-y-3 text-center';
      case 'card':
        return 'py-12 px-6 sm:px-10 rounded-3xl bg-[#0b1f16] border border-emerald-500/15 shadow-xl text-center space-y-5';
      case 'dashed':
        return 'py-12 px-6 sm:px-10 rounded-3xl bg-[#091d14] border-2 border-dashed border-emerald-500/20 text-center space-y-5';
      case 'hero':
        return 'py-16 px-6 sm:px-12 rounded-3xl bg-gradient-to-b from-[#0c2419] via-[#091d14] to-[#06140d] border border-emerald-500/20 shadow-2xl text-center space-y-6 relative overflow-hidden';
      case 'default':
      default:
        return 'py-12 px-4 sm:px-8 text-center space-y-5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center ${getContainerStyle()} ${className}`}
    >
      {/* Optional ambient background for hero / card */}
      {(variant === 'hero' || variant === 'card') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      )}

      {/* Icon Wrapper */}
      {IconProp && (
        <div className="relative z-10">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full pointer-events-none" />
          <div
            className={`relative rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg ${
              variant === 'compact'
                ? 'w-10 h-10 bg-emerald-950/70'
                : 'w-16 h-16 sm:w-20 sm:h-20 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
            }`}
          >
            {renderIcon()}
          </div>
        </div>
      )}

      {/* Text Area */}
      <div className="relative z-10 space-y-2 max-w-lg">
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>{badge}</span>
          </div>
        )}

        <h3
          className={`font-display font-bold text-white tracking-tight ${
            variant === 'compact'
              ? 'text-sm sm:text-base'
              : variant === 'hero'
              ? 'text-2xl sm:text-3xl md:text-4xl'
              : 'text-xl sm:text-2xl'
          }`}
        >
          {title}
        </h3>

        <div className="text-slate-300 font-ui text-xs sm:text-sm leading-relaxed">
          {description}
        </div>
      </div>

      {/* Action Buttons */}
      {(action || secondaryAction || actions) && (
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-1">
          {action && (
            <button
              onClick={action.onClick}
              title={action.title}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                action.variant === 'secondary'
                  ? 'bg-[#0c1e15] hover:bg-[#122b1e] border border-emerald-900/50 text-emerald-300 hover:text-white'
                  : action.variant === 'outline'
                  ? 'border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:bg-emerald-950/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
              } ${action.className || ''}`}
            >
              {action.icon && React.createElement(action.icon, { className: 'w-4 h-4 shrink-0' })}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              title={secondaryAction.title}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                secondaryAction.variant === 'primary'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-[#0c1e15] hover:bg-[#122b1e] border border-emerald-900/50 text-emerald-300 hover:text-white'
              } ${secondaryAction.className || ''}`}
            >
              {secondaryAction.icon && React.createElement(secondaryAction.icon, { className: 'w-4 h-4 shrink-0' })}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {actions}
        </div>
      )}

      {/* Additional child content (e.g. guidance cards, search reset, feature list) */}
      {children && <div className="relative z-10 w-full pt-3">{children}</div>}
    </motion.div>
  );
};
