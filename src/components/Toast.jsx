// src/components/Toast.jsx - Centered Toast with Longer Duration
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message,
      duration: toast.duration || 8000, // Default 8 seconds (was 5)
      action: toast.action,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: 'success', title, message, ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: 'error', title, message, duration: 10000, ...options }); // Errors stay longer (10s)
    },
    [addToast]
  );

  const warning = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: 'warning', title, message, duration: 9000, ...options }); // Warnings stay 9s
    },
    [addToast]
  );

  const info = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: 'info', title, message, ...options });
    },
    [addToast]
  );

  const loading = useCallback(
    (title, message) => {
      return addToast({ 
        type: 'loading', 
        title, 
        message, 
        duration: Infinity 
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ success, error, warning, info, loading, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .toast-slide-in {
          animation: slideInDown 0.4s ease-out;
        }

        .toast-progress {
          animation-name: shrink;
          animation-timing-function: linear;
        }

        @media (max-width: 640px) {
          .toast-container {
            left: 1rem !important;
            right: 1rem !important;
            width: auto !important;
            transform: translateX(0) !important;
          }
        }
      `}</style>
      
      <div 
        className="toast-container"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '90%',
          maxWidth: '32rem',
          pointerEvents: 'none'
        }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </>
  );
};

const Toast = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle style={{ width: '1.5rem', height: '1.5rem' }} />,
    error: <XCircle style={{ width: '1.5rem', height: '1.5rem' }} />,
    warning: <AlertTriangle style={{ width: '1.5rem', height: '1.5rem' }} />,
    info: <Info style={{ width: '1.5rem', height: '1.5rem' }} />,
    loading: (
      <div style={{
        width: '1.5rem',
        height: '1.5rem',
        border: '2px solid white',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    ),
  };

  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    warning: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    info: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    loading: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  };

  return (
    <div
      className="toast-slide-in"
      style={{
        pointerEvents: 'auto',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div style={{
        background: colors[toast.type],
        color: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
            {icons[toast.type]}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontWeight: 'bold',
              fontSize: '1rem',
              marginBottom: '0.375rem',
              lineHeight: '1.4'
            }}>
              {toast.title}
            </h3>
            {toast.message && (
              <p style={{
                fontSize: '0.9375rem',
                opacity: 0.95,
                lineHeight: '1.6'
              }}>
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                style={{
                  marginTop: '0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'none'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'underline'}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {toast.type !== 'loading' && (
            <button
              onClick={onClose}
              style={{
                flexShrink: 0,
                padding: '0.375rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              aria-label="Close"
            >
              <X style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        {toast.duration !== Infinity && (
          <div style={{
            height: '0.3rem',
            backgroundColor: 'rgba(255, 255, 255, 0.25)'
          }}>
            <div
              className="toast-progress"
              style={{
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                animationDuration: `${toast.duration}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;