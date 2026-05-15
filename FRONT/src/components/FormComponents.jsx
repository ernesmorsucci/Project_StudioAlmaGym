import React from 'react';

export const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-alma-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg
          ${hasError 
            ? 'border-red-300 focus:ring-red-400' 
            : 'border-alma-border'
          }
          ${className}
        `}
        {...props}
      />
      {hasError && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-alma-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg
          ${hasError 
            ? 'border-red-300 focus:ring-red-400' 
            : 'border-alma-border'
          }
          ${className}
        `}
        {...props}
      />
      {hasError && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options = [],
  required = false,
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-alma-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-alma-olive bg-alma-bg
          ${hasError 
            ? 'border-red-300 focus:ring-red-400' 
            : 'border-alma-border'
          }
          ${className}
        `}
        {...props}
      >
        <option value="">Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
