import React, { useState } from 'react';
import ForgotPass from '../components/ForgotPass';
import ResetPassForm from '../components/ResetPass';

const ResetPass = () => {
  const [step, setStep] = useState('forgot');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleCodeSent = (email) => {
    setRecoveryEmail(email);
    setStep('reset');
  };

  return (
    <div className="min-h-screen bg-alma-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-alma-border">
        <div className="flex items-center gap-3 mb-6">
          <span
            className={`h-2 flex-1 rounded-full ${
              step === 'forgot' ? 'bg-alma-olive' : 'bg-alma-olive/40'
            }`}
          />
          <span
            className={`h-2 flex-1 rounded-full ${
              step === 'reset' ? 'bg-alma-olive' : 'bg-alma-border'
            }`}
          />
        </div>

        {step === 'forgot' ? (
          <ForgotPass onSuccess={handleCodeSent} />
        ) : (
          <ResetPassForm initialEmail={recoveryEmail} />
        )}
      </div>
    </div>
  );
};

export default ResetPass;
