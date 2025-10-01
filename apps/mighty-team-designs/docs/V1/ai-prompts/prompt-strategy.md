# AI Prompt Strategy - V1

## 🎯 **Overview**

This document outlines the detailed prompt strategy for AI generation in the Mighty Team Designs app, including color generation, mascot concepts, and logo creation.

## 🎨 **Color Generation Prompts**

### **Base Prompt Structure**
```
You are a professional team logo designer. Generate color palette options for a team logo based on the following information:

Team Name: {team_name}
Sport: {sport}
Logo Style: {logo_style}

Generate 3-5 color palette options that would work well for this team's logo. Each option should include:
- A descriptive name for the color scheme
- 2-3 primary colors with hex codes
- A brief description of why these colors work for this team

Format your response as JSON with this structure:
{
  "color_palettes": [
    {
      "name": "Color Scheme Name",
      "colors": ["#HEX1", "#HEX2", "#HEX3"],
      "description": "Why these colors work for this team"
    }
  ]
}
```

### **Sport-Specific Variations**

#### **Soccer Teams**
```
Focus on colors that represent:
- Grass green and sky blue for outdoor play
- Traditional team colors like navy, red, white
- Energy and movement (bright oranges, yellows)
- Professional appearance for competitive leagues
```

#### **Basketball Teams**
```
Focus on colors that represent:
- Court colors (orange, black, white)
- High energy and athleticism
- Urban/street basketball culture
- Professional league inspiration
```

#### **Youth Teams**
```
Focus on colors that represent:
- Fun and playfulness
- Bright, energetic colors
- Age-appropriate vibrancy
- Positive, encouraging feel
```

### **Style-Specific Variations**

#### **Fun and Playful**
```
Use bright, vibrant colors:
- Primary colors (red, blue, yellow)
- Pastels and brights
- High contrast combinations
- Colors that appeal to children
```

#### **Bold and Competitive**
```
Use strong, professional colors:
- Deep blues, reds, blacks
- High contrast combinations
- Traditional team colors
- Colors that convey strength and determination
```

#### **Fierce and Dynamic**
```
Use aggressive, energetic colors:
- Reds, oranges, blacks
- Metallic accents (gold, silver)
- High contrast, bold combinations
- Colors that convey power and energy
```

#### **Classic and Iconic**
```
Use timeless, traditional colors:
- Navy, gold, white
- Classic combinations
- Professional appearance
- Colors that convey heritage and tradition
```

## 🦅 **Mascot Generation Prompts**

### **Base Prompt Structure**
```
You are a professional team logo designer. Generate mascot concepts for a team logo based on the following information:

Team Name: {team_name}
Sport: {sport}
Logo Style: {logo_style}
Color Palette: {selected_colors}

Generate 4 mascot concepts that would work well for this team's logo. Each concept should include:
- A short, memorable name
- A brief description of the mascot
- Key characteristics that make it suitable for this team
- How it relates to the sport (if applicable)

Format your response as JSON with this structure:
{
  "mascot_concepts": [
    {
      "name": "Mascot Name",
      "description": "Brief description of the mascot",
      "characteristics": ["trait1", "trait2", "trait3"],
      "sport_connection": "How it relates to the sport"
    }
  ]
}
```

### **Sport-Specific Mascot Guidelines**

#### **Soccer Teams**
```
Focus on mascots that represent:
- Speed and agility (eagles, cheetahs, falcons)
- Teamwork and strategy (wolves, lions, bears)
- Ball-related imagery (animals with balls, kicking poses)
- Outdoor/nature themes
```

#### **Basketball Teams**
```
Focus on mascots that represent:
- Height and jumping (eagles, hawks, kangaroos)
- Urban/street culture (bulls, thunder, lightning)
- Court-related imagery (animals with basketballs)
- High energy and athleticism
```

#### **Youth Teams**
```
Focus on mascots that represent:
- Fun and friendly animals
- Positive characteristics (brave, strong, fast)
- Age-appropriate imagery
- Encouraging and inspiring themes
```

