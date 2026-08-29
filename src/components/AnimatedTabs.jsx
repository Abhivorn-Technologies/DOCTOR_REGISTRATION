import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, Award, Stethoscope, CheckCircle2 } from 'lucide-react';

const STEP_ICONS = {
  1: User,
  2: Award,
  3: Stethoscope,
  4: CheckCircle2,
};

/**
 * AnimatedTabs Component (animate-ui style)
 * Full pill background with smooth spring sliding/rolling transition between steps.
 */
export default function AnimatedTabs({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) {
  return (
    <div
      style={{
        width: '100%',
        background: '#F1F5F9',
        padding: '5px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
      }}
      className={className}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '4px',
          position: 'relative',
        }}
      >
        {Object.entries(steps).map(([stepKey, info]) => {
          const stepNum = Number(stepKey);
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;

          return (
            <button
              key={stepKey}
              type="button"
              onClick={() => {
                if (onStepClick && (isDone || stepNum <= currentStep)) {
                  onStepClick(stepNum);
                }
              }}
              disabled={stepNum > currentStep && !isDone}
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 4px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: stepNum <= currentStep || isDone ? 'pointer' : 'not-allowed',
                userSelect: 'none',
                transition: 'color 0.25s ease',
                color: isActive ? '#FFFFFF' : isDone ? '#334155' : '#94A3B8',
              }}
            >
              {/* Smooth Gliding Active Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="active-step-tab-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.8,
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.38), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Step Icon / Number Badge */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  fontWeight: 900,
                  flexShrink: 0,
                  transition: 'all 0.25s ease',
                  background: isActive
                    ? '#FFFFFF'
                    : isDone
                    ? '#0284C7'
                    : '#E2E8F0',
                  color: isActive
                    ? '#0284C7'
                    : isDone
                    ? '#FFFFFF'
                    : '#64748B',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {isDone ? <Check size={11} strokeWidth={3} /> : stepNum}
              </div>

              {/* Step Short Title */}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 800 : 600,
                }}
              >
                {info.shortTitle || info.title.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
