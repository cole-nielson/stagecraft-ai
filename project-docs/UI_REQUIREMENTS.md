# StageCraft AI - UI/UX Requirements & Design System

## 🎨 **Design Philosophy: Luxury Meets Simplicity**

StageCraft AI should feel like **the Sotheby's of AI staging tools** - sophisticated, premium, trustworthy, but never intimidating or complex.

### Design Principles
1. **Premium First**: Every pixel should reinforce luxury positioning
2. **Effortless Sophistication**: Complex AI, beautifully simple interface
3. **Professional Trust**: Build confidence through thoughtful design details
4. **Image-Centric**: The staged rooms are the heroes, UI supports them
5. **Timeless Elegance**: Avoid trends, focus on enduring sophistication

## 🎯 **Brand Identity & Visual System**

### Logo Concept: "StageCraft AI"
**Primary Mark**: Sophisticated wordmark with custom typography
- **"Stage"** in elegant serif (think Playfair Display or custom)
- **"Craft"** in clean sans-serif (think Inter or similar)
- **"AI"** as subtle superscript in lighter weight

**Icon Mark**: Minimal geometric house/room outline with subtle AI accent
- Clean architectural lines
- Possibly incorporating a "spark" or geometric element suggesting AI
- Works at 16px (favicon) and scales beautifully

### Color Palette
```css
/* Primary Colors */
--sage-navy: #1B365D;        /* Primary brand color - luxury navy */
--warm-gold: #C9A961;        /* Accent - sophisticated gold */
--pure-white: #FFFFFF;       /* Clean backgrounds */
--off-white: #FEFDF8;        /* Warmer backgrounds */

/* Supporting Colors */
--charcoal: #2D3748;         /* Text, strong contrast */
--warm-gray: #718096;        /* Secondary text */
--light-gray: #EDF2F7;       /* Subtle borders, backgrounds */
--success-sage: #38A169;     /* Success states */
--warning-amber: #D69E2E;    /* Warnings, in-progress */
--error-burgundy: #C53030;   /* Errors, failures */

/* Luxury Gradients */
--gradient-primary: linear-gradient(135deg, #1B365D 0%, #2D3748 100%);
--gradient-accent: linear-gradient(135deg, #C9A961 0%, #D4AF37 100%);
--gradient-subtle: linear-gradient(135deg, #FEFDF8 0%, #F7FAFC 100%);
```

### Typography System
```css
/* Primary Font: Display & Headings */
@import 'Playfair Display'; /* Sophisticated serif for headings */

/* Secondary Font: Body & UI */  
@import 'Inter'; /* Clean, professional sans-serif */

/* Optional: Luxury Script for special occasions */
@import 'Allura'; /* Elegant script for premium badges/accents */

/* Hierarchy */
.heading-xl: 3.5rem; /* 56px - Hero headings */
.heading-lg: 2.25rem; /* 36px - Page headings */
.heading-md: 1.5rem; /* 24px - Section headings */
.heading-sm: 1.25rem; /* 20px - Card headings */

.body-lg: 1.125rem; /* 18px - Important body text */
.body-base: 1rem; /* 16px - Default body text */
.body-sm: 0.875rem; /* 14px - Secondary text */
.body-xs: 0.75rem; /* 12px - Captions, metadata */
```

### Component Library Strategy

**Primary: Use Mantine with Heavy Customization**
```bash
npm install @mantine/core @mantine/hooks @mantine/form @mantine/dropzone
```

**Why Mantine:**
- Professional, not consumer-focused
- Excellent customization capabilities  
- Great image handling components
- Sophisticated default styling that we can elevate

**Key Customizations:**
- Replace all default colors with our luxury palette
- Custom button styles with premium hover effects
- Elegant form components with luxury touches
- Premium loading states and animations

**Supplementary: Framer Motion for Premium Animations**
```bash
npm install framer-motion
```

**Custom Components to Build:**
- Premium file upload with drag/drop luxury styling
- Before/after image comparison slider
- Elegant style selector cards
- Professional loading animations
- Luxury tooltip system

## 📱 **Layout & Structure**

### Overall Layout Philosophy
- **Generous White Space**: Never cramped, always breathable
- **Image-First Design**: Staged rooms dominate the interface
- **Subtle Luxury Details**: Premium touches without being flashy
- **Professional Hierarchy**: Clear information architecture

