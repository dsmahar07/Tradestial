# Tradestial

A modern, fully-featured Next.js application built with TypeScript, Tailwind CSS, Radix UI, Framer Motion, and comprehensive tooling.

## 🚀 Features

- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type-safe development
- **Tailwind CSS** with custom design system
- **Radix UI** for accessible, unstyled components
- **Framer Motion** for smooth animations
- **Icon Libraries** - Lucide React & Heroicons
- **Professional Architecture** with organized folder structure
- **ESLint & Prettier** for code quality
- **CSS Variables** for theming support

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx    # Button with variants
│   │   ├── card.tsx      # Card components
│   │   ├── dialog.tsx    # Modal dialog
│   │   └── index.ts      # Barrel exports
│   ├── layout/           # Layout components
│   │   ├── header.tsx    # Site header
│   │   └── index.ts      # Barrel exports
│   └── index.ts          # Main barrel export
├── lib/                  # Utility functions
│   ├── utils.ts          # Common utilities (cn function)
│   ├── animations.ts     # Framer Motion presets
│   └── index.ts          # Barrel exports
├── types/                # TypeScript type definitions
│   └── index.ts          # Global types
└── constants/            # App constants
    └── index.ts          # Configuration constants
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React, Heroicons
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Code Quality**: ESLint, Prettier
- **Build Tool**: Turbopack

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and visit `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format files with Prettier
- `npm run format:check` - Check formatting with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## 🎨 Design System

The project includes a comprehensive design system with:

- **CSS Variables** for consistent theming
- **Component Variants** using class-variance-authority
- **Animation Presets** for common motion patterns
- **Utility Functions** for className merging
- **Accessible Components** built on Radix UI

## 🧩 Component Usage

### Button
```tsx
import { Button } from '@/components/ui'

<Button variant="default" size="lg">
  Click me
</Button>
```

### Dialog
```tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    Dialog content here
  </DialogContent>
</Dialog>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

## 🔧 Configuration

### Tailwind CSS
- Custom design system with CSS variables
- Extended color palette and animations
- Responsive breakpoints
- Dark mode support

### TypeScript
- Strict type checking
- Path aliases (`@/*` for `./src/*`)
- Component prop types

### ESLint & Prettier
- Next.js recommended rules
- TypeScript support
- Automatic formatting
- Tailwind class sorting

## 🎯 Best Practices

- **Component Organization**: UI components in `/ui`, layout components in `/layout`
- **Barrel Exports**: Clean imports using index.ts files
- **Type Safety**: Comprehensive TypeScript coverage
- **Animation**: Consistent motion design with Framer Motion
- **Accessibility**: Built on Radix UI primitives
- **Code Quality**: ESLint and Prettier integration

## 📦 Dependencies

### Production
- Next.js, React, React DOM
- Radix UI components
- Framer Motion
- Lucide React, Heroicons
- Tailwind CSS utilities

### Development
- TypeScript
- ESLint, Prettier
- Tailwind CSS, PostCSS, Autoprefixer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run format`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.