import { useState, useCallback, useEffect, useRef } from 'react';

// Reglas de validación por tipo de campo
const validationRules = {
  email: {
    required: 'El correo es obligatorio',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Ingresa un correo válido',
  },
  password: {
    required: 'La contraseña es obligatoria',
    minLength: 6,
    minLengthMessage: 'Mínimo 6 caracteres',
  },
  name: {
    required: 'El nombre es obligatorio',
    minLength: 2,
    minLengthMessage: 'Mínimo 2 caracteres',
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]{7,}$/,
    patternMessage: 'Teléfono no válido (mínimo 7 caracteres)',
  },
  className: {
    required: 'El nombre de la clase es obligatorio',
    minLength: 2,
    minLengthMessage: 'Mínimo 2 caracteres',
  },
  planName: {
    required: 'El nombre del plan es obligatorio',
    minLength: 2,
    minLengthMessage: 'Mínimo 2 caracteres',
  },
  weeklyClasses: {
    required: 'Las clases por semana son obligatorias',
    min: 1,
    minMessage: 'Debe ser mayor a 0',
  },
  price: {
    required: 'El precio es obligatorio',
    min: 0,
    minMessage: 'El precio no puede ser negativo',
  },
  maxQuota: {
    required: 'El cupo máximo es obligatorio',
    min: 1,
    minMessage: 'Debe ser mayor a 0',
  },
  dateTime: {
    required: 'La fecha y hora son obligatorias',
  },
  endTime: {
    required: 'La hora de fin es obligatoria',
  },
};

export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Validar un campo individual
  const validateField = useCallback((fieldName, value) => {
    const rules = validationSchema[fieldName] || validationRules[fieldName];
    if (!rules) return null;

    // Validar requerido
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.required;
    }

    if (!value) return null; // Si no es requerido y está vacío, es válido

    // Validar patrón regex
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Formato inválido';
    }

    // Validar longitud mínima
    if (rules.minLength && value.length < rules.minLength) {
      return rules.minLengthMessage || `Mínimo ${rules.minLength} caracteres`;
    }

    // Validar número mínimo
    if (rules.min !== undefined && Number(value) < rules.min) {
      return rules.minMessage || `Debe ser mayor a ${rules.min}`;
    }

    // Validar número máximo
    if (rules.max !== undefined && Number(value) > rules.max) {
      return rules.maxMessage || `Debe ser menor a ${rules.max}`;
    }

    return null;
  }, [validationSchema]);

  // Manejar cambio en campo
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Validar automáticamente si el campo ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  // Manejar blur en campo
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, [validateField]);

  // Validar todos los campos
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validationSchema.length ? validationSchema : validationRules).forEach((fieldName) => {
      if (fieldName in values || validationSchema[fieldName]) {
        const error = validateField(fieldName, values[fieldName] || '');
        if (error) {
          newErrors[fieldName] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField, validationSchema]);

  // Manejar envío del formulario
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      if (validateForm()) {
        try {
          await onSubmit(values);
        } catch (err) {
          console.error('Error en submit:', err);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [values, validateForm]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
  }, []);

  // Setear valores manualmente
  const setFieldValue = useCallback((fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  // Setear error manualmente
  const setFieldError = useCallback((fieldName, error) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
  };
};

export default useFormValidation;
