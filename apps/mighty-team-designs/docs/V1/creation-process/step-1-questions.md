# Step 1: Team Information - Creation Process V1

## 🎯 **Step 1 Overview**

The first step in the creation process focuses on gathering basic team information through three sequential questions, each with visual examples to guide the user's choice.

## 📱 **Question Flow Structure**

### **Question 1: Team Name**
- **Type**: Text input
- **Purpose**: Personalize the experience
- **Validation**: Required, 2-50 characters
- **Placeholder**: "Enter your team name"

### **Question 2: Sport**
- **Type**: Dropdown selection
- **Purpose**: Determine sport-specific design elements
- **Default**: "Generic Logo" (no specific sport)
- **Options**: List of sports from existing data
- **Required**: User must select one option

### **Question 3: Logo Style**
- **Type**: Visual selection (4 options)
- **Purpose**: Determine design direction
- **Format**: Image + label selection
- **Required**: User must select one option

## 🏈 **Sport Selection Options**

### **Default Option**
- **Generic Logo**: No specific sport elements
- **Description**: Universal design suitable for any team
- **Use Case**: Non-sport teams, general organizations

### **Sport Options** (from existing data)
- **Soccer**: Ball, goal, field elements
- **Basketball**: Hoop, ball, court elements
- **Baseball**: Bat, ball, diamond elements
- **Football**: Helmet, ball, field elements
- **Hockey**: Stick, puck, rink elements
- **Tennis**: Racket, ball, court elements
- **Swimming**: Water, waves, pool elements
- **Track & Field**: Running, jumping, athletic elements
- **Volleyball**: Net, ball, court elements
- **Golf**: Club, ball, course elements

## 🎨 **Logo Style Options**

### **1. Fun and Playful**
- **Description**: Bright, colorful, cartoon-like designs
- **Target**: Youth teams, recreational leagues
- **Characteristics**: Rounded shapes, bright colors, friendly mascots
- **Sample Image**: `fun-playful-sample.png`
- **Color Palette**: Bright blues, greens, yellows, oranges

### **2. Bold and Competitive**
- **Description**: Strong, confident, professional designs
- **Target**: Competitive teams, older age groups
- **Characteristics**: Sharp lines, strong typography, team colors
- **Sample Image**: `bold-competitive-sample.png`
- **Color Palette**: Deep blues, reds, blacks, whites

### **3. Fierce and Dynamic**
- **Description**: Aggressive, energetic, action-oriented designs
- **Target**: High-energy sports, competitive leagues
- **Characteristics**: Angular shapes, dynamic elements, bold contrasts
- **Sample Image**: `fierce-dynamic-sample.png`
- **Color Palette**: Reds, oranges, blacks, metallic accents

### **4. Classic and Iconic**
- **Description**: Timeless, traditional, heritage-inspired designs
- **Target**: Established teams, traditional sports
- **Characteristics**: Clean lines, classic fonts, traditional symbols
- **Sample Image**: `classic-iconic-sample.png`
- **Color Palette**: Navy, gold, white, classic combinations

## 📱 **Mobile-First Design**

### **Question 1: Team Name Input**
```
┌─────────────────────────────────────┐
│  ← Back    Step 1 of 3              │
│                                     │
│  What's your team name?             │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ Enter your team name            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Continue] →                       │
│                                     │
└─────────────────────────────────────┘
```

### **Question 2: Sport Selection**
```
┌─────────────────────────────────────┐
│  ← Back    Step 1 of 3              │
│                                     │
│  What sport is this for?            │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ Generic Logo ▼                  │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Continue] →                       │
│                                     │
└─────────────────────────────────────┘
```

### **Question 3: Logo Style Selection**
```
┌─────────────────────────────────────┐
│  ← Back    Step 1 of 3              │
│                                     │
│  Choose your logo style:            │
│                                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ [IMAGE] │ │ [IMAGE] │            │
│  │  Fun &  │ │  Bold & │            │
│  │ Playful │ │Competitive│          │
│  └─────────┘ └─────────┘            │
│                                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ [IMAGE] │ │ [IMAGE] │            │
│  │ Fierce &│ │ Classic │            │
│  │ Dynamic │ │ & Iconic│            │
│  └─────────┘ └─────────┘            │
│                                     │
│  [Continue] →                       │
│                                     │
└─────────────────────────────────────┘
```

## 🎨 **Visual Design Specifications**

