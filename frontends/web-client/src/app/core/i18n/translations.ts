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
  'footer.aboutUs': string;
  'footer.careers': string;
  'footer.press': string;
  'footer.contact': string;
  'footer.support': string;
  'footer.helpCenter': string;
  'footer.privacy': string;
  'footer.termsOfService': string;
  'footer.privacyPolicy': string;
  'footer.trustAndSafety': string;
  'footer.copyright': string;

  // Home Page
  'home.hero.title': string;
  'home.hero.welcomeTo': string;
  'home.hero.subtitle': string;
  'home.hero.badge.secure': string;
  'home.hero.badge.secureDesc': string;
  'home.hero.badge.free': string;
  'home.hero.badge.freeDesc': string;
  'home.hero.badge.support': string;
  'home.hero.badge.supportDesc': string;
  'home.hero.cta': string;
  'home.hero.ctaHint': string;
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
    'footer.description':
      'Your trusted partner for hotel bookings across Latin America. Secure, simple, and reliable.',
    'footer.company': 'Company',
    'footer.about': 'About',
    'footer.aboutUs': 'About Us',
    'footer.careers': 'Careers',
    'footer.press': 'Press',
    'footer.contact': 'Contact',
    'footer.support': 'Support',
    'footer.helpCenter': 'Help Center',
    'footer.privacy': 'Privacy',
    'footer.termsOfService': 'Terms of Service',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.trustAndSafety': 'Trust & Safety',
    'footer.copyright': '© 2026 TravelHub. All rights reserved.',

    // Home Page
    'home.hero.title': 'Welcome to TravelHub',
    'home.hero.welcomeTo': 'Welcome to',
    'home.hero.subtitle':
      'Discover amazing hotels across Latin America with secure booking, free cancellation, and 24/7 support.',
    'home.hero.badge.secure': 'Secure Payment',
    'home.hero.badge.secureDesc':
      'Your payment information is protected with industry-leading security',
    'home.hero.badge.free': 'Free cancellation',
    'home.hero.badge.freeDesc':
      'Cancel or modify your booking without penalties on most properties',
    'home.hero.badge.support': '24/7 support',
    'home.hero.badge.supportDesc': 'Get help anytime with our dedicated customer support team',
    'home.hero.cta': "I'm a Traveler",
    'home.hero.ctaHint': 'Start exploring amazing destinations',
    'home.features.title': 'Why Choose TravelHub?',
    'home.features.subtitle':
      'Experience the best of Latin America with our carefully curated hotel selection and seamless booking process.',
    'home.features.localExpertise': 'Local expertise',
    'home.features.localExpertiseDesc':
      'Handpicked properties across Latin America with local insights',
    'home.features.instantBooking': 'Instant Booking',
    'home.features.instantBookingDesc': 'Quick and easy reservations in just a few clicks',
    'home.features.bestRates': 'Best Rates',
    'home.features.bestRatesDesc': 'Competitive prices with exclusive deals and discounts',
    'home.features.mobileReady': 'Mobile Ready',
    'home.features.mobileReadyDesc': 'Seamless experience across all your devices',
    'home.destinations.title': 'Popular Destinations',
    'home.destinations.subtitle': 'Discover the most sought-after locations across Latin America',

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
    'dashboard.supportDesc':
      'Get direct assistance and priority support from the traveler console.',

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
    'footer.description':
      'Tu socio de confianza para reservas de hoteles en América Latina. Seguro, simple y confiable.',
    'footer.company': 'Empresa',
    'footer.about': 'Acerca de',
    'footer.aboutUs': 'Sobre nosotros',
    'footer.careers': 'Carreras',
    'footer.press': 'Prensa',
    'footer.contact': 'Contacto',
    'footer.support': 'Soporte',
    'footer.helpCenter': 'Centro de ayuda',
    'footer.privacy': 'Privacidad',
    'footer.termsOfService': 'Términos del servicio',
    'footer.privacyPolicy': 'Política de privacidad',
    'footer.trustAndSafety': 'Confianza y seguridad',
    'footer.copyright': '© 2026 TravelHub. Todos los derechos reservados.',

    // Home Page
    'home.hero.title': 'Bienvenido a TravelHub',
    'home.hero.welcomeTo': 'Bienvenido a',
    'home.hero.subtitle':
      'Descubre hoteles increíbles en América Latina con reserva segura, cancelación gratuita y soporte 24/7.',
    'home.hero.badge.secure': 'Pago Seguro',
    'home.hero.badge.secureDesc':
      'Tu información de pago está protegida con seguridad de nivel líder en la industria',
    'home.hero.badge.free': 'Cancelación gratuita',
    'home.hero.badge.freeDesc':
      'Cancela o modifica tu reserva sin penalizaciones en la mayoría de propiedades',
    'home.hero.badge.support': 'Soporte 24/7',
    'home.hero.badge.supportDesc':
      'Obtén ayuda en cualquier momento con nuestro equipo de soporte dedicado',
    'home.hero.cta': 'Soy un viajero',
    'home.hero.ctaHint': 'Comienza a explorar destinos increíbles',
    'home.features.title': '¿Por qué elegir TravelHub?',
    'home.features.subtitle':
      'Vive lo mejor de América Latina con nuestra selección de hoteles cuidadosamente curada y un proceso de reserva sin fricciones.',
    'home.features.localExpertise': 'Experiencia local',
    'home.features.localExpertiseDesc':
      'Propiedades seleccionadas en toda América Latina con conocimiento local',
    'home.features.instantBooking': 'Reserva Instantánea',
    'home.features.instantBookingDesc': 'Reservas rápidas y sencillas en solo unos clics',
    'home.features.bestRates': 'Mejores Tarifas',
    'home.features.bestRatesDesc': 'Precios competitivos con ofertas y descuentos exclusivos',
    'home.features.mobileReady': 'Listo para Móvil',
    'home.features.mobileReadyDesc': 'Experiencia fluida en todos tus dispositivos',
    'home.destinations.title': 'Destinos Populares',
    'home.destinations.subtitle': 'Descubre las ubicaciones más buscadas en América Latina',

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
    'dashboard.billingDesc':
      'Seguimiento de facturas y actualizaciones de pago con sesiones seguras.',
    'dashboard.support': 'Soporte',
    'dashboard.supportDesc':
      'Obtén asistencia directa y soporte prioritario desde la consola del viajero.',

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
    'footer.description':
      'Seu parceiro de confiança para reservas de hotéis na América Latina. Seguro, simples e confiável.',
    'footer.company': 'Empresa',
    'footer.about': 'Sobre',
    'footer.aboutUs': 'Sobre nós',
    'footer.careers': 'Carreiras',
    'footer.press': 'Imprensa',
    'footer.contact': 'Contato',
    'footer.support': 'Suporte',
    'footer.helpCenter': 'Centro de ajuda',
    'footer.privacy': 'Privacidade',
    'footer.termsOfService': 'Termos de serviço',
    'footer.privacyPolicy': 'Política de privacidade',
    'footer.trustAndSafety': 'Confiança e segurança',
    'footer.copyright': '© 2026 TravelHub. Todos os direitos reservados.',

    // Home Page
    'home.hero.title': 'Bem-vindo ao TravelHub',
    'home.hero.welcomeTo': 'Bem-vindo ao',
    'home.hero.subtitle':
      'Descubra hotéis incríveis na América Latina com reserva segura, cancelamento gratuito e suporte 24/7.',
    'home.hero.badge.secure': 'Pagamento Seguro',
    'home.hero.badge.secureDesc':
      'Suas informações de pagamento são protegidas com segurança de nível líder do setor',
    'home.hero.badge.free': 'Cancelamento gratuito',
    'home.hero.badge.freeDesc':
      'Cancele ou modifique sua reserva sem penalidades na maioria das propriedades',
    'home.hero.badge.support': 'Suporte 24/7',
    'home.hero.badge.supportDesc':
      'Receba ajuda a qualquer momento com nossa equipe de suporte dedicada',
    'home.hero.cta': 'Sou um viajante',
    'home.hero.ctaHint': 'Comece a explorar destinos incríveis',
    'home.features.title': 'Por que escolher a TravelHub?',
    'home.features.subtitle':
      'Experimente o melhor da América Latina com nossa seleção cuidadosa de hotéis e um processo de reserva sem fricção.',
    'home.features.localExpertise': 'Experiência local',
    'home.features.localExpertiseDesc':
      'Propriedades selecionadas na América Latina com conhecimento local',
    'home.features.instantBooking': 'Reserva Instantânea',
    'home.features.instantBookingDesc': 'Reservas rápidas e fáceis em apenas alguns cliques',
    'home.features.bestRates': 'Melhores Tarifas',
    'home.features.bestRatesDesc': 'Preços competitivos com ofertas e descontos exclusivos',
    'home.features.mobileReady': 'Pronto para Mobile',
    'home.features.mobileReadyDesc': 'Experiência perfeita em todos os seus dispositivos',
    'home.destinations.title': 'Destinos Populares',
    'home.destinations.subtitle': 'Descubra os locais mais procurados na América Latina',

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
    'dashboard.supportDesc':
      'Obtenha assistência direta e suporte prioritário no console do viajante.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Credenciais inválidas. Verifique seu email e senha.',
    'auth.error.connectionError':
      'Não foi possível conectar ao serviço de autenticação. Verifique a configuração do backend.',
    'auth.error.unexpected': 'Erro inesperado na autenticação. Por favor tente novamente.',
  },
};
