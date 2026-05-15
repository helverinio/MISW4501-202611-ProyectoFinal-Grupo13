export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8081/api/v1',
  extPaymentsBaseUrl: 'http://localhost:5001',
  emailJs: {
    enabled: true,
    endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
    serviceId: 'service_ir1ojbq',
    templateId: 'template_599obil', // Confirmación de reserva
    cancellationTemplateId: 'template_8yp6uod', // Cancelación de reserva
    verificationTemplateId: 'template_r0guto8', // Verificación de correo
    publicKey: 'iqjzNhxcPVbGXAAo4',
  },
};