### **Style-Specific Mascot Guidelines**

#### **Fun and Playful**
```
Use mascots that are:
- Cartoon-like and friendly
- Bright and colorful
- Smiling and approachable
- Kid-friendly and fun
```

#### **Bold and Competitive**
```
Use mascots that are:
- Strong and confident
- Professional appearance
- Determined and focused
- Athletic and powerful
```

#### **Fierce and Dynamic**
```
Use mascots that are:
- Aggressive and energetic
- Action-oriented poses
- Sharp and angular features
- High energy and movement
```

#### **Classic and Iconic**
```
Use mascots that are:
- Timeless and traditional
- Clean and simple design
- Professional and established
- Heritage and tradition-focused
```

## 🎨 **Logo Generation Prompts**

### **Base Prompt Structure**
```
You are a professional team logo designer. Create a team logo based on the following specifications:

Team Name: {team_name}
Sport: {sport}
Logo Style: {logo_style}
Color Palette: {selected_colors}
Mascot Concept: {selected_mascot}

CRITICAL STYLE REQUIREMENTS:
- Professional vector-style illustration (NOT painterly, sketchy, or hand-drawn)
- Clean, sharp edges with consistent line weights
- Flat design with minimal cell shading only
- Solid color blocks with no gradients
- High contrast colors with clean separation
- No artifacts, noise, or inconsistent details
- Print-ready quality with crisp edges
- Professional sports logo aesthetic
- Clean, modern design principles
- Consistent style throughout the entire logo
- Sharp, precise details
- High resolution, clean output

QUALITY CONTROL REQUIREMENTS:
- Generate a professional sports logo that looks like it was created by a professional graphic designer
- Use clean, vector-style illustration techniques
- Ensure all lines are sharp and consistent
- Use solid colors with no gradients or complex shading
- Maintain high contrast between elements
- Create a design that would work well on uniforms and merchandise
- Avoid any painterly, sketchy, or hand-drawn elements
- Ensure the logo is scalable and print-ready
- Use professional typography if text is included
- Create a design that is both memorable and professional

Create a professional team logo that:
- Incorporates the team name prominently
- Uses the selected color palette
- Features the chosen mascot concept
- Matches the specified logo style
- Is suitable for use on t-shirts, banners, and other team materials
- Works well at both large and small sizes
- Has a clean, professional appearance

Generate 3 different variations of this logo, each with a slightly different approach:
1. Text-focused version (emphasizes team name)
2. Mascot-focused version (emphasizes the mascot)
3. Balanced version (equal emphasis on text and mascot)

Format your response as JSON with this structure:
{
  "logo_variations": [
    {
      "name": "Variation Name",
      "description": "Brief description of this variation",
      "focus": "text-focused, mascot-focused, or balanced",
      "key_elements": ["element1", "element2", "element3"]
    }
  ]
}
```

### **Style-Specific Logo Guidelines**

#### **Fun and Playful**
```
STYLE CHARACTERISTICS:
- Cartoonish, friendly appearance
- Rounded, approachable shapes
- Bright, vibrant colors (yellow, orange, blue, green)
- Medium-weight outlines
- Smiling, positive expressions
- Playful but professional

Design elements to include:
- Rounded, soft shapes
- Bright, vibrant colors
- Cartoon-like mascot
- Friendly, approachable typography
- Playful details and elements
- High energy and movement
```

#### **Bold and Competitive**
```
STYLE CHARACTERISTICS:
- Strong, angular shapes
- High contrast colors (black, white, red, navy)
- Thick, bold outlines
- Powerful, impactful design
- Clean, geometric forms
- Professional and strong

Design elements to include:
- Sharp, strong lines
- High contrast colors
- Professional typography
- Confident, determined mascot
- Clean, modern design
- Athletic and powerful feel
```

