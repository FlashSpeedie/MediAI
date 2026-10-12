import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function NextImageMock(props: Record<string, unknown>) {
    return Object.assign(document.createElement('img'), props);
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const icons = [
    'Stethoscope', 'MessageSquare', 'Camera', 'Mic', 'History',
    'Shield', 'ArrowRight', 'Star', 'CheckCircle', 'Zap',
    'Brain', 'Heart', 'Users', 'RefreshCcw', 'Send',
    'Mic', 'MicOff', 'Camera', 'CameraOff', 'Loader2', 'ImagePlus',
    'Phone', 'AlertCircle', 'Clock', 'CheckCircle', 'User',
    'Search', 'Pill', 'AlertTriangle', 'Info', 'ChevronDown', 'ChevronUp',
    'ExternalLink', 'Trash2', 'Copy', 'CheckCheck', 'LogOut',
    'LayoutDashboard', 'UserCircle', 'Settings', 'HelpCircle', 'Sparkles',
    'Eye', 'EyeOff', 'Lock', 'Bell', 'ChevronRight', 'Edit3', 'X',
    'Activity', 'Heart', 'Home', 'Menu', 'X'
  ];
  const mocked: Record<string, unknown> = {};
  for (const icon of icons) {
    mocked[icon] = function LucideIconMock(props: Record<string, unknown>) {
      return Object.assign(document.createElement('svg'), { 'data-testid': `icon-${icon.toLowerCase()}`, ...props });
    };
  }
  return mocked;
});

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    symptomSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    healthSummary: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    familyGroup: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock next-auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Suppress console.error in tests unless explicitly testing errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && (firstArg.includes('Warning:') || firstArg.includes('act(...)'))) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});