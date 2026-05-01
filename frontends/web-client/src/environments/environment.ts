export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8081/api/v1',
  emailJs: {
    enabled: true,
    endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
    serviceId: 'service_ir1ojbq',
    templateId: 'template_599obil',  // Confirmación de reserva
    cancellationTemplateId: 'template_cancellation',  // Cancelación de reserva (REEMPLAZAR con ID real)
    publicKey: 'iqjzNhxcPVbGXAAo4',
  },
};