#### **Fierce and Dynamic**
```
STYLE CHARACTERISTICS:
- Dynamic, flowing shapes
- Bold, energetic colors (red, orange, black, gold)
- Varied line weights (thick for main elements)
- Action-oriented design
- Energetic but professional
- Strong visual impact

Design elements to include:
- Angular, aggressive shapes
- Bold, energetic colors
- Action-oriented mascot
- Strong, impactful typography
- Dynamic movement and flow
- High energy and power
```

#### **Classic and Iconic**
```
STYLE CHARACTERISTICS:
- Timeless, traditional shapes
- Classic color combinations (navy, gold, maroon, white)
- Clean, consistent outlines
- Balanced, symmetrical design
- Professional and enduring
- Iconic, memorable appearance

Design elements to include:
- Clean, simple lines
- Traditional color combinations
- Timeless mascot design
- Classic, readable typography
- Balanced composition
- Professional and established feel
```

## 🔄 **Prompt Refinement Strategy**

### **Iterative Improvement**
1. **Start with Base Prompts**: Use the standard prompt structure
2. **Test with Sample Data**: Try with different team combinations
3. **Refine Based on Results**: Adjust prompts based on output quality
4. **A/B Test Variations**: Compare different prompt approaches
5. **Optimize for Consistency**: Ensure reliable, high-quality results

### **Quality Control**
- **Consistency**: Similar inputs should produce similar quality outputs
- **Relevance**: Outputs should match the input parameters
- **Professionalism**: All outputs should look professional
- **Variety**: Different inputs should produce different outputs
- **Appropriateness**: Outputs should be suitable for the target audience

### **Error Handling**
- **Fallback Prompts**: Simpler prompts if complex ones fail
- **Retry Logic**: Retry with slightly modified prompts
- **Quality Validation**: Check outputs before showing to users
- **User Feedback**: Learn from user selections to improve prompts

## 📊 **Quality Metrics & Success Factors**

### **Visual Quality Score (Based on King Cobra Analysis)**
- **Clean Edges**: 25 points (sharp, consistent)
- **Professional Style**: 25 points (vector-like, not painterly)
- **Color Quality**: 25 points (high contrast, print-safe)
- **Composition**: 25 points (balanced, clear hierarchy)

### **Minimum Quality Threshold**
- **Overall Score**: 85+ points
- **Style Consistency**: 95+ points
- **Edge Quality**: 90+ points

### **Success Factors (From King Cobra Logo)**
- **Professional Illustration Standards**: Clean lines, consistent style, vector-like quality, no artifacts
- **Flat Design Principles**: Solid colors, minimal shading, clean separation, bold graphics
- **Color Strategy**: Limited palette (3-4 colors), high contrast, print-safe colors, appropriate tone
- **Composition Excellence**: Central focus, balanced layout, clear hierarchy, no clutter

### **Prompt Performance Metrics**

#### **Success Metrics**
- **Relevance Score**: How well outputs match input parameters
- **Quality Score**: Professional appearance and design quality
- **Variety Score**: Diversity of outputs for similar inputs
- **User Satisfaction**: User selection rates and feedback
- **Consistency Score**: Similar outputs for similar inputs

#### **Optimization Targets**
- **Relevance**: >90% of outputs should match input parameters
- **Quality**: >95% of outputs should look professional
- **Variety**: <30% similarity between different outputs
- **User Satisfaction**: >80% of users should find outputs useful
- **Consistency**: >85% similarity for identical inputs

## 🚀 **Implementation Notes**

### **Prompt Engineering Best Practices**
1. **Be Specific**: Include all relevant details in prompts
2. **Use Examples**: Include examples of desired outputs
3. **Test Thoroughly**: Test with various input combinations
4. **Iterate Quickly**: Make small changes and test results
5. **Monitor Performance**: Track metrics and adjust accordingly

### **Technical Considerations**
- **Token Limits**: Keep prompts within model token limits
- **Response Format**: Use structured JSON for consistent parsing
- **Error Handling**: Include fallback prompts for failures
- **Caching**: Cache successful prompts for reuse
- **Versioning**: Track prompt versions for A/B testing

This prompt strategy ensures consistent, high-quality AI generation that matches user expectations and produces professional team logos!
