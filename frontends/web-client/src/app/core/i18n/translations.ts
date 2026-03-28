export type LanguageCode = 'en' | 'es' | 'pt';

export interface Translation {
  // Navigation & Layout
  'nav.backToHome': string;
  'nav.home': string;
  'nav.signIn': string;
  'nav.bookNow': string;
  'nav.dashboard': string;
  'nav.logout': string;
  'footer.description': string;
  'footer.company': string;
  'footer.about': string;
  'footer.contact': string;
  'footer.support': string;
  'footer.helpCenter': string;
  'footer.privacy': string;
  'footer.copyright': string;

  // Home Page
  'home.hero.title': string;
  'home.hero.subtitle': string;
  'home.hero.badge.secure': string;
  'home.hero.badge.secureDesc': string;
  'home.hero.badge.free': string;
  'home.hero.badge.freeDesc': string;
  'home.hero.badge.support': string;
  'home.hero.badge.supportDesc': string;
  'home.hero.cta': string;
  'home.features.title': string;
  'home.features.subtitle': string;
  'home.features.localExpertise': string;
  'home.features.localExpertiseDesc': string;
  'home.features.instantBooking': string;
  'home.features.instantBookingDesc': string;
  'home.features.bestRates': string;
  'home.features.bestRatesDesc': string;
  'home.features.mobileReady': string;
  'home.features.mobileReadyDesc': string;
  'home.destinations.title': string;
  'home.destinations.subtitle': string;

  // Login Page
  'login.title': string;
  'login.subtitle': string;
  'login.signIn': string;
  'login.createAccount': string;
  'login.welcome': string;
  'login.secure': string;
  'login.secureDesc': string;
  'login.users': string;
  'login.usersSubtitle': string;
  'login.form.email': string;
  'login.form.emailPlaceholder': string;
  'login.form.password': string;
  'login.form.passwordPlaceholder': string;
  'login.form.rememberMe': string;
  'login.form.forgotPassword': string;
  'login.form.signInButton': string;
  'login.form.signingIn': string;
  'login.form.errors.emailRequired': string;
  'login.form.errors.passwordRequired': string;
  'login.form.errors.passwordMinLength': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.welcome': string;
  'dashboard.logout': string;
  'dashboard.myTrips': string;
  'dashboard.myTripsDesc': string;
  'dashboard.billing': string;
  'dashboard.billingDesc': string;
  'dashboard.support': string;
  'dashboard.supportDesc': string;

  // Auth Errors
  'auth.error.invalidCredentials': string;
  'auth.error.connectionError': string;
  'auth.error.unexpected': string;
}

