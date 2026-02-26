# Tochpan Coffee Website - Requirements

## Overview
Create a modern, single-page coffee roaster website for Tochpan, inspired by the design and functionality of specialty coffee roaster websites. The site should showcase coffee products with detailed flavor profiles and include a merchandise section.

## User Stories

### 1. As a visitor, I want to see an attractive hero section
**Acceptance Criteria:**
- 1.1 The page displays a prominent hero section at the top
- 1.2 Hero includes the Tochpan logo/branding
- 1.3 Hero includes a compelling tagline or welcome message
- 1.4 Hero has an appealing background (image or color)
- 1.5 Navigation elements are visible and accessible

### 2. As a coffee enthusiast, I want to browse coffee products with detailed information
**Acceptance Criteria:**
- 2.1 Coffee products are displayed as cards in a grid layout
- 2.2 Each coffee card shows the product name
- 2.3 Each card displays the origin country/region
- 2.4 Each card shows flavor profile indicators (sweetness, acidity, complexity)
- 2.5 Each card lists tasting notes (e.g., "Caramel, Citrus, Milk Chocolate")
- 2.6 Each card indicates the roast level (Light, Medium, Dark)
- 2.7 Cards are responsive and adapt to different screen sizes
- 2.8 Product images are displayed on each card

### 3. As a visitor, I want to see merchandise offerings
**Acceptance Criteria:**
- 3.1 A merchandise section is clearly separated from coffee products
- 3.2 Merchandise items are displayed as cards
- 3.3 Each merchandise card shows a product image
- 3.4 Each merchandise card displays the product name
- 3.5 Merchandise section is visually distinct but cohesive with overall design

### 4. As a mobile user, I want the website to work well on my device
**Acceptance Criteria:**
- 4.1 The layout is fully responsive across mobile, tablet, and desktop
- 4.2 Images scale appropriately for different screen sizes
- 4.3 Text remains readable on small screens
- 4.4 Touch targets are appropriately sized for mobile interaction
- 4.5 Grid layouts stack appropriately on smaller screens

### 5. As a visitor, I want a visually appealing and modern design
**Acceptance Criteria:**
- 5.1 The site uses a cohesive color scheme
- 5.2 Typography is clean and readable
- 5.3 Spacing and layout follow modern design principles
- 5.4 Interactive elements have hover states
- 5.5 The design reflects the brand identity of a specialty coffee roaster

## Technical Requirements

### Technology Stack
- HTML5 for structure
- CSS3 for styling (modern features like Grid, Flexbox)
- Vanilla JavaScript for any interactive elements
- No external frameworks required (keep it lightweight)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance
- Page should load quickly
- Images should be optimized
- Minimal external dependencies

### Content Integration
- Use existing images from the `/images` folder (tochpan-v2-*.jpg files)
- Use the Tochpan logo from `/brand` folder

## Constraints
- Single HTML file (version2.html) with embedded CSS and JavaScript
- Must be self-contained and work without a server
- Should not require build tools or compilation

## Out of Scope
- E-commerce functionality (shopping cart, checkout)
- Backend integration
- User accounts or authentication
- Content management system
- Multi-page navigation