### **Style Option Cards**
- **Size**: 150px x 150px on mobile
- **Layout**: 2x2 grid on mobile, 4x1 on tablet
- **Spacing**: 16px between cards
- **Border**: 2px solid when unselected, 4px when selected
- **Selection State**: Blue border + subtle shadow

### **Sample Images Needed**
- **fun-playful-sample.png**: Cartoon mascot, bright colors
- **bold-competitive-sample.png**: Strong typography, team colors
- **fierce-dynamic-sample.png**: Angular design, high energy
- **classic-iconic-sample.png**: Traditional emblem, timeless feel

### **Image Requirements**
- **Dimensions**: 300x300px (2x for retina)
- **Format**: PNG with transparency
- **Style**: Flat design, consistent with brand
- **Quality**: High-resolution, professional appearance

## 🎯 **User Experience Flow**

### **Question 1: Team Name**
1. **Input Focus**: Auto-focus on text field
2. **Real-time Validation**: Show character count
3. **Error States**: Clear error messages
4. **Continue Button**: Enabled when valid input

### **Question 2: Sport Selection**
1. **Dropdown Focus**: Auto-focus on dropdown
2. **Default Selection**: "Generic Logo" pre-selected
3. **Sport Options**: Scrollable list of sports
4. **Continue Button**: Enabled when selection made

### **Question 3: Logo Style**
1. **Visual Selection**: Tap to select style
2. **Selection Feedback**: Visual confirmation
3. **Hover States**: Preview on desktop
4. **Continue Button**: Enabled when selection made

## 🎨 **Animation Specifications**

### **Question Transitions**
```css
/* Slide between questions */
.question-container {
  transform: translateX(100%);
  transition: transform 0.4s ease-out;
}

.question-container.active {
  transform: translateX(0);
}

.question-container.prev {
  transform: translateX(-100%);
}
```

### **Style Option Animations**
```css
/* Style option hover/selection */
.style-option {
  transition: all 0.3s ease;
  transform: scale(1);
}

.style-option:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.style-option.selected {
  transform: scale(1.02);
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### **Input Field Animations**
```css
/* Input focus animation */
.team-name-input {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.team-name-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: scale(1.02);
}
```

### **Dropdown Animations**
```css
/* Sport dropdown animation */
.sport-dropdown {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.sport-dropdown:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: scale(1.02);
}

/* Dropdown options animation */
.dropdown-options {
  animation: dropdownSlide 0.3s ease-out;
}

@keyframes dropdownSlide {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 📱 **Mobile-Specific Features**

### **Touch Interactions**
- **Large Touch Targets**: 150px x 150px for style options
- **Touch Feedback**: Scale animation on tap
- **Haptic Feedback**: Vibration on selection
- **Swipe Navigation**: Swipe between questions

### **Keyboard Handling**
- **Auto-focus**: Focus on input when question loads
- **Return Key**: Submit and move to next question
- **Keyboard Dismissal**: Tap outside to dismiss

## 🎯 **Validation Rules**

### **Team Name Validation**
- **Required**: Cannot be empty
- **Length**: 2-50 characters
- **Characters**: Letters, numbers, spaces, hyphens only
- **Trim**: Remove leading/trailing spaces
- **Unique**: Check against existing team names (optional)

### **Sport Selection Validation**
- **Required**: Must select one option
- **Default**: "Generic Logo" pre-selected
- **Valid Options**: Must be from approved sport list
- **Visual Feedback**: Clear selection state

### **Style Selection Validation**
- **Required**: Must select one option
- **Single Selection**: Only one style can be selected
- **Visual Feedback**: Clear selection state

## 🚀 **Implementation Questions**

### **Image Assets**
1. **Do you have existing sample images** for the four style categories?
2. **Should we create mock examples** or wait for real samples?
3. **Any specific design elements** you want in each style sample?
4. **Color preferences** for each style category?

### **User Experience**
1. **Should users be able to go back** to change their team name?
2. **Any character restrictions** on team names?
3. **Should we show a preview** of their selection before continuing?
4. **Any additional validation** needed for team names?

### **Technical Implementation**
1. **Should we save progress** after each question?
2. **Any API calls** needed for team name validation?
3. **How should we handle** invalid team names?
4. **Any analytics tracking** for style selections?

This step-by-step approach with visual style selection will create a much more engaging and guided experience for users!