### Responsive Approach
```css
/* Desktop First (Luxury users primarily on desktop/tablet) */
.container-max: 1400px; /* Wide enough for large staged images */
.container-content: 1200px; /* Standard content width */
.container-narrow: 800px; /* Text-focused sections */

/* Breakpoints */
--desktop: 1200px;
--tablet: 768px; 
--mobile: 480px;
```

## 🏠 **Key User Interface Screens**

### 1. Landing Page
**Hero Section**:
```
[Premium Background - Subtle pattern or luxury property image]
  
  StageCraft AI
  The most sophisticated staging for luxury real estate
  
  [Premium CTA Button: "Start Staging"] [Secondary: "View Examples"]
  
  "Trusted by top real estate professionals"
  [Logos: Sotheby's, Compass, Coldwell Banker style logos]
```

**Before/After Gallery**:
- Large, high-quality before/after comparisons
- Elegant image slider/fade transitions
- Property details: "$2.3M • Beverly Hills • Modern Luxury Style"
- Subtle animations on scroll

### 2. Main Staging Interface
**Layout Structure**:
```
[Header: Logo | Navigation | Account]

[Main Content Area]
┌─ Upload Zone (50% width) ────────┐ ┌─ Style Selection (50% width) ──┐
│                                  │ │                                 │
│  [Premium Drag & Drop Area]      │ │   Choose Your Style             │
│                                  │ │                                 │
│  "Drop your room photo here"     │ │   [Style Cards Grid]            │
│  or click to browse              │ │   • Modern Luxury               │
│                                  │ │   • Classic Elegance            │
│  [Upload Guidelines]             │ │   • Contemporary Chic           │
│  • High resolution preferred     │ │                                 │
│  • Empty rooms work best         │ │   [Advanced Options]            │
│  • Natural lighting optimal     │ │   Room Type: Auto-detect        │
│                                  │ │   Quality: Premium              │
└──────────────────────────────────┘ └─────────────────────────────────┘

[Generate Button - Premium styling, disabled until image + style selected]
```

### 3. Processing & Results
**Processing State**:
```
[Progress Indicator - Elegant, not generic]
  Analyzing your space...           ●●●○○ 
  Selecting luxury furnishings...   ●●●●○
  Finalizing professional staging...●●●●●

  Estimated time: 25 seconds
  
[Preview of original image with subtle overlay effects]
```

**Results Display**:
```
┌─ Original (30% width) ─┐  ┌─ Staged Result (70% width) ────────────────┐
│                        │  │                                            │
│  [Original Image]      │  │  [Large Staged Image]                      │
│                        │  │                                            │
│  Before                │  │  After: Modern Luxury                      │
│                        │  │                                            │
└────────────────────────┘  │  [Download] [Try Different Style] [Share]  │
                            └────────────────────────────────────────────┘

[Quality Metrics - Subtle, professional]
✓ Architectural integrity preserved
✓ Professional quality verified  
⚡ Processed in 23 seconds
```

## 🎨 **Premium Component Specifications**

### File Upload Component
```jsx
<PremiumUpload>
  {/* Sophisticated drag & drop area */}
  <div className="upload-zone">
    <div className="upload-icon">
      {/* Custom luxury camera/home icon */}
    </div>
    <h3>Drop your room photo here</h3>
    <p>or click to browse your files</p>
    
    {/* Upload guidelines in elegant typography */}
    <div className="upload-tips">
      <span>💡 Best results with high-resolution, empty room photos</span>
    </div>
  </div>
</PremiumUpload>
```

### Style Selection Cards
```jsx
<StyleSelector>
  {styles.map(style => (
    <StyleCard 
      key={style.id}
      selected={selected === style.id}
      className="luxury-card"
    >
      <div className="style-preview">
        <img src={style.previewImage} alt={style.name} />
        <div className="style-overlay">
          <CheckIcon className={selected ? 'visible' : 'hidden'} />
        </div>
      </div>
      
      <div className="style-info">
        <h4>{style.name}</h4>
        <p>{style.description}</p>
        <span className="best-for">Best for: {style.bestFor}</span>
      </div>
    </StyleCard>
  ))}
</StyleSelector>
```