export const translations: Record<LanguageCode, Translation> = {
  en: {
    // Navigation & Layout
    'nav.backToHome': 'Back to Home',
    'nav.home': 'Home',
    'nav.signIn': 'Sign in',
    'nav.bookNow': 'Book now',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'footer.description': 'Secure hotel booking in Latin America with real-time availability and free cancellation options.',
    'footer.company': 'Company',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.support': 'Support',
    'footer.helpCenter': 'Help center',
    'footer.privacy': 'Privacy',
    'footer.copyright': '2026 TravelHub. All rights reserved.',

    // Home Page
    'home.hero.title': 'Welcome to TravelHub',
    'home.hero.subtitle': 'Discover curated hotels across Latin America with secure payment, free cancellation, and support all day.',
    'home.hero.badge.secure': 'Secure payment',
    'home.hero.badge.secureDesc': 'Industry-grade tokenized checkout.',
    'home.hero.badge.free': 'Free cancellation',
    'home.hero.badge.freeDesc': 'Flexible changes in selected properties.',
    'home.hero.badge.support': '24/7 support',
    'home.hero.badge.supportDesc': 'Fast response from our travel team.',
    'home.hero.cta': 'I am a traveler',
    'home.features.title': 'Why choose TravelHub',
    'home.features.subtitle': 'Seamless booking and local expertise designed for real travelers.',
    'home.features.localExpertise': 'Local expertise',
    'home.features.localExpertiseDesc': 'Handpicked properties and regional insights.',
    'home.features.instantBooking': 'Instant booking',
    'home.features.instantBookingDesc': 'Reserve your room in just a few clicks.',
    'home.features.bestRates': 'Best rates',
    'home.features.bestRatesDesc': 'Exclusive offers and transparent pricing.',
    'home.features.mobileReady': 'Mobile ready',
    'home.features.mobileReadyDesc': 'Optimized experience across every device.',
    'home.destinations.title': 'Popular destinations',
    'home.destinations.subtitle': 'Explore the most sought-after spots in Latin America.',

    // Login Page
    'login.title': 'Welcome to TravelHub',
    'login.subtitle': 'Sign in to your account or create a new one',
    'login.signIn': 'Sign In',
    'login.createAccount': 'Create Account',
    'login.welcome': 'Welcome back',
    'login.secure': 'Secure',
    'login.secureDesc': 'Bank-level encryption',
    'login.users': '1M+',
    'login.usersSubtitle': 'Happy travelers',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'tu@email.com',
    'login.form.password': 'Password',
    'login.form.passwordPlaceholder': 'Your password',
    'login.form.rememberMe': 'Remember me',
    'login.form.forgotPassword': 'Forgot your password?',
    'login.form.signInButton': 'Sign In',
    'login.form.signingIn': 'Signing in...',
    'login.form.errors.emailRequired': 'Email is required',
    'login.form.errors.passwordRequired': 'Password is required',
    'login.form.errors.passwordMinLength': 'Minimum 6 characters',

    // Dashboard
    'dashboard.title': 'My Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.logout': 'Logout',
    'dashboard.myTrips': 'My trips',
    'dashboard.myTripsDesc': 'Review reservations and changes in one place.',
    'dashboard.billing': 'Billing',
    'dashboard.billingDesc': 'Track invoices and payment updates with secure sessions.',
    'dashboard.support': 'Support',
    'dashboard.supportDesc': 'Get direct assistance and priority support from the traveler console.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Invalid credentials. Check your email and password.',
    'auth.error.connectionError':
      'Unable to connect to authentication service. Verify backend host configuration.',
    'auth.error.unexpected': 'Unexpected authentication error. Please retry.',
  },

  es: {
    // Navigation & Layout
    'nav.backToHome': 'Volver al Inicio',
    'nav.home': 'Inicio',
    'nav.signIn': 'Iniciar sesión',
    'nav.bookNow': 'Reservar ahora',
    'nav.dashboard': 'Panel de Control',
    'nav.logout': 'Cerrar Sesión',
    'footer.description': 'Reserva segura de hoteles en América Latina con disponibilidad en tiempo real y opciones de cancelación gratuita.',
    'footer.company': 'Empresa',
    'footer.about': 'Acerca de',
    'footer.contact': 'Contacto',
    'footer.support': 'Soporte',
    'footer.helpCenter': 'Centro de ayuda',
    'footer.privacy': 'Privacidad',
    'footer.copyright': '2026 TravelHub. Todos los derechos reservados.',

    // Home Page
    'home.hero.title': 'Bienvenido a TravelHub',
    'home.hero.subtitle': 'Descubre hoteles curados en toda América Latina con pago seguro, cancelación gratuita y soporte todo el día.',
    'home.hero.badge.secure': 'Pago seguro',
    'home.hero.badge.secureDesc': 'Checkout tokenizado de grado industrial.',
    'home.hero.badge.free': 'Cancelación gratuita',
    'home.hero.badge.freeDesc': 'Cambios flexibles en propiedades seleccionadas.',
    'home.hero.badge.support': 'Soporte 24/7',
    'home.hero.badge.supportDesc': 'Respuesta rápida de nuestro equipo de viajes.',
    'home.hero.cta': 'Soy un viajero',
    'home.features.title': 'Por qué elegir TravelHub',
    'home.features.subtitle': 'Reserva sin problemas y experiencia local diseñada para viajeros reales.',
    'home.features.localExpertise': 'Experiencia local',
    'home.features.localExpertiseDesc': 'Propiedades cuidadosamente seleccionadas e información regional.',
    'home.features.instantBooking': 'Reserva instantánea',
    'home.features.instantBookingDesc': 'Reserva tu habitación en solo unos pocos clics.',
    'home.features.bestRates': 'Mejores tarifas',
    'home.features.bestRatesDesc': 'Ofertas exclusivas y precios transparentes.',
    'home.features.mobileReady': 'Optimizado para móvil',
    'home.features.mobileReadyDesc': 'Experiencia optimizada en todos los dispositivos.',
    'home.destinations.title': 'Destinos populares',
    'home.destinations.subtitle': 'Explora los lugares más buscados en América Latina.',

    // Login Page
    'login.title': 'Bienvenido a TravelHub',
    'login.subtitle': 'Inicia sesión en tu cuenta o crea una nueva',
    'login.signIn': 'Iniciar Sesión',
    'login.createAccount': 'Crear Cuenta',
    'login.welcome': 'Bienvenido de vuelta',
    'login.secure': 'Seguro',
    'login.secureDesc': 'Cifrado de nivel bancario',
    'login.users': '1M+',
    'login.usersSubtitle': 'Viajeros felices',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'tu@email.com',
    'login.form.password': 'Contraseña',
    'login.form.passwordPlaceholder': 'Tu contraseña',
    'login.form.rememberMe': 'Recuérdame',
    'login.form.forgotPassword': '¿Olvidaste tu contraseña?',
    'login.form.signInButton': 'Iniciar Sesión',
    'login.form.signingIn': 'Iniciando sesión...',
    'login.form.errors.emailRequired': 'Email es requerido',
    'login.form.errors.passwordRequired': 'Contraseña es requerida',
    'login.form.errors.passwordMinLength': 'Mínimo 6 caracteres',

    // Dashboard
    'dashboard.title': 'Mi Panel',
    'dashboard.welcome': 'Bienvenido de vuelta',
    'dashboard.logout': 'Cerrar Sesión',
    'dashboard.myTrips': 'Mis viajes',
    'dashboard.myTripsDesc': 'Revisa reservas y cambios en un solo lugar.',
    'dashboard.billing': 'Facturación',
    'dashboard.billingDesc': 'Seguimiento de facturas y actualizaciones de pago con sesiones seguras.',
    'dashboard.support': 'Soporte',
    'dashboard.supportDesc': 'Obtén asistencia directa y soporte prioritario desde la consola del viajero.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'auth.error.connectionError':
      'No se pudo conectar al servicio de autenticación. Verifica la configuración del backend.',
    'auth.error.unexpected': 'Error inesperado en la autenticación. Por favor intenta de nuevo.',
  },

  pt: {
    // Navigation & Layout
    'nav.backToHome': 'Voltar para Home',
    'nav.home': 'Início',
    'nav.signIn': 'Entrar',
    'nav.bookNow': 'Reservar agora',
    'nav.dashboard': 'Painel de Controle',
    'nav.logout': 'Sair',
    'footer.description': 'Reserva segura de hotéis na América Latina com disponibilidade em tempo real e opções de cancelamento gratuito.',
    'footer.company': 'Empresa',
    'footer.about': 'Sobre',
    'footer.contact': 'Contato',
    'footer.support': 'Suporte',
    'footer.helpCenter': 'Centro de ajuda',
    'footer.privacy': 'Privacidade',
    'footer.copyright': '2026 TravelHub. Todos os direitos reservados.',

    // Home Page
    'home.hero.title': 'Bem-vindo ao TravelHub',
    'home.hero.subtitle': 'Descubra hotéis curados em toda a América Latina com pagamento seguro, cancelamento gratuito e suporte o dia todo.',
    'home.hero.badge.secure': 'Pagamento seguro',
    'home.hero.badge.secureDesc': 'Checkout tokenizado de nível industrial.',
    'home.hero.badge.free': 'Cancelamento gratuito',
    'home.hero.badge.freeDesc': 'Mudanças flexíveis em propriedades selecionadas.',
    'home.hero.badge.support': 'Suporte 24/7',
    'home.hero.badge.supportDesc': 'Resposta rápida do nosso time de viagens.',
    'home.hero.cta': 'Sou um viajante',
    'home.features.title': 'Por que escolher TravelHub',
    'home.features.subtitle': 'Reserva perfeita e experiência local projetada para viajantes reais.',
    'home.features.localExpertise': 'Experiência local',
    'home.features.localExpertiseDesc': 'Propriedades selecionadas à mão e insights regionais.',
    'home.features.instantBooking': 'Reserva instantânea',
    'home.features.instantBookingDesc': 'Reserve seu quarto em apenas alguns cliques.',
    'home.features.bestRates': 'Melhores tarifas',
    'home.features.bestRatesDesc': 'Ofertas exclusivas e preços transparentes.',
    'home.features.mobileReady': 'Otimizado para móvel',
    'home.features.mobileReadyDesc': 'Experiência otimizada em todos os dispositivos.',
    'home.destinations.title': 'Destinos populares',
    'home.destinations.subtitle': 'Explore os lugares mais procurados na América Latina.',

    // Login Page
    'login.title': 'Bem-vindo ao TravelHub',
    'login.subtitle': 'Faça login em sua conta ou crie uma nova',
    'login.signIn': 'Entrar',
    'login.createAccount': 'Criar Conta',
    'login.welcome': 'Bem-vindo de volta',
    'login.secure': 'Seguro',
    'login.secureDesc': 'Criptografia de nível bancário',
    'login.users': '1M+',
    'login.usersSubtitle': 'Viajantes felizes',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'seu@email.com',
    'login.form.password': 'Senha',
    'login.form.passwordPlaceholder': 'Sua senha',
    'login.form.rememberMe': 'Lembre-se de mim',
    'login.form.forgotPassword': 'Esqueceu sua senha?',
    'login.form.signInButton': 'Entrar',
    'login.form.signingIn': 'Entrando...',
    'login.form.errors.emailRequired': 'Email é obrigatório',
    'login.form.errors.passwordRequired': 'Senha é obrigatória',
    'login.form.errors.passwordMinLength': 'Mínimo 6 caracteres',

    // Dashboard
    'dashboard.title': 'Meu Painel',
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.logout': 'Sair',
    'dashboard.myTrips': 'Minhas viagens',
    'dashboard.myTripsDesc': 'Revise reservas e alterações em um único lugar.',
    'dashboard.billing': 'Faturamento',
    'dashboard.billingDesc': 'Rastreie faturas e atualizações de pagamento com sessões seguras.',
    'dashboard.support': 'Suporte',
    'dashboard.supportDesc': 'Obtenha assistência direta e suporte prioritário no console do viajante.',

    // Auth Errors
    'auth.error.invalidCredentials':
      'Credenciais inválidas. Verifique seu email e senha.',
    'auth.error.connectionError':
      'Não foi possível conectar ao serviço de autenticação. Verifique a configuração do backend.',
    'auth.error.unexpected':
      'Erro inesperado na autenticação. Por favor tente novamente.',
  },
};