### Premium Button System
```css
/* Primary CTA - Luxury gradient */
.btn-primary {
  background: var(--gradient-accent);
  color: var(--charcoal);
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 8px;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(201, 169, 97, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(201, 169, 97, 0.4);
}

/* Secondary - Elegant outline */
.btn-secondary {
  background: transparent;
  color: var(--sage-navy);
  border: 2px solid var(--sage-navy);
  font-weight: 500;
  padding: 10px 30px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--sage-navy);
  color: var(--pure-white);
}
```

### Loading States
```jsx
<PremiumLoader>
  {/* Sophisticated loading animation - not generic spinner */}
  <div className="luxury-loader">
    <div className="loader-icon">
      {/* Custom animated icon - house being "staged" */}
    </div>
    <div className="loader-progress">
      <div className="progress-bar" style={{width: `${progress}%`}} />
    </div>
    <p className="loader-text">{currentStep}</p>
    <span className="loader-time">Estimated: {remainingTime}s</span>
  </div>
</PremiumLoader>
```

## 🔄 **User Experience Flows**

### Primary Flow: Single Room Staging
1. **Landing**: User arrives, sees premium examples, understands value prop
2. **Upload**: Drag & drop room photo with instant preview
3. **Style Selection**: Choose from 3-5 luxury style options
4. **Processing**: Elegant loading with progress and time estimates
5. **Results**: Before/after comparison with download options
6. **Actions**: Download, try different style, or stage another room

### Secondary Flow: Account Creation (Phase 2)
1. **Trigger**: After first successful staging, offer account creation
2. **Value Prop**: "Save your stagings and get 10 more free"
3. **Simple Form**: Email, password, company (optional)
4. **Immediate Value**: Show saved staging, offer batch processing

### Error States & Edge Cases
- **Poor Image Quality**: Helpful guidance, not just "error"
- **Processing Failed**: "Let me try a different approach" button
- **No Interior Detected**: Educational messaging with examples
- **Service Unavailable**: Professional maintenance message

## 📐 **Design System Specifications**

### Spacing System
```css
--space-xs: 4px;   /* 0.25rem */
--space-sm: 8px;   /* 0.5rem */
--space-md: 16px;  /* 1rem */
--space-lg: 24px;  /* 1.5rem */
--space-xl: 32px;  /* 2rem */
--space-2xl: 48px; /* 3rem */
--space-3xl: 64px; /* 4rem */
```

### Border Radius
```css
--radius-sm: 4px;   /* Small elements */
--radius-md: 8px;   /* Buttons, cards */
--radius-lg: 12px;  /* Large cards, modals */
--radius-xl: 16px;  /* Hero elements */
--radius-full: 50%; /* Circular elements */
```

### Shadows (Luxury-appropriate)
```css
--shadow-sm: 0 2px 4px rgba(27, 54, 93, 0.1);
--shadow-md: 0 4px 12px rgba(27, 54, 93, 0.15);
--shadow-lg: 0 8px 25px rgba(27, 54, 93, 0.2);
--shadow-xl: 0 20px 40px rgba(27, 54, 93, 0.25);
```

## 🚀 **Implementation Priorities**

### Phase 1: Core Interface (MVP)
- Landing page with premium examples
- Single room staging interface  
- 3 luxury style options
- Professional loading and results display
- Mobile-responsive layout

### Phase 2: Professional Features
- Account creation and login
- Staging history and organization  
- Batch upload interface
- Advanced style options
- Professional sharing features

### Phase 3: Premium Polish  
- Advanced animations and microinteractions
- Custom illustrations and iconography
- A/B testing framework for design optimization
- White-label options for real estate agencies

## 📱 **Mobile Considerations**

### Mobile-First Elements
- Touch-optimized upload area
- Simplified style selection (swipe through options)
- Full-screen image viewing
- Easy sharing to social/messaging apps

### Desktop Advantages  
- Side-by-side before/after comparison
- Drag & drop file uploading
- Keyboard shortcuts for power users
- Multiple image processing

## 🎯 **Success Metrics**

### Design Success Indicators
- **Conversion Rate**: % of visitors who complete first staging
- **Professional Perception**: User feedback on "premium feel"
- **Task Completion**: % who successfully upload and stage
- **Return Rate**: % who come back to stage more rooms
- **NPS Score**: Net Promoter Score from real estate professionals

### A/B Testing Opportunities
- Different color schemes for luxury positioning
- Various loading animations and progress indicators  
- Alternative style selection interfaces
- Different call-to-action button copy and styling